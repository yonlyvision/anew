import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { listSubscriptions } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/subscriptions")({
  head: () => ({
    meta: [{ title: "Subscriptions — Anew Admin" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminSubscriptions,
});

function AdminSubscriptions() {
  const fn = useServerFn(listSubscriptions);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: () => fn(),
  });

  const active = (data?.items ?? []).filter((s: { status: string }) =>
    ["active", "pending"].includes(s.status),
  );

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <h1 className="font-serif text-4xl md:text-5xl">Subscriptions</h1>
      <p className="mt-3 text-ink/60">
        {active.length} active subscriber{active.length === 1 ? "" : "s"}. Grant or revoke premium
        from the{" "}
        <Link to="/admin/members" className="text-accent hover:text-ink">
          Members
        </Link>{" "}
        page.
      </p>

      <div className="mt-10 border border-ink/10 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-ink/10 text-left text-[10px] uppercase tracking-[0.2em] text-ink/45">
              <th className="p-4">Member</th>
              <th className="p-4">Tier</th>
              <th className="p-4">Status</th>
              <th className="p-4">Period end</th>
              <th className="p-4">Stripe customer</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-ink/50">
                  Loading…
                </td>
              </tr>
            ) : (data?.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-ink/50 italic">
                  No subscriptions yet.
                </td>
              </tr>
            ) : (
              (data?.items ?? []).map((s: {
                id: string;
                firstName: string | null;
                user_id: string;
                tier: string;
                status: string;
                current_period_end: string | null;
                stripe_customer_id: string | null;
                cancel_at_period_end: boolean | null;
                environment: string | null;
              }) => (
                <tr key={s.id} className="border-b border-ink/5">
                  <td className="p-4">
                    <p className="font-medium">{s.firstName ?? "Member"}</p>
                    <p className="text-[10px] font-mono text-ink/35 truncate max-w-[140px]">
                      {s.user_id}
                    </p>
                  </td>
                  <td className="p-4 capitalize">{s.tier.replace(/_/g, " ")}</td>
                  <td className="p-4">
                    <span
                      className={
                        s.status === "active"
                          ? "text-teal"
                          : s.status === "cancelled"
                            ? "text-ink/45"
                            : "text-ink/70"
                      }
                    >
                      {s.status}
                      {s.cancel_at_period_end ? " (cancel at period end)" : ""}
                    </span>
                  </td>
                  <td className="p-4 text-ink/60">
                    {s.current_period_end
                      ? new Date(s.current_period_end).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 font-mono text-[10px] text-ink/45">
                    {s.stripe_customer_id ?? "—"}
                    {s.environment ? ` · ${s.environment}` : ""}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
