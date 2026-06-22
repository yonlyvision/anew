
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.create_match_on_mutual_like() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.sync_profile_verification() FROM PUBLIC, authenticated, anon;
REVOKE ALL ON FUNCTION public.notify_verification_status() FROM PUBLIC, authenticated, anon;
