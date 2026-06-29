import { useEffect, useId, useRef, useState } from "react";

type TurnstileWidgetProps = {
  onToken: (token: string | null) => void;
  className?: string;
};

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
      theme?: "light" | "dark";
    }
  ) => string;
  remove?: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const DEV_BYPASS_TOKEN = "dev-turnstile-pass";

export function TurnstileWidget({ onToken, className }: TurnstileWidgetProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptId = useId();
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "fallback">("idle");

  useEffect(() => {
    if (!siteKey) {
      if (import.meta.env.DEV) {
        onToken(DEV_BYPASS_TOKEN);
        setStatus("fallback");
      } else {
        onToken(null);
        setStatus("fallback");
      }
      return;
    }

    let active = true;
    setStatus("loading");
    onToken(null);

    function renderWidget() {
      if (!active || !containerRef.current || !window.turnstile) return;
      containerRef.current.innerHTML = "";
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => {
          onToken(token);
          setStatus("ready");
        },
        "error-callback": () => {
          onToken(null);
          setStatus("idle");
        },
        "expired-callback": () => {
          onToken(null);
          setStatus("idle");
        },
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener("load", renderWidget, { once: true });
      } else {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.addEventListener("load", renderWidget, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      active = false;
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [onToken, scriptId, siteKey]);

  if (!siteKey) {
    // No site key configured. In development we surface a small note so the
    // local auth flow is testable; in production we render nothing so users
    // never see environment/debug messaging.
    if (import.meta.env.DEV) {
      return (
        <div className={className}>
          <div className="rounded-[1.2rem] border border-ink/8 bg-muted-warm px-4 py-3 text-center text-xs leading-6 text-ink/58">
            CAPTCHA is not configured in this environment (dev only). Local
            access is enabled so the auth flow can still be tested.
          </div>
        </div>
      );
    }
    return (
      <div className={className}>
        <div className="rounded-[1.2rem] border border-destructive/20 bg-destructive/5 px-4 py-3 text-center text-xs leading-6 text-ink/70">
          Security verification is not configured. Forms are temporarily unavailable.
          Please email{" "}
          <a href="mailto:support@inm8tebook.net" className="text-accent underline">
            support@inm8tebook.net
          </a>
          .
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} />
      {status === "loading" && (
        <p className="mt-2 text-center text-xs text-ink/45">Loading CAPTCHA…</p>
      )}
    </div>
  );
}
