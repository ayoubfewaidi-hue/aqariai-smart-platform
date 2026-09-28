CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly','yearly')),
  previous_plan text,
  scheduled_plan text CHECK (scheduled_plan IS NULL OR scheduled_plan IN ('free','pro','business')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  granted_by uuid,
  source text NOT NULL DEFAULT 'direct',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX subscriptions_one_active ON public.subscriptions(user_id) WHERE status = 'active';
CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscriptions_select_own ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subscriptions_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY services_public_read ON public.services FOR SELECT TO anon, authenticated USING (is_active);

CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  price numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'direct',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT, INSERT ON public.service_orders TO authenticated;
GRANT ALL ON public.service_orders TO service_role;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_orders_select_own ON public.service_orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY service_orders_insert_own ON public.service_orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE OR REPLACE FUNCTION public.service_order_set_price() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT price INTO NEW.price FROM public.services WHERE id = NEW.service_id AND is_active;
  IF NEW.price IS NULL THEN RAISE EXCEPTION 'service unavailable'; END IF;
  NEW.status := 'pending'; NEW.completed_at := NULL;
  RETURN NEW;
END $$;
CREATE TRIGGER service_orders_price BEFORE INSERT ON public.service_orders FOR EACH ROW EXECUTE FUNCTION public.service_order_set_price();

INSERT INTO public.services (name_ar, name_en, description, price, duration_days, category) VALUES
 ('توليد إعلان عقاري','AI Listing Ad','إعلان تسويقي احترافي مولّد بالذكاء الاصطناعي',25,1,'marketing'),
 ('تقييم استثماري','Investment Valuation','تقرير تقييم وتحليل عائد استثماري',75,3,'analysis'),
 ('بناء 3D','3D Build','نموذج ثلاثي الأبعاد لما يمكن أن يصبح عليه العقار',300,10,'visualization'),
 ('جولة 360°','360° Tour','جولة افتراضية 360 درجة',250,7,'visualization');

-- Effective plan: expired => free
CREATE OR REPLACE FUNCTION public.effective_plan(_user_id uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT plan FROM public.subscriptions WHERE user_id = _user_id AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now()) ORDER BY started_at DESC LIMIT 1), 'free')
$$;

CREATE OR REPLACE FUNCTION public.is_verified_broker(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.effective_plan(_user_id) IN ('pro','business')
$$;

-- Returns only verified flag + ranking weight (plan itself never exposed)
CREATE OR REPLACE FUNCTION public.broker_ranks(_user_ids uuid[]) RETURNS TABLE(user_id uuid, verified boolean, rank_weight int)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u, public.effective_plan(u) IN ('pro','business'),
    CASE public.effective_plan(u) WHEN 'business' THEN 2 WHEN 'pro' THEN 1 ELSE 0 END
  FROM unnest(_user_ids) AS u
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_subscription(_user_id uuid, _plan text, _period text DEFAULT 'monthly')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _prev text; _prev_id uuid; _new_id uuid; _exp timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _plan NOT IN ('free','pro','business') OR _period NOT IN ('monthly','yearly') THEN RAISE EXCEPTION 'invalid input'; END IF;
  UPDATE public.subscriptions SET status = 'expired' WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= now();
  SELECT id, plan INTO _prev_id, _prev FROM public.subscriptions WHERE user_id = _user_id AND status = 'active' LIMIT 1;
  UPDATE public.subscriptions SET status = 'cancelled', cancelled_at = now() WHERE id = _prev_id;
  _exp := CASE WHEN _plan = 'free' THEN NULL WHEN _period = 'yearly' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;
  INSERT INTO public.subscriptions (user_id, plan, billing_period, previous_plan, expires_at, granted_by, source)
  VALUES (_user_id, _plan, _period, _prev, _exp, auth.uid(), 'admin') RETURNING id INTO _new_id;
  RETURN jsonb_build_object('id', _new_id, 'previous_plan', _prev, 'plan', _plan, 'expires_at', _exp);
END $$;

-- Downgrade: scheduled for end of period
CREATE OR REPLACE FUNCTION public.schedule_downgrade(_plan text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _plan NOT IN ('free','pro') THEN RAISE EXCEPTION 'invalid plan'; END IF;
  UPDATE public.subscriptions SET scheduled_plan = _plan
  WHERE user_id = auth.uid() AND status = 'active' AND expires_at > now();
END $$;

-- Cancel: stays valid until expiry, no renewal
CREATE OR REPLACE FUNCTION public.cancel_my_subscription() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.subscriptions SET scheduled_plan = 'free', cancelled_at = now()
  WHERE user_id = auth.uid() AND status = 'active';
END $$;

REVOKE EXECUTE ON FUNCTION public.admin_grant_subscription(uuid,text,text), public.schedule_downgrade(text), public.cancel_my_subscription() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_grant_subscription(uuid,text,text), public.schedule_downgrade(text), public.cancel_my_subscription() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_verified_broker(uuid), public.broker_ranks(uuid[]) TO anon, authenticated;