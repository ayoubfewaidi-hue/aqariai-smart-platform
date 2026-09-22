-- enums
CREATE TYPE public.user_role AS ENUM ('owner', 'agent', 'user');
CREATE TYPE public.area_level AS ENUM ('country', 'governorate', 'district', 'basin');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- areas (self-referencing hierarchy)
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  parent_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  level public.area_level NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX areas_unique_name_level ON public.areas (name_normalized, level);
CREATE INDEX areas_parent_idx ON public.areas (parent_id);
GRANT SELECT ON public.areas TO anon;
GRANT SELECT ON public.areas TO authenticated;
GRANT ALL ON public.areas TO service_role;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "areas_public_read" ON public.areas FOR SELECT TO anon, authenticated USING (true);

-- properties
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  desc_ar TEXT,
  type TEXT NOT NULL DEFAULT 'أرض',
  deal_type TEXT NOT NULL DEFAULT 'بيع' CHECK (deal_type IN ('بيع', 'إيجار')),
  price NUMERIC(14,2),
  price_per_m NUMERIC(12,2),
  area_m2 NUMERIC(12,2),
  negotiable_min NUMERIC(14,2),
  negotiable_max NUMERIC(14,2),
  governorate TEXT,
  district TEXT,
  district_normalized TEXT,
  basin TEXT,
  plot TEXT,
  zoning TEXT,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  features TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  coordinates TEXT,
  score NUMERIC(5,2),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  views_count INTEGER NOT NULL DEFAULT 0,
  inquiries_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX properties_owner_idx ON public.properties (owner_id);
CREATE INDEX properties_status_idx ON public.properties (status);
CREATE INDEX properties_district_norm_idx ON public.properties (district_normalized);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT SELECT ON public.properties TO anon;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties_public_read_published" ON public.properties FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "properties_select_own" ON public.properties FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "properties_insert_own" ON public.properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "properties_update_own" ON public.properties FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "properties_delete_own" ON public.properties FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- favorites
CREATE TABLE public.favorites (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- inquiries
CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inquiries_property_idx ON public.inquiries (property_id);
GRANT SELECT, INSERT ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inquiries_select_own" ON public.inquiries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "inquiries_select_property_owner" ON public.inquiries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));
CREATE POLICY "inquiries_insert_own" ON public.inquiries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER properties_touch_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- view counter
CREATE OR REPLACE FUNCTION public.increment_property_views(_property_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.properties SET views_count = views_count + 1
  WHERE id = _property_id AND status = 'published';
$$;
GRANT EXECUTE ON FUNCTION public.increment_property_views(UUID) TO anon, authenticated, service_role;

-- inquiry counter
CREATE OR REPLACE FUNCTION public.bump_inquiries_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties SET inquiries_count = inquiries_count + 1 WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER inquiries_bump_counter AFTER INSERT ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.bump_inquiries_count();

-- storage policies for property-images bucket (owner-scoped folders, authenticated read)
CREATE POLICY "property_images_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images');
CREATE POLICY "property_images_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "property_images_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "property_images_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);