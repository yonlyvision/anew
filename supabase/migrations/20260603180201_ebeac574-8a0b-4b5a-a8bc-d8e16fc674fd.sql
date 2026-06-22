
-- Allow moderators/admins to update verifications
CREATE POLICY "Mods update verifications"
ON public.verifications
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- Trigger to sync profile flags when a verification is approved
CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    IF NEW.kind = 'email' THEN
      UPDATE public.profiles SET email_verified = true WHERE id = NEW.user_id;
    ELSIF NEW.kind = 'phone' THEN
      UPDATE public.profiles SET phone_verified = true WHERE id = NEW.user_id;
    ELSIF NEW.kind = 'selfie' THEN
      UPDATE public.profiles SET selfie_verified = true WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_verification_trg ON public.verifications;
CREATE TRIGGER sync_profile_verification_trg
AFTER UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

-- Storage policies for the verifications bucket (private)
-- Path convention: <user_id>/<filename>
CREATE POLICY "Users upload own verification files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verifications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users read own verification files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'verifications'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Users delete own verification files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verifications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
