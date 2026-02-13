"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Swords,
  Target,
  Skull,
  BarChart3,
  Trophy,
  User,
  Bot,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/quests", label: "Квесты", icon: Swords },
  { href: "/missions", label: "Миссии", icon: Target },
  { href: "/bosses", label: "Боссы", icon: Skull },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/leaderboard", label: "Лидерборд", icon: Trophy },
  { href: "/profile", label: "Профиль", icon: User },
  { href: "/advisor", label: "AI Коуч", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Hide sidebar on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
    return null;
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 rounded-lg bg-card p-2 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r border-card-border bg-card transition-transform md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-card-border px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple text-lg font-bold">
            ⚔
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Life RPG</h1>
            <p className="text-xs text-muted">Level up your life</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-accent-purple/15 text-accent-purple shadow-[var(--glow-purple)]"
                    : "text-muted hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-card-border px-6 py-4">
          <p className="text-xs text-muted">v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
