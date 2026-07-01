import { createFileRoute, redirect } from "@tanstack/react-router";

/** Search is disabled — members browse via Discover only. */
export const Route = createFileRoute("/_authenticated/search")({
  beforeLoad: () => {
    throw redirect({ to: "/discover" });
  },
  component: () => null,
});
