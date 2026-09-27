CREATE OR REPLACE FUNCTION public.grant_bootstrap_admin()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF lower((SELECT email FROM auth.users WHERE id = NEW.id)) = 'ayoubfewaidii@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_bootstrap_admin AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.grant_bootstrap_admin();