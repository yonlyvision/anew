import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { signProfilePhotoUrls, withPrimaryPhotoUrls } from "@/lib/photos.server";

const MESSAGE_RATE_LIMIT = 60;
const MESSAGE_RATE_WINDOW_MS = 60 * 60 * 1000;

export const discoverProfiles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: me } = await supabase
      .from("profiles")
      .select("gender,dating_preference")
      .eq("id", userId)
      .single();

    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id,blocker_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    const blockedIds = new Set<string>();
    for (const b of blocks ?? []) {
      if (b.blocker_id === userId) blockedIds.add(b.blocked_id);
      else blockedIds.add(b.blocker_id);
    }

    const { data: likes } = await supabase
      .from("likes")
      .select("liked_id")
      .eq("liker_id", userId);

    const likedIds = new Set((likes ?? []).map((l) => l.liked_id));

    let query = supabase
      .from("profiles")
      .select(
        "id,first_name,bio,city,country,date_of_birth,gender,dating_preference,relationship_goal,primary_photo,photos,values,interests,new_chapter_answer,open_to_second_chance,profile_completion,onboarding_completed,is_paused,is_premium,selfie_verified,email_verified,phone_verified,last_active"
      )
      .neq("id", userId)
      .eq("is_paused", false)
      .eq("onboarding_completed", true);

    const prefToGender: Record<string, string> = {
      women: "woman",
      men: "man",
    };
    if (me?.dating_preference && me.dating_preference !== "everyone") {
      const targetGender = prefToGender[me.dating_preference];
      if (targetGender) query = query.eq("gender", targetGender as never);
    }

    const { data, error } = await query.order("last_active", { ascending: false }).limit(50);

    if (error) throw new Error(error.message);

    const genderToPref: Record<string, string> = {
      woman: "women",
      man: "men",
    };
    const rows = (data ?? []).filter((p) => {
      if (blockedIds.has(p.id)) return false;
      if (likedIds.has(p.id)) return false;
      if (me?.gender && p.dating_preference && p.dating_preference !== "everyone") {
        const myPref = genderToPref[me.gender];
        if (myPref && p.dating_preference !== myPref) return false;
      }
      return true;
    });

    const urlMap = await signProfilePhotoUrls(supabase, rows.map((r) => r.primary_photo));

    const profileIds = rows.map((r) => r.id);
    let promptRows: Array<{ user_id: string; prompt_key: string; answer: string }> = [];
    if (profileIds.length) {
      const { data: pr } = await supabase
        .from("profile_prompts")
        .select("user_id,prompt_key,answer")
        .in("user_id", profileIds);
      promptRows = pr ?? [];
    }
    const promptMap = new Map<string, Array<{ prompt_key: string; answer: string }>>();
    for (const pr of promptRows) {
      const list = promptMap.get(pr.user_id) ?? [];
      list.push({ prompt_key: pr.prompt_key, answer: pr.answer });
      promptMap.set(pr.user_id, list);
    }

    return {
      profiles: withPrimaryPhotoUrls(rows, urlMap).map((p) => ({
        ...p,
        prompts: promptMap.get(p.id) ?? [],
      })),
    };
  });

export const searchProfiles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        query: z.string().max(120).optional(),
        city: z.string().max(120).optional(),
        ageMin: z.number().min(18).max(99).optional(),
        ageMax: z.number().min(18).max(99).optional(),
        gender: z.enum(["woman", "man", "nonbinary", "other"]).optional(),
        goal: z
          .enum(["long_term", "friendship", "open_to_explore", "marriage"])
          .optional(),
        secondChanceOnly: z.boolean().optional(),
        verifiedOnly: z.boolean().optional(),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id,blocker_id")
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blockedIds = new Set<string>();
    for (const b of blocks ?? []) {
      blockedIds.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
    }

    let q = supabase
      .from("profiles")
      .select(
        "id,first_name,bio,city,country,date_of_birth,gender,dating_preference,relationship_goal,primary_photo,values,interests,new_chapter_answer,open_to_second_chance,selfie_verified,email_verified,phone_verified,is_premium,profile_completion,last_active"
      )
      .neq("id", userId)
      .eq("is_paused", false)
      .eq("onboarding_completed", true);

    if (data.gender) q = q.eq("gender", data.gender as never);
    if (data.goal) q = q.eq("relationship_goal", data.goal as never);
    if (data.secondChanceOnly) q = q.eq("open_to_second_chance", true);
    if (data.verifiedOnly) q = q.eq("selfie_verified", true);
    if (data.city && data.city.trim()) {
      q = q.ilike("city", `%${data.city.trim()}%`);
    }
    if (data.query && data.query.trim()) {
      const term = `%${data.query.trim()}%`;
      q = q.or(`first_name.ilike.${term},bio.ilike.${term},new_chapter_answer.ilike.${term}`);
    }
    if (data.ageMax) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - data.ageMax - 1);
      q = q.gte("date_of_birth", d.toISOString().slice(0, 10));
    }
    if (data.ageMin) {
      const d = new Date();
      d.setFullYear(d.getFullYear() - data.ageMin);
      q = q.lte("date_of_birth", d.toISOString().slice(0, 10));
    }

    const { data: rows, error } = await q
      .order("last_active", { ascending: false })
      .limit(80);

    if (error) throw new Error(error.message);

    const urlMap = await signProfilePhotoUrls(
      supabase,
      (rows ?? []).map((p) => p.primary_photo),
    );

    return {
      profiles: withPrimaryPhotoUrls(
        (rows ?? []).filter((p) => !blockedIds.has(p.id)),
        urlMap,
      ),
    };
  });

