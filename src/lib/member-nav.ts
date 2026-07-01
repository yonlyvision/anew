/** Member dating/social routes — any admin or moderator account uses /admin instead. */
export function isMemberDatingPath(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/settings") || pathname === "/change-password") return false;

  const exact = [
    "/dashboard",
    "/discover",
    "/search",
    "/matches",
    "/likes",
    "/notifications",
    "/onboarding",
    "/verification",
  ];
  if (exact.includes(pathname)) return true;
  if (pathname.startsWith("/messages")) return true;
  if (pathname.startsWith("/profile")) return true;
  return false;
}

const memberNav: Array<{ to: string; label: string; mobile?: boolean }> = [
  { to: "/dashboard", label: "Home", mobile: true },
  { to: "/discover", label: "Discover", mobile: true },
  { to: "/matches", label: "Matches", mobile: true },
  { to: "/messages", label: "Messages", mobile: true },
  { to: "/profile", label: "Profile", mobile: true },
  { to: "/likes", label: "Likes" },
  { to: "/notifications", label: "Inbox" },
  { to: "/settings", label: "Settings" },
];

const staffNav: Array<{ to: string; label: string }> = [
  { to: "/admin", label: "Console" },
  { to: "/admin/applications", label: "Applications" },
  { to: "/admin/contact", label: "Inbox" },
  { to: "/settings", label: "Settings" },
];

export { memberNav, staffNav };
