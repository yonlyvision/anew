-- ============================================================
-- RESET + FULL SCHEMA for Second Chapter Connections
-- Safe: this project has no real data. This wipes the public
-- schema (clearing any half-built tables) and rebuilds it
-- cleanly, then recreates storage policies + buckets.
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

drop schema if exists public cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;
grant all on schema public to postgres, service_role;

-- Clear existing storage.objects policies so the CREATE POLICY
-- statements below are safe to run repeatedly.
do $reset$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname='storage' and tablename='objects' loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end
$reset$;


-- ============================================================
-- 20260603174738_c434939b-e72e-4ec4-bffd-f681e7d41d97.sql
-- ============================================================


-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE public.gender AS ENUM ('woman', 'man', 'nonbinary', 'other', 'prefer_not_to_say');
CREATE TYPE public.dating_preference AS ENUM ('women', 'men', 'everyone');
CREATE TYPE public.relationship_goal AS ENUM ('long_term', 'friendship', 'open_to_explore', 'marriage');
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.verification_kind AS ENUM ('email', 'phone', 'selfie');
CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
CREATE TYPE public.subscription_tier AS ENUM ('free', 'monthly', 'three_month', 'six_month', 'yearly');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired', 'pending');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  date_of_birth DATE,
  gender public.gender,
  dating_preference public.dating_preference,
  city TEXT,
  country TEXT,
  bio TEXT,
  relationship_goal public.relationship_goal,
  interests TEXT[] DEFAULT '{}',
  values TEXT[] DEFAULT '{}',
  new_chapter_answer TEXT,
  open_to_second_chance BOOLEAN DEFAULT false,
  photos TEXT[] DEFAULT '{}',
  primary_photo TEXT,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  selfie_verified BOOLEAN DEFAULT false,
  is_paused BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  profile_completion INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view non-paused profiles" ON public.profiles FOR SELECT TO authenticated
  USING (NOT is_paused OR id = auth.uid());
CREATE POLICY "Members insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Members update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Members read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ LIKES ============
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (liker_id, liked_id),
  CHECK (liker_id <> liked_id)
);
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read likes they sent or received" ON public.likes FOR SELECT TO authenticated
  USING (liker_id = auth.uid() OR liked_id = auth.uid());
CREATE POLICY "Members create own likes" ON public.likes FOR INSERT TO authenticated
  WITH CHECK (liker_id = auth.uid());
CREATE POLICY "Members remove own likes" ON public.likes FOR DELETE TO authenticated
  USING (liker_id = auth.uid());

-- ============ MATCHES ============
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unmatched_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unmatched_at TIMESTAMPTZ,
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);
GRANT SELECT, INSERT, UPDATE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own matches" ON public.matches FOR SELECT TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid());
CREATE POLICY "Members can unmatch" ON public.matches FOR UPDATE TO authenticated
  USING (user_a = auth.uid() OR user_b = auth.uid())
  WITH CHECK (user_a = auth.uid() OR user_b = auth.uid());

-- Auto-create match on mutual like
CREATE OR REPLACE FUNCTION public.create_match_on_mutual_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _a UUID; _b UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.likes WHERE liker_id = NEW.liked_id AND liked_id = NEW.liker_id) THEN
    _a := LEAST(NEW.liker_id, NEW.liked_id);
    _b := GREATEST(NEW.liker_id, NEW.liked_id);
    INSERT INTO public.matches (user_a, user_b) VALUES (_a, _b) ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER likes_create_match AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.create_match_on_mutual_like();

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read messages in own matches" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id
    AND (m.user_a = auth.uid() OR m.user_b = auth.uid())));
CREATE POLICY "Members send messages in own matches" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.matches m WHERE m.id = match_id
    AND m.unmatched_at IS NULL
    AND (m.user_a = auth.uid() OR m.user_b = auth.uid())));
CREATE POLICY "Members mark own messages read" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.matches m WHERE m.id = match_id
    AND (m.user_a = auth.uid() OR m.user_b = auth.uid())))
  WITH CHECK (true);

-- ============ REPORTS ============
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members file reports" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Members read own reports; mods read all" ON public.reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mods update reports" ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- ============ BLOCKS ============
CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own blocks" ON public.blocks FOR ALL TO authenticated
  USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Members update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Members delete own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ VERIFICATIONS ============
