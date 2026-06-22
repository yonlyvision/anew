
CREATE OR REPLACE FUNCTION public.notify_match_created()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name_a TEXT;
  v_name_b TEXT;
BEGIN
  SELECT first_name INTO v_name_a FROM public.profiles WHERE id = NEW.user_a;
  SELECT first_name INTO v_name_b FROM public.profiles WHERE id = NEW.user_b;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    NEW.user_a,
    'match_created',
    COALESCE(v_name_b, 'Someone') || ' liked you back',
    'You matched with ' || COALESCE(v_name_b, 'someone') || '. Start a conversation.',
    '/messages/' || NEW.id
  );

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    NEW.user_b,
    'match_created',
    COALESCE(v_name_a, 'Someone') || ' liked you back',
    'You matched with ' || COALESCE(v_name_a, 'someone') || '. Start a conversation.',
    '/messages/' || NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER matches_notify AFTER INSERT ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.notify_match_created();

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match RECORD;
  v_recipient UUID;
  v_sender_name TEXT;
  v_match_id UUID;
BEGIN
  v_match_id := NEW.match_id;

  SELECT * INTO v_match FROM public.matches WHERE id = v_match_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.sender_id = v_match.user_a THEN
    v_recipient := v_match.user_b;
  ELSE
    v_recipient := v_match.user_a;
  END IF;

  SELECT first_name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    v_recipient,
    'new_message',
    COALESCE(v_sender_name, 'Someone') || ' sent a message',
    LEFT(NEW.body, 120),
    '/messages/' || v_match_id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_notify AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
