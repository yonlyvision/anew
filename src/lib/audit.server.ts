export async function logAdminAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  payload?: Record<string, unknown>,
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: actorId,
      action,
      target_type: targetType,
      target_id: targetId,
      payload: payload ?? null,
    });
  } catch (error) {
    console.error("[audit] failed to record admin action", {
      actorId,
      action,
      targetType,
      targetId,
      error,
    });
  }
}
