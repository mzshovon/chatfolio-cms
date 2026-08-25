export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: "⌂", label: "Dashboard", href: "/dashboard" },
  { id: "profile", icon: "☺", label: "Profile", href: "/dashboard/profile" },
  { id: "cv", icon: "📄", label: "CV Upload", href: "/dashboard/cv" },
  { id: "sections", icon: "✎", label: "Portfolio Sections", href: "/dashboard/sections" },
  { id: "publish", icon: "⇪", label: "Publish Settings", href: "/dashboard/publish" },
  { id: "conversations", icon: "💬", label: "Conversations", href: "/dashboard/conversations" },
];
