export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: "⌂", label: "Dashboard", href: "/admin" },
  { id: "users", icon: "☺", label: "Users", href: "/admin/users" },
  { id: "roles", icon: "🛡", label: "Roles", href: "/admin/roles" },
  { id: "permissions", icon: "🔑", label: "Permissions", href: "/admin/permissions" },
  { id: "chatfolios", icon: "◱", label: "Chatfolios", href: "/admin/chatfolios" },
  { id: "metrics", icon: "▤", label: "Metrics", href: "/admin/metrics" },
  { id: "cvjobs", icon: "⚠", label: "Failed CV Jobs", href: "/admin/cv-jobs" },
];