export const FREE_DAILY_LIKE_LIMIT = 20;

async function isUserPremium(
  supabase: ReturnType<typeof Object>,
  userId: string,
): Promise<boolean> {
  const { data } = await (supabase as any)
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.is_premium;
}

async function countLikesToday(
  supabase: ReturnType<typeof Object>,
  userId: string,
): Promise<number> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await (supabase as any)
    .from("likes")
    .select("id", { count: "exact", head: true })
    .eq("liker_id", userId)
    .gte("created_at", since.toISOString());
  return count ?? 0;
}

export const getLikeQuota = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const premium = await isUserPremium(supabase, userId);
    if (premium) {
      return { premium: true, used: 0, limit: null as number | null, remaining: null as number | null };
    }
    const used = await countLikesToday(supabase, userId);
    return {
      premium: false,
      used,
      limit: FREE_DAILY_LIKE_LIMIT,
      remaining: Math.max(0, FREE_DAILY_LIKE_LIMIT - used),
    };
  });

export const sendLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ likedId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.likedId === userId) throw new Error("Cannot like yourself");

    const premium = await isUserPremium(supabase, userId);
    if (!premium) {
      const used = await countLikesToday(supabase, userId);
      if (used >= FREE_DAILY_LIKE_LIMIT) {
        throw new Error(
          `Daily like limit reached (${FREE_DAILY_LIKE_LIMIT}/day on Free). Upgrade to Premium for unlimited likes.`,
        );
      }
    }

    const { error } = await supabase.from("likes").insert({
      liker_id: userId,
      liked_id: data.likedId,
    });

    if (error) throw new Error(error.message);

    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .or(`and(user_a.eq.${userId},user_b.eq.${data.likedId}),and(user_a.eq.${data.likedId},user_b.eq.${userId})`)
      .is("unmatched_at", null)
      .maybeSingle();

    return { ok: true, matched: !!match, matchId: match?.id ?? null };
  });

