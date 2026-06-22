import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { listBlocks, unblockUser } from "@/lib/safety.functions";
import { ProfilePhoto } from "@/components/site/ProfilePhoto";

export const Route = createFileRoute("/_authenticated/settings/blocks")({
  head: () => ({ meta: [{ title: "Blocked — Anew" }, { name: "robots", content: "noindex" }] }),
  component: BlocksPage,
});

function BlocksPage() {
  const listFn = useServerFn(listBlocks);
  const unblockFn = useServerFn(unblockUser);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["blocks"],
    queryFn: () => listFn(),
  });

  const unblock = useMutation({
    mutationFn: (blockedId: string) => unblockFn({ data: { blockedId } }),
    onSuccess: () => {
      toast.success("Unblocked");
      qc.invalidateQueries({ queryKey: ["blocks"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed"),
  });

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 md:py-24">
      <Link to="/settings" className="text-[11px] uppercase tracking-[0.25em] text-ink/60 hover:text-ink">
        ← Back to settings
      </Link>
      <h1 className="mt-6 font-serif text-4xl leading-tight">Blocked members</h1>
      <p className="mt-3 text-sm text-ink/60">People you've blocked can't see your profile or contact you.</p>

      <div className="mt-10 border border-ink/10">
        {isLoading && <p className="px-6 py-8 text-sm text-ink/50">Loading…</p>}
        {!isLoading && (data?.blocks.length ?? 0) === 0 && (
          <p className="px-6 py-8 text-sm text-ink/50">You haven't blocked anyone.</p>
        )}
        {data?.blocks.map((b) => (
            <div key={b.blockedId} className="flex items-center gap-4 px-5 py-4 border-b border-ink/5 last:border-0">
              <ProfilePhoto
                path={b.profile?.primary_photo}
                alt=""
                className="h-12 w-12 object-cover border border-ink/10"
                fallbackClassName="h-12 w-12 border border-ink/10 bg-muted-warm flex items-center justify-center"
                fallbackInitial={b.profile?.first_name?.charAt(0).toUpperCase() ?? "?"}
              />
              <div className="flex-1">
                <p className="text-sm">{b.profile?.first_name ?? "Member"}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
                  Blocked {new Date(b.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => unblock.mutate(b.blockedId)}
                disabled={unblock.isPending}
                className="border border-ink px-4 py-2 text-[11px] uppercase tracking-[0.25em] hover:bg-ink hover:text-paper disabled:opacity-50"
              >
                Unblock
              </button>
            </div>
        ))}
      </div>
    </section>
  );
}
