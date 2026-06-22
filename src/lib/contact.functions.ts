import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEV_BYPASS_TOKEN = "dev-turnstile-pass";

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
      if (data.turnstileToken !== DEV_BYPASS_TOKEN) {
        throw new Error("CAPTCHA is not configured for this environment.");
      }
      return { ok: true, mode: "bypass" as const };
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
