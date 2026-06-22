
-- Lock down SECURITY DEFINER helpers so only the database engine (triggers) calls them
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_match_on_mutual_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- has_role is intentionally callable by signed-in users (used inside RLS); restrict from anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Tighten WITH CHECK on permissive policies
DROP POLICY IF EXISTS "Members mark own messages read" ON public.messages;
CREATE POLICY "Members mark own messages read" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id
    AND (m.user_a = auth.uid() OR m.user_b = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id
    AND (m.user_a = auth.uid() OR m.user_b = auth.uid())));

DROP POLICY IF EXISTS "Anyone submits contact" ON public.contact_messages;
CREATE POLICY "Anyone submits contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (length(name) BETWEEN 1 AND 200
    AND length(email) BETWEEN 3 AND 320
    AND length(message) BETWEEN 1 AND 5000);
