"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, FolderOpen, Users, CreditCard,
  Settings, LogOut, Zap, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Organization, User } from "@prisma/client";

interface SidebarProps {
  org: Organization;
  role: string;
  user: User;
  allOrgs: Organization[];
  orgId: string;
}

export function Sidebar({ org, role, user, allOrgs, orgId }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: `/dashboard/${orgId}`, label: "Overview", icon: LayoutDashboard },
    { href: `/dashboard/${orgId}/projects`, label: "Projects", icon: FolderOpen },
    { href: `/dashboard/${orgId}/members`, label: "Members", icon: Users },
    { href: `/dashboard/${orgId}/billing`, label: "Billing", icon: CreditCard },
    { href: `/dashboard/${orgId}/settings`, label: "Settings", icon: Settings },
  ];

  const planColors = {
    FREE: "bg-gray-100 text-gray-600",
    PRO: "bg-indigo-100 text-indigo-700",
    ENTERPRISE: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="w-64 bg-white border-r flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Zap className="h-5 w-5 text-indigo-600" />
          SaaSify
        </div>
      </div>

      {/* Org Switcher */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
              {org.name[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{org.name}</p>
              <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", planColors[org.plan])}>
                {org.plan}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {user.name?.[0] ?? user.email?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
