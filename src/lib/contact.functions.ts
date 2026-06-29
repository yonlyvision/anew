import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEV_BYPASS_TOKEN = "dev-turnstile-pass";

function isProductionRuntime() {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production"
  );
}

export const verifyAuthCaptcha = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        turnstileToken: z.string().min(1, "Missing CAPTCHA token"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const secret =
      process.env.TURNSTILE_SECRET_KEY ||
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      process.env.TURNSTILE_SECRET;

    if (!secret) {
      if (!isProductionRuntime() && data.turnstileToken === DEV_BYPASS_TOKEN) {
        return { ok: true, mode: "bypass" as const };
      }
      throw new Error("CAPTCHA is not configured for this environment.");
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret,
          response: data.turnstileToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Could not reach CAPTCHA verification service.");
    }

    const result = (await response.json()) as {
      success?: boolean;
      ["error-codes"]?: string[];
    };

    if (!result.success) {
      throw new Error("CAPTCHA verification failed.");
    }

    return { ok: true, mode: "verified" as const };
  });

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        name: z.string().min(1).max(200),
        email: z.string().email().max(320),
        reason: z.string().min(1).max(200),
        message: z.string().min(1).max(5000),
        turnstileToken: z.string().min(1, "Missing CAPTCHA token"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    await verifyAuthCaptcha({ data: { turnstileToken: data.turnstileToken } });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: data.reason.trim(),
      message: data.message.trim(),
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  });

export const checkApplicationApproval = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email().max(255),
        turnstileToken: z.string().min(1, "Missing CAPTCHA token"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    await verifyAuthCaptcha({ data: { turnstileToken: data.turnstileToken } });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.toLowerCase();
    const { data: row, error } = await supabaseAdmin
      .from("applications")
      .select("status")
      .eq("email", email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return { status: "none" as const };
    return { status: row.status as "pending" | "approved" | "denied" };
  });
