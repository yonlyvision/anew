import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAdminAction } from "@/lib/audit.server";
import { signProfilePhotoUrls } from "@/lib/photos.server";

export const getAccountStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("is_banned,is_paused")
      .eq("id", userId)
      .single();
    if (error) throw new Error(error.message);
    return { isBanned: !!data?.is_banned, isPaused: !!data?.is_paused };
  });

export const getSignedPhotoUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ paths: z.array(z.string().max(500)).max(20) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const urlMap = await signProfilePhotoUrls(context.supabase, data.paths);
    return { urls: urlMap };
  });

export const setProfilePaused = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        paused: z.boolean(),
        pauseDays: z.number().min(1).max(30).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", userId)
      .single();
    if (profile?.is_banned) throw new Error("Account suspended");

    const { error } = await supabase
      .from("profiles")
      .update({ is_paused: data.paused })
      .eq("id", userId);
    if (error) throw new Error(error.message);

    if (data.paused && data.pauseDays) {
      // Scheduled unpause via notification reminder (best-effort)
      await supabase.from("notifications").insert({
        user_id: userId,
        kind: "system",
        title: "Pause ending soon",
        body: `Your ${data.pauseDays}-day pause is active. You can return anytime from Settings.`,
        link: "/settings",
      });
    }

    return { ok: true };
  });

export const PROFILE_PROMPTS = [
  {
    key: "conversation_starter",
    label: "The best way to start a conversation with me is…",
  },
  {
    key: "perfect_sunday",
    label: "My idea of a perfect Sunday…",
  },
  {
    key: "proud_chapter",
    label: "The chapter I am most proud of…",
  },
] as const;

export const getProfilePrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const targetId = data.userId ?? context.userId;
    const { supabase } = context;
    const { data: rows, error } = await supabase
      .from("profile_prompts")
      .select("prompt_key,answer,updated_at")
      .eq("user_id", targetId)
      .order("prompt_key");
    if (error) throw new Error(error.message);
    return { prompts: rows ?? [] };
  });

export const upsertProfilePrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        prompts: z
          .array(
            z.object({
              promptKey: z.enum([
                "conversation_starter",
                "perfect_sunday",
                "proud_chapter",
              ]),
              answer: z.string().min(1).max(500),
            }),
          )
          .min(1)
          .max(3),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    for (const p of data.prompts) {
      const { error } = await supabase.from("profile_prompts").upsert(
        {
          user_id: userId,
          prompt_key: p.promptKey,
          answer: p.answer,
        },
        { onConflict: "user_id,prompt_key" },
      );
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

async function cascadeDeleteUser(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  try {
    const { data: subs } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, environment, status")
      .eq("user_id", userId);

    const { createStripeClient } = await import("@/lib/stripe.server");
    for (const sub of subs ?? []) {
      if (!sub.stripe_subscription_id) continue;
      if (sub.status !== "active" && sub.status !== "pending") continue;
      try {
        const stripe = createStripeClient(sub.environment as "sandbox" | "live");
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      } catch (e) {
        console.error("[cascadeDeleteUser] failed to cancel sub", sub.stripe_subscription_id, e);
      }
    }
  } catch (e) {
    console.error("[cascadeDeleteUser] subscription lookup failed", e);
  }

  await supabaseAdmin.from("profile_prompts").delete().eq("user_id", userId);
  await supabaseAdmin.from("messages").delete().eq("sender_id", userId);
  await supabaseAdmin
    .from("matches")
    .update({ unmatched_at: new Date().toISOString(), unmatched_by: userId })
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .is("unmatched_at", null);
  await supabaseAdmin.from("likes").delete().or(`liker_id.eq.${userId},liked_id.eq.${userId}`);
  await supabaseAdmin.from("blocks").delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
  await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
  await supabaseAdmin.from("verifications").delete().eq("user_id", userId);
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
}

export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ confirm: z.literal("DELETE") }).parse(input))
  .handler(async ({ context }) => {
    await cascadeDeleteUser(context.userId);
    return { ok: true };
  });

export const adminDeleteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), confirm: z.literal("DELETE") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw new Error("Forbidden: admin only");

    if (data.userId === context.userId) throw new Error("Cannot delete your own account here");

    await cascadeDeleteUser(data.userId);
    await logAdminAction(context.userId, "delete_member", "user", data.userId);
    return { ok: true };
  });

export const adminBanMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), banned: z.boolean(), note: z.string().max(1000).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaffForProfile(context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        is_banned: data.banned,
        banned_at: data.banned ? new Date().toISOString() : null,
        banned_by: data.banned ? context.userId : null,
        ...(data.banned ? { is_paused: true } : {}),
        ...(data.note ? { admin_notes: data.note } : {}),
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    if (data.banned) {
      await supabaseAdmin.auth.admin.signOut(data.userId, "global");
    }

    await logAdminAction(context.userId, data.banned ? "ban_member" : "unban_member", "user", data.userId, {
      note: data.note,
    });
    return { ok: true };
  });

export const adminSetMemberNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), notes: z.string().max(5000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaffForProfile(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ admin_notes: data.notes })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, "set_member_notes", "user", data.userId);
    return { ok: true };
  });

export const adminGrantPremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), premium: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdminForProfile(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_premium: data.premium })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, data.premium ? "grant_premium" : "revoke_premium", "user", data.userId);
    return { ok: true };
  });

async function assertStaffForProfile(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("moderator")) throw new Error("Forbidden");
}

async function assertAdminForProfile(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (!data?.length) throw new Error("Forbidden: admin only");
}
