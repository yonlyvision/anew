import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { deleteOwnAccount } from "@/lib/profile.functions";
import { SettingsShell } from "@/components/settings/SettingsShell";

export const Route = createFileRoute("/_authenticated/settings/privacy")({
  head: () => ({ meta: [{ title: "Privacy & security — Anew" }, { name: "robots", content: "noindex" }] }),
  component: PrivacySettingsPage,
});

function PrivacySettingsPage() {
  const deleteFn = useServerFn(deleteOwnAccount);

  const [showDelete, setShowDelete] = useState(false);
  const [confirmDel, setConfirmDel] = useState("");
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    if (confirmDel !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    setBusy(true);
    try {
      await deleteFn({ data: { confirm: "DELETE" } });
      await supabase.auth.signOut();
      toast.success("Account deleted");
      if (typeof window !== "undefined") window.location.assign("/");
    } catch (err) {
      setBusy(false);
      toast.error(err instanceof Error ? err.message : "Could not delete account");
    }
  }

  return (
    <SettingsShell
      title="Privacy & security"
      subtitle="Control who can reach you and how your data is handled."
    >
      <div className="mt-12 space-y-3">
        <Link
          to="/settings/blocks"
          className="flex items-center justify-between gap-4 border border-ink/10 bg-paper/80 px-5 py-4 transition hover:border-ink/25 hover:shadow-sm"
        >
          <div>
            <p className="font-serif text-lg">Blocked members</p>
            <p className="mt-0.5 text-sm text-ink/55">Manage people you've blocked from contacting you.</p>
          </div>
          <span className="shrink-0 text-ink/35" aria-hidden>
            →
          </span>
        </Link>

        <Link
          to="/privacy"
          className="flex items-center justify-between gap-4 border border-ink/10 bg-paper/80 px-5 py-4 transition hover:border-ink/25 hover:shadow-sm"
        >
          <div>
            <p className="font-serif text-lg">Privacy policy</p>
            <p className="mt-0.5 text-sm text-ink/55">How we collect, use, and protect your information.</p>
          </div>
          <span className="shrink-0 text-ink/35" aria-hidden>
            →
          </span>
        </Link>
      </div>

      <div className="mt-16 border-t border-ink/10 pt-8">
        {!showDelete ? (
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="text-xs text-ink/40 hover:text-ink/60 underline-offset-2 hover:underline"
          >
            Delete account permanently
          </button>
        ) : (
          <div className="space-y-3 max-w-md">
            <p className="text-xs text-ink/50 leading-relaxed">
              This removes your profile, photos, likes, matches, and messages. It cannot be undone.
            </p>
            <input
              type="text"
              value={confirmDel}
              onChange={(e) => setConfirmDel(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full border border-ink/15 bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={deleteAccount}
                disabled={busy || confirmDel !== "DELETE"}
                className="text-xs text-destructive/80 hover:text-destructive disabled:opacity-40"
              >
                Confirm deletion
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDelete(false);
                  setConfirmDel("");
                }}
                className="text-xs text-ink/45 hover:text-ink/70"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </SettingsShell>
  );
}
