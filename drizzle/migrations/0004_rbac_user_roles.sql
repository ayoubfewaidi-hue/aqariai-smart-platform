CREATE TYPE public.app_role AS ENUM ('buyer','seller','admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, CASE WHEN role IN ('owner','agent') THEN 'seller'::public.app_role ELSE 'buyer'::public.app_role END
FROM public.profiles ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _meta_role text := NEW.raw_user_meta_data ->> 'role';
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    CASE WHEN _meta_role IN ('owner','agent','user') THEN _meta_role::public.user_role ELSE 'user' END
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN _meta_role IN ('owner','agent','seller') THEN 'seller'::public.app_role ELSE 'buyer'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED for permissions: roles live in public.user_roles';

DROP POLICY IF EXISTS properties_insert_own ON public.properties;
CREATE POLICY properties_insert_seller ON public.properties FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND (public.has_role(auth.uid(),'seller') OR public.has_role(auth.uid(),'admin')));

CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT p.id, p.full_name, p.created_at FROM public.profiles p;
GRANT SELECT ON public.public_profiles TO anon, authenticated;