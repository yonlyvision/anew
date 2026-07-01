import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { inviteFoundingMember } from "@/lib/admin.functions";
import { foundingInviteEmail } from "@/lib/founding-approval-email";

export function FoundingInviteButton() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const inviteFn = useServerFn(inviteFoundingMember);
  const qc = useQueryClient();

  const invite = useMutation({
    mutationFn: () =>
      inviteFn({
        data: {
          email: email.trim(),
          firstName: firstName.trim() || undefined,
        },
      }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["admin", "applications"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      const greeting = firstName.trim() || "there";
      const { mailto } = foundingInviteEmail(greeting, result.email);
      window.location.href = mailto;
      toast.success("Invitation ready — your email app should open with everything filled in");
      setOpen(false);
      setEmail("");
      setFirstName("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not invite"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Enter the person's email address");
      return;
    }
    invite.mutate();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-ink px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-paper hover:bg-accent transition-colors"
      >
        Invite founding member
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="founding-invite-title"
          onClick={() => !invite.isPending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[1.5rem] border border-ink/10 bg-paper p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Founding group</p>
            <h2 id="founding-invite-title" className="mt-2 font-serif text-2xl">
              Invite someone
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              Enter their email. We'll approve them automatically and open a ready-to-send
              invitation in your mail app — you just hit send.
            </p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink/55">Their email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-ink/55">First name (optional)</span>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Used in the greeting — e.g. Sarah"
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:border-accent focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={invite.isPending}
                  className="flex-1 rounded-full bg-ink px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-paper hover:bg-accent disabled:opacity-50"
                >
                  {invite.isPending ? "Preparing…" : "Open invitation email"}
                </button>
                <button
                  type="button"
                  disabled={invite.isPending}
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-ink/15 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-ink/55 hover:border-ink/30"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
