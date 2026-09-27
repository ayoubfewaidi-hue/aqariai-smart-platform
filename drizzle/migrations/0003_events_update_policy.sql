CREATE POLICY events_update_processing ON public.events
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);