-- Trigger to create in-app notifications when verification status changes
CREATE OR REPLACE FUNCTION public.notify_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kind text;
  v_title text;
  v_body text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_kind := 'verification_pending';
    v_title := initcap(NEW.kind::text) || ' verification submitted';
    v_body := 'We received your ' || NEW.kind::text || ' verification. We''ll review it shortly.';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      v_kind := 'verification_approved';
      v_title := initcap(NEW.kind::text) || ' verification approved';
      v_body := 'Your ' || NEW.kind::text || ' verification was approved.';
    ELSIF NEW.status = 'rejected' THEN
      v_kind := 'verification_rejected';
      v_title := initcap(NEW.kind::text) || ' verification needs attention';
      v_body := COALESCE(NULLIF(NEW.notes, ''), 'Your ' || NEW.kind::text || ' verification was not approved. Please review and resubmit.');
    ELSIF NEW.status = 'in_review' THEN
      v_kind := 'verification_in_review';
      v_title := initcap(NEW.kind::text) || ' verification under review';
      v_body := 'A moderator is reviewing your ' || NEW.kind::text || ' verification.';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (NEW.user_id, v_kind, v_title, v_body, '/profile');

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_verification_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_notify_verification_insert ON public.verifications;
CREATE TRIGGER trg_notify_verification_insert
AFTER INSERT ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.notify_verification_status();

DROP TRIGGER IF EXISTS trg_notify_verification_update ON public.verifications;
CREATE TRIGGER trg_notify_verification_update
AFTER UPDATE ON public.verifications
FOR EACH ROW EXECUTE FUNCTION public.notify_verification_status();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications';
  END IF;
END $$;