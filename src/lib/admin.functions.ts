import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAdminAction } from "@/lib/audit.server";
import { signProfilePhotoUrls, withPrimaryPhotoUrls } from "@/lib/photos.server";

async function assertStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("admin") && !roles.includes("moderator")) {
    throw new Error("Forbidden");
  }
  return roles as Array<"admin" | "moderator" | "user">;
}

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("Forbidden: admin only");
}

/* ------------ access probe (used by nav) ------------ */

export const getStaffStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roles = (data ?? []).map((r) => r.role);
    return {
      isAdmin: roles.includes("admin"),
      isModerator: roles.includes("moderator"),
      isStaff: roles.includes("admin") || roles.includes("moderator"),
    };
  });

/* ------------ applications ------------ */

export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("id,email,first_name,message,status,created_at,reviewed_at,reviewed_by")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const reviewApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "denied"]),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("applications")
      .update({
        status: data.decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, "review_application", "application", data.id, {
      decision: data.decision,
    });
    return { ok: true };
  });

/* ------------ verifications ------------ */

export const listPendingVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("verifications")
      .select("id,user_id,kind,status,evidence_url,notes,created_at,reviewed_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((data ?? []).map((r) => r.user_id)));
    let profiles: Array<{ id: string; first_name: string | null }> = [];
    if (userIds.length) {
      const { data: pData } = await supabaseAdmin
        .from("profiles")
        .select("id,first_name")
        .in("id", userIds);
      profiles = pData ?? [];
    }

    const items = await Promise.all(
      (data ?? []).map(async (row) => {
        let signedUrl: string | null = null;
        if (row.evidence_url) {
          const { data: signed } = await supabaseAdmin.storage
            .from("verifications")
            .createSignedUrl(row.evidence_url, 60 * 10);
          signedUrl = signed?.signedUrl ?? null;
        }
        const profile = profiles.find((p) => p.id === row.user_id);
        return {
          id: row.id,
          userId: row.user_id,
          firstName: profile?.first_name ?? null,
          kind: row.kind,
          status: row.status,
          notes: row.notes,
          createdAt: row.created_at,
          evidenceUrl: signedUrl,
        };
      })
    );

    return { items };
  });

export const reviewVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        decision: z.enum(["approved", "rejected"]),
        notes: z.string().max(1000).optional(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("verifications")
      .update({
        status: data.decision,
        notes: data.notes ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, "review_verification", "verification", data.id, {
      decision: data.decision,
    });
    return { ok: true };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const count = async (table: string, filter?: (q: any) => any) => {
      let q: any = (supabaseAdmin as any).from(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: c, error } = await q;
      if (error) throw new Error(error.message);
      return c ?? 0;
    };

    const [
      members,
      pausedMembers,
      pendingApplications,
      pendingVerifications,
      openReports,
      unhandledContact,
      matchesTotal,
      messages24h,
    ] = await Promise.all([
      count("profiles"),
      count("profiles", (q) => q.eq("is_paused", true)),
      count("applications", (q) => q.eq("status", "pending")),
      count("verifications", (q) => q.eq("status", "pending")),
      count("reports", (q) => q.eq("status", "open")),
      count("contact_messages", (q) => q.eq("handled", false)),
      count("matches"),
      count("messages", (q) =>
        q.gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      ),
    ]);

    return {
      members,
      pausedMembers,
      pendingApplications,
      pendingVerifications,
      openReports,
      unhandledContact,
      matchesTotal,
      messages24h,
    };
  });

/* ------------ members ------------ */

export const listMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        query: z.string().max(120).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("profiles")
      .select(
        "id,first_name,city,country,is_paused,is_premium,is_banned,email_verified,phone_verified,selfie_verified,onboarding_completed,created_at,last_active,admin_notes"
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.query && data.query.trim()) {
      const term = `%${data.query.trim()}%`;
      q = q.or(`first_name.ilike.${term},city.ilike.${term},country.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.id);
    let roleRows: Array<{ user_id: string; role: string }> = [];
    if (ids.length) {
      const { data: rr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id,role")
        .in("user_id", ids);
      roleRows = rr ?? [];
    }
    const roleMap = new Map<string, string[]>();
    for (const r of roleRows) {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    }

    return {
      items: (rows ?? []).map((r) => ({
        ...r,
        roles: roleMap.get(r.id) ?? ["user"],
      })),
    };
  });

export const setMemberPause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), paused: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_paused: data.paused })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, data.paused ? "pause_member" : "unpause_member", "user", data.userId);
    return { ok: true };
  });

export const setMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "moderator", "user"]),
        grant: z.boolean(),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !String(error.message).toLowerCase().includes("duplicate"))
        throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await logAdminAction(context.userId, data.grant ? "grant_role" : "revoke_role", "user", data.userId, {
      role: data.role,
    });
    return { ok: true };
  });

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("id,reporter_id,reported_id,reason,details,status,created_at,reviewed_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const ids = Array.from(
      new Set((data ?? []).flatMap((r) => [r.reporter_id, r.reported_id]))
    );
    let profiles: Array<{ id: string; first_name: string | null }> = [];
    if (ids.length) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id,first_name")
        .in("id", ids);
      profiles = p ?? [];
    }
    const nameOf = (id: string) =>
      profiles.find((p) => p.id === id)?.first_name ?? null;

    return {
      items: (data ?? []).map((r) => ({
        ...r,
        reporterName: nameOf(r.reporter_id),
        reportedName: nameOf(r.reported_id),
      })),
    };
  });

export const updateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["open", "reviewing", "resolved", "dismissed"]),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reports")
      .update({
        status: data.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: context.userId,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, "update_report", "report", data.id, { status: data.status });
    return { ok: true };
  });

export const getReportConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ reporterId: z.string().uuid(), reportedId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: match } = await supabaseAdmin
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${data.reporterId},user_b.eq.${data.reportedId}),and(user_a.eq.${data.reportedId},user_b.eq.${data.reporterId})`,
      )
      .is("unmatched_at", null)
      .maybeSingle();

    if (!match) {
      return {
        matchId: null,
        messages: [] as Array<{ id: string; sender_id: string; body: string; created_at: string }>,
      };
    }

    const { data: messages, error } = await supabaseAdmin
      .from("messages")
      .select("id,sender_id,body,created_at")
      .eq("match_id", match.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) throw new Error(error.message);

    return { matchId: match.id, messages: messages ?? [] };
  });

export const warnReportedUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), message: z.string().min(1).max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("notifications").insert({
      user_id: data.userId,
      kind: "moderation",
      title: "Community guidelines reminder",
      body: data.message,
      link: "/safety",
    });
    if (error) throw new Error(error.message);
    await logAdminAction(context.userId, "warn_user", "user", data.userId);
    return { ok: true };
  });

/* ------------ contact messages ------------ */

export const listContactMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("contact_messages")
      .select("id,name,email,subject,message,handled,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const setContactHandled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ id: z.string().uuid(), handled: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contact_messages")
      .update({ handled: data.handled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------ blog posts ------------ */

const blogSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, dashes only"),
  excerpt: z.string().max(500).optional().nullable(),
  body: z.string().min(1).max(50000),
  cover_image: z.string().url().max(500).optional().nullable(),
  published: z.boolean().default(false),
});

export const listBlogPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("blog_posts")
      .select("id,title,slug,excerpt,published,published_at,updated_at,cover_image")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const getBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("blog_posts")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const upsertBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => blogSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? null,
      body: data.body,
      cover_image: data.cover_image ?? null,
      published: data.published,
      published_at: data.published ? new Date().toISOString() : null,
      author_id: context.userId,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("blog_posts")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("blog_posts")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: row.id };
    }
  });

export const deleteBlogPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------ success stories ------------ */

const storySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  cover_image: z.string().url().max(500).optional().nullable(),
  published: z.boolean().default(false),
});

export const listStories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("success_stories")
      .select("id,title,body,cover_image,published,submitted_by,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { items: data ?? [] };
  });

export const upsertStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => storySchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      title: data.title,
      body: data.body,
      cover_image: data.cover_image ?? null,
      published: data.published,
    };
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("success_stories")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    } else {
      const { data: row, error } = await supabaseAdmin
        .from("success_stories")
        .insert({ ...payload, submitted_by: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: row.id };
    }
  });

export const deleteStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("success_stories")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------ content moderation ------------ */

export const listContentForReview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: reported } = await supabaseAdmin
      .from("reports")
      .select("reported_id")
      .in("status", ["open", "reviewing"]);
    const reportedIds = Array.from(new Set((reported ?? []).map((r) => r.reported_id)));

    const { data: recent } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,first_name,bio,new_chapter_answer,primary_photo,photos,values,is_paused,created_at,updated_at"
      )
      .eq("onboarding_completed", true)
      .order("updated_at", { ascending: false })
      .limit(40);

    const recentRows = recent ?? [];
    let reportedRows: typeof recentRows = [];
    if (reportedIds.length) {
      const { data: rep } = await supabaseAdmin
        .from("profiles")
        .select(
          "id,first_name,bio,new_chapter_answer,primary_photo,photos,values,is_paused,created_at,updated_at"
        )
        .in("id", reportedIds);
      reportedRows = rep ?? [];
    }

    const map = new Map<string, (typeof recentRows)[number] & { flagged: boolean }>();
    for (const r of reportedRows) map.set(r.id, { ...r, flagged: true });
    for (const r of recentRows) if (!map.has(r.id)) map.set(r.id, { ...r, flagged: false });

    const items = Array.from(map.values());
    const allPaths = items.flatMap((i) => [i.primary_photo, ...(i.photos ?? [])]);
    const urlMap = await signProfilePhotoUrls(supabaseAdmin, allPaths);

    return {
      items: items.map((item) => ({
        ...item,
        primary_photo_url: item.primary_photo ? (urlMap[item.primary_photo] ?? null) : null,
        photo_urls: (item.photos ?? []).map((p) => urlMap[p] ?? null),
      })),
    };
  });

export const removeProfilePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), photoPath: z.string().max(500) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("photos,primary_photo")
      .eq("id", data.userId)
      .single();
    if (!profile) throw new Error("Profile not found");

    await supabaseAdmin.storage.from("profile-photos").remove([data.photoPath]);

    const photos = (profile.photos ?? []).filter((p) => p !== data.photoPath);
    const primary =
      profile.primary_photo === data.photoPath ? (photos[0] ?? null) : profile.primary_photo;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ photos, primary_photo: primary })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    await logAdminAction(context.userId, "remove_profile_photo", "user", data.userId, {
      photoPath: data.photoPath,
    });
    return { ok: true };
  });

/* ------------ analytics ------------ */

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

    const [
      { data: signups },
      { data: matches },
      { data: messages },
      { data: likes },
      { count: premiumCount },
      { count: verifiedCount },
      { count: onboardedCount },
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("created_at").gte("created_at", since),
      supabaseAdmin.from("matches").select("created_at").gte("created_at", since),
      supabaseAdmin.from("messages").select("created_at").gte("created_at", since),
      supabaseAdmin.from("likes").select("created_at").gte("created_at", since),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_premium", true),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("selfie_verified", true),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("onboarding_completed", true),
    ]);

    const days: string[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }

    const bucket = (rows: Array<{ created_at: string }> | null) => {
      const m = new Map<string, number>(days.map((d) => [d, 0]));
      for (const r of rows ?? []) {
        const k = r.created_at.slice(0, 10);
        if (m.has(k)) m.set(k, (m.get(k) ?? 0) + 1);
      }
      return days.map((d) => ({ d, n: m.get(d) ?? 0 }));
    };

    return {
      days,
      signups: bucket(signups),
      matches: bucket(matches),
      messages: bucket(messages),
      likes: bucket(likes),
      totals: {
        signups: signups?.length ?? 0,
        matches: matches?.length ?? 0,
        messages: messages?.length ?? 0,
        likes: likes?.length ?? 0,
        premiumMembers: premiumCount ?? 0,
        verifiedMembers: verifiedCount ?? 0,
        onboardedMembers: onboardedCount ?? 0,
      },
    };
  });

/* ------------ subscriptions ------------ */

export const listSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id,user_id,tier,status,stripe_customer_id,stripe_subscription_id,current_period_end,cancel_at_period_end,environment,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((data ?? []).map((s) => s.user_id)));
    let profiles: Array<{ id: string; first_name: string | null; is_premium: boolean | null }> = [];
    if (userIds.length) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id,first_name,is_premium")
        .in("id", userIds);
      profiles = p ?? [];
    }
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return {
      items: (data ?? []).map((s) => ({
        ...s,
        firstName: profileMap.get(s.user_id)?.first_name ?? null,
        isPremium: profileMap.get(s.user_id)?.is_premium ?? false,
      })),
    };
  });

/* ------------ audit log ------------ */

export const listAuditLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        action: z.string().max(80).optional(),
        limit: z.number().min(1).max(500).default(200),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("admin_audit_log")
      .select("id,actor_id,action,target_type,target_id,payload,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.action?.trim()) q = q.eq("action", data.action.trim());

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const actorIds = Array.from(new Set((rows ?? []).map((r) => r.actor_id)));
    let actors: Array<{ id: string; first_name: string | null }> = [];
    if (actorIds.length) {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("id,first_name")
        .in("id", actorIds);
      actors = p ?? [];
    }
    const actorMap = new Map(actors.map((a) => [a.id, a.first_name]));

    return {
      items: (rows ?? []).map((r) => ({
        ...r,
        actorName: actorMap.get(r.actor_id) ?? null,
      })),
    };
  });
