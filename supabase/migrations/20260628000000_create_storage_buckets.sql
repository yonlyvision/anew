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
