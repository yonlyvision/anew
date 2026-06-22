import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reportUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        reportedId: z.string().uuid(),
        reason: z.string().min(1).max(100),
        details: z.string().max(2000).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.reportedId === userId) throw new Error("Cannot report yourself");
    const { error } = await supabase.from("reports").insert({
      reporter_id: userId,
      reported_id: data.reportedId,
      reason: data.reason,
      details: data.details ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ blockedId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.blockedId === userId) throw new Error("Cannot block yourself");

    const { error } = await supabase
      .from("blocks")
      .insert({ blocker_id: userId, blocked_id: data.blockedId });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      throw new Error(error.message);
    }

    // End any active matches with this user
    await supabase
      .from("matches")
      .update({ unmatched_at: new Date().toISOString(), unmatched_by: userId })
      .or(
        `and(user_a.eq.${userId},user_b.eq.${data.blockedId}),and(user_a.eq.${data.blockedId},user_b.eq.${userId})`
      )
      .is("unmatched_at", null);

    return { ok: true };
  });

export const unblockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ blockedId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", data.blockedId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listBlocks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id,created_at")
      .eq("blocker_id", userId);

    const ids = (blocks ?? []).map((b) => b.blocked_id);
    let profiles: Array<{ id: string; first_name: string | null; primary_photo: string | null }> = [];
    if (ids.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id,first_name,primary_photo")
        .in("id", ids);
      profiles = data ?? [];
    }
    const map = new Map(profiles.map((p) => [p.id, p]));
    return {
      blocks: (blocks ?? []).map((b) => ({
        blockedId: b.blocked_id,
        createdAt: b.created_at,
        profile: map.get(b.blocked_id) ?? null,
      })),
    };
  });

export const unmatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ matchId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: match, error: mErr } = await supabase
      .from("matches")
      .select("user_a,user_b")
      .eq("id", data.matchId)
      .single();
    if (mErr || !match) throw new Error("Match not found");
    if (match.user_a !== userId && match.user_b !== userId) throw new Error("Unauthorized");

    const { error } = await supabase
      .from("matches")
      .update({ unmatched_at: new Date().toISOString(), unmatched_by: userId })
      .eq("id", data.matchId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
