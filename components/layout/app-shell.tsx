"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

// Wraps the app with sidebar + main area
// Hides sidebar on auth pages
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <div className="mx-auto max-w-5xl px-4 pt-16 pb-6 md:px-8 md:pt-8 md:pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
