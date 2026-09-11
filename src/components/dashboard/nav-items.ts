import { FileText, LayoutDashboard, MessageSquare, PenLine, Rocket, User, type LucideIcon } from "lucide-react";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { id: "profile", icon: User, label: "Profile", href: "/dashboard/profile" },
  { id: "cv", icon: FileText, label: "CV Upload", href: "/dashboard/cv" },
  { id: "sections", icon: PenLine, label: "Portfolio Sections", href: "/dashboard/sections" },
  { id: "publish", icon: Rocket, label: "Publish Settings", href: "/dashboard/publish" },
  { id: "conversations", icon: MessageSquare, label: "Conversations", href: "/dashboard/conversations" },
];
