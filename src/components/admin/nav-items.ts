import {
  AlertTriangle,
  BarChart3,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  MessageCircleHeart,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { id: "users", icon: Users, label: "Users", href: "/admin/users" },
  { id: "roles", icon: Shield, label: "Roles", href: "/admin/roles" },
  { id: "permissions", icon: KeyRound, label: "Permissions", href: "/admin/permissions" },
  { id: "chatfolios", icon: LayoutGrid, label: "Chatfolios", href: "/admin/chatfolios" },
  { id: "metrics", icon: BarChart3, label: "Metrics", href: "/admin/metrics" },
  { id: "cvjobs", icon: AlertTriangle, label: "Failed CV Jobs", href: "/admin/cv-jobs" },
  { id: "feedback", icon: MessageCircleHeart, label: "Feedback", href: "/admin/feedback" },
];
