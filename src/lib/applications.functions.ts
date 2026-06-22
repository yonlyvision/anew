import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { verifyAuthCaptcha } from "@/lib/contact.functions";

export const submitApplication = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        firstName: z.string().min(1).max(100),
        message: z.string().max(1000).optional(),
        turnstileToken: z.string().min(1, "Missing CAPTCHA token"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    await verifyAuthCaptcha({ data: { turnstileToken: data.turnstileToken } });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();

    const { data: existing, error: lookupError } = await supabaseAdmin
      .from("applications")
      .select("id,status")
      .eq("email", email)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    if (existing?.status === "approved") {
      return { ok: true, status: "approved" as const };
    }

    if (existing) {
      const { error } = await supabaseAdmin
        .from("applications")
        .update({
          first_name: data.firstName,
          message: data.message ?? null,
          status: "pending",
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("applications").insert({
        email,
        first_name: data.firstName,
        message: data.message ?? null,
      });
      if (error) throw new Error(error.message);
    }

    return { ok: true, status: "pending" as const };
  });