CREATE TABLE public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.verification_kind NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  evidence_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
GRANT SELECT, INSERT ON public.verifications TO authenticated;
GRANT ALL ON public.verifications TO service_role;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage own verifications" ON public.verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members submit own verifications" ON public.verifications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ BLOG POSTS ============
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL,
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published posts" ON public.blog_posts FOR SELECT TO anon, authenticated
  USING (published OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage posts" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER blog_posts_set_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SUCCESS STORIES ============
CREATE TABLE public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  cover_image TEXT,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.success_stories TO anon, authenticated;
GRANT INSERT ON public.success_stories TO authenticated;
GRANT ALL ON public.success_stories TO service_role;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads published stories" ON public.success_stories FOR SELECT TO anon, authenticated
  USING (published OR submitted_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Members submit stories" ON public.success_stories FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Admins manage stories" ON public.success_stories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ CONTACT MESSAGES ============
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submits contact" ON public.contact_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Staff read contact" ON public.contact_messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff update contact" ON public.contact_messages FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read own subscription" ON public.subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subscriptions_set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ INDEXES ============
CREATE INDEX idx_likes_liked_id ON public.likes(liked_id);
CREATE INDEX idx_matches_user_a ON public.matches(user_a);
CREATE INDEX idx_matches_user_b ON public.matches(user_b);
CREATE INDEX idx_messages_match_id ON public.messages(match_id, created_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_profiles_dating_preference ON public.profiles(dating_preference);



-- ============================================================
-- 20260603174757_919d4609-f518-4fbf-ab20-04accf0898be.sql
-- ============================================================


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



-- ============================================================
-- 20260603174900_2771b6e9-9dd7-494d-aa36-c55d5fa2072d.sql
-- ============================================================


-- profile-photos: path convention is "<user_id>/<filename>"
CREATE POLICY "Members view profile photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');
CREATE POLICY "Members upload own profile photos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Members update own profile photos" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Members delete own profile photos" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- verifications: members upload own evidence; staff read
CREATE POLICY "Members upload own verifications" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verifications' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Members view own verifications" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verifications' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'admin')
  ));



-- ============================================================
-- 20260603180201_ebeac574-8a0b-4b5a-a8bc-d8e16fc674fd.sql
-- ============================================================


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



-- ============================================================
-- 20260603180216_542b932b-04fb-480d-9b62-dace0a837554.sql
-- ============================================================


REVOKE EXECUTE ON FUNCTION public.sync_profile_verification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_match_on_mutual_like() FROM PUBLIC, anon, authenticated;



-- ============================================================
-- 20260603180703_988aa7f8-b3e9-461a-ba39-887f06823007.sql
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verifications;


-- ============================================================
-- 20260603181139_27c8f228-957d-4573-a0f2-2aad4d530e20.sql
-- ============================================================

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


-- ============================================================
-- 20260603190243_b6a5d178-4e14-4b79-ab86-e70fc6a9ce58.sql
-- ============================================================


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



-- ============================================================
-- 20260603190258_1dff4873-c4a0-4246-92f4-3f48be59f4f3.sql
-- ============================================================


REVOKE ALL ON FUNCTION public.notify_match_created() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.notify_new_message() FROM PUBLIC, authenticated, anon;



-- ============================================================
-- 20260603190315_0e617935-2a3a-462b-980a-2f3bb8d627a1.sql
-- ============================================================


REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.create_match_on_mutual_like() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.sync_profile_verification() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.notify_verification_status() FROM PUBLIC, authenticated, anon;



-- ============================================================
-- 20260604002032_e7898184-24bb-42e9-8006-18d801753eec.sql
-- ============================================================


ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS price_id text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

GRANT ALL ON public.subscriptions TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_sub_env_unique
  ON public.subscriptions (stripe_subscription_id, environment)
  WHERE stripe_subscription_id IS NOT NULL;



-- ============================================================
-- 20260619160000_applications_table_and_hook.sql
-- ============================================================

-- Pre-signup interest applications.
-- Visitors apply (no password) -> admin approves/denies -> only an approved
-- email is allowed to actually create an account via /auth?mode=signup.

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

alter table public.applications enable row level security;
-- No anon/authenticated policies on purpose: all reads/writes go through
-- server functions using the service role (same pattern as verifications,
-- reports, contact_messages). The hook function below is SECURITY DEFINER
-- so it can read this table without needing its own policy.

create or replace function public.hook_require_approved_application(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_email text := lower(event->'user'->>'email');
  is_approved boolean;
begin
  select exists (
    select 1 from public.applications
    where lower(email) = signup_email
      and status = 'approved'
  ) into is_approved;

  if is_approved then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 400,
      'message', 'This email has not been approved yet. Submit an application first — you can create your account once it''s accepted.'
    )
  );
end;
$$;

grant execute
  on function public.hook_require_approved_application
  to supabase_auth_admin;

revoke execute
  on function public.hook_require_approved_application
  from authenticated, anon, public;



-- ============================================================
-- 20260628000000_create_storage_buckets.sql
-- ============================================================

-- Create the storage buckets the app relies on.
-- Lovable Cloud created these via its dashboard, so they were missing from the
-- migration history. On a self-hosted Supabase project the buckets must exist
-- before the storage RLS policies (defined in earlier migrations) have anything
-- to apply to. Both are PRIVATE — the app serves files through signed URLs.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('profile-photos', 'profile-photos', false),
  ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