export const getLikes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: sent }, { data: received }] = await Promise.all([
      supabase
        .from("likes")
        .select("id,liked_id,created_at")
        .eq("liker_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("likes")
        .select("id,liker_id,created_at")
        .eq("liked_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    const allIds = new Set<string>();
    for (const s of sent ?? []) allIds.add(s.liked_id);
    for (const r of received ?? []) allIds.add(r.liker_id);

    let profiles: Array<{
      id: string;
      first_name: string | null;
      primary_photo: string | null;
      city: string | null;
      country: string | null;
    }> = [];

    if (allIds.size > 0) {
      const { data: pData } = await supabase
        .from("profiles")
        .select("id,first_name,primary_photo,city,country")
        .in("id", Array.from(allIds));
      profiles = pData ?? [];
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const urlMap = await signProfilePhotoUrls(supabase, profiles.map((p) => p.primary_photo));

    const withUrls = (p: (typeof profiles)[number] | null) =>
      p ? withPrimaryPhotoUrls([p], urlMap)[0] : null;

    return {
      sent: (sent ?? []).map((l) => ({ ...l, profile: withUrls(profileMap.get(l.liked_id) ?? null) })),
      received: (received ?? []).map((l) => ({
        ...l,
        profile: withUrls(profileMap.get(l.liker_id) ?? null),
      })),
    };
  });

export const getMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data, error } = await supabase
      .from("matches")
      .select("id,user_a,user_b,created_at,unmatched_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .is("unmatched_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const otherIds = (data ?? []).map((m) => (m.user_a === userId ? m.user_b : m.user_a));
    const uniqueIds = Array.from(new Set(otherIds));

    let profiles: Array<{
      id: string;
      first_name: string | null;
      primary_photo: string | null;
    }> = [];

    if (uniqueIds.length > 0) {
      const { data: pData } = await supabase
        .from("profiles")
        .select("id,first_name,primary_photo")
        .in("id", uniqueIds);
      profiles = pData ?? [];
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const urlMap = await signProfilePhotoUrls(supabase, profiles.map((p) => p.primary_photo));
    const withUrl = (p: (typeof profiles)[number] | null) =>
      p ? withPrimaryPhotoUrls([p], urlMap)[0] : null;

    return {
      matches: (data ?? []).map((m) => {
        const otherId = m.user_a === userId ? m.user_b : m.user_a;
        return {
          id: m.id,
          createdAt: m.created_at,
          otherId,
          otherProfile: withUrl(profileMap.get(otherId) ?? null),
        };
      }),
    };
  });

export const getInbox = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: matches, error } = await supabase
      .from("matches")
      .select("id,user_a,user_b,created_at,unmatched_at")
      .or(`user_a.eq.${userId},user_b.eq.${userId}`)
      .is("unmatched_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    const otherIds = (matches ?? []).map((m) => (m.user_a === userId ? m.user_b : m.user_a));
    const uniqueIds = Array.from(new Set(otherIds));

    let profiles: Array<{ id: string; first_name: string | null; primary_photo: string | null }> = [];
    if (uniqueIds.length > 0) {
      const { data: pData } = await supabase
        .from("profiles")
        .select("id,first_name,primary_photo")
        .in("id", uniqueIds);
      profiles = pData ?? [];
    }

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const urlMap = await signProfilePhotoUrls(supabase, profiles.map((p) => p.primary_photo));
    const withUrl = (p: (typeof profiles)[number] | null) =>
      p ? withPrimaryPhotoUrls([p], urlMap)[0] : null;

    const matchIds = (matches ?? []).map((m) => m.id);
    let lastMessages: Array<{
      match_id: string;
      body: string;
      created_at: string;
      sender_id: string;
    }> = [];

    if (matchIds.length > 0) {
      const { data: msgData } = await supabase
        .from("messages")
        .select("match_id,body,created_at,sender_id")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false });

      const seen = new Set<string>();
      for (const m of msgData ?? []) {
        if (!seen.has(m.match_id)) {
          seen.add(m.match_id);
          lastMessages.push(m);
        }
      }
    }

    const lastMsgMap = new Map(lastMessages.map((m) => [m.match_id, m]));

    let unreadMessages: Array<{ match_id: string }> = [];
    if (matchIds.length > 0) {
      const { data: um } = await supabase
        .from("messages")
        .select("match_id")
        .in("match_id", matchIds)
        .neq("sender_id", userId)
        .is("read_at", null);
      unreadMessages = um ?? [];
    }

    const unreadMap = new Map<string, number>();
    for (const m of unreadMessages) {
      unreadMap.set(m.match_id, (unreadMap.get(m.match_id) ?? 0) + 1);
    }

    return {
      items: (matches ?? []).map((m) => {
        const otherId = m.user_a === userId ? m.user_b : m.user_a;
        const lastMsg = lastMsgMap.get(m.id);
        return {
          matchId: m.id,
          otherId,
          otherProfile: withUrl(profileMap.get(otherId) ?? null),
          createdAt: m.created_at,
          lastMessage: lastMsg
            ? {
                body: lastMsg.body,
                createdAt: lastMsg.created_at,
                isMine: lastMsg.sender_id === userId,
              }
            : null,
          unreadCount: unreadMap.get(m.id) ?? 0,
        };
      }),
    };
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ matchId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("user_a,user_b")
      .eq("id", data.matchId)
      .single();

    if (matchError || !match) throw new Error("Match not found");
    if (match.user_a !== userId && match.user_b !== userId) throw new Error("Unauthorized");

    const { data: rows, error } = await supabase
      .from("messages")
      .select("id,sender_id,body,created_at,read_at")
      .eq("match_id", data.matchId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw new Error(error.message);

    return { messages: rows ?? [] };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ matchId: z.string().uuid(), body: z.string().min(1).max(2000) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("user_a,user_b,unmatched_at")
      .eq("id", data.matchId)
      .single();

    if (matchError || !match) throw new Error("Match not found");
    if (match.user_a !== userId && match.user_b !== userId) throw new Error("Unauthorized");
    if (match.unmatched_at) throw new Error("Match ended");

    const since = new Date(Date.now() - MESSAGE_RATE_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("match_id", data.matchId)
      .eq("sender_id", userId)
      .gte("created_at", since);

    if ((count ?? 0) >= MESSAGE_RATE_LIMIT) {
      throw new Error(`Message limit reached (${MESSAGE_RATE_LIMIT} per hour in this conversation).`);
    }

    const { error } = await supabase.from("messages").insert({
      match_id: data.matchId,
      sender_id: userId,
      body: data.body,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markMessagesRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ matchId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("match_id", data.matchId)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (error) throw new Error(error.message);
    return { ok: true };
  });
