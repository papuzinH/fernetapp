"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

const adminLinks = [
  { href: "/admin", label: "Panel", exact: true },
  { href: "/admin/matches", label: "Partidos", exact: false },
  { href: "/admin/players", label: "Jugadores", exact: false },
  { href: "/admin/tournaments", label: "Torneos", exact: false },
  { href: "/admin/payments", label: "Pagos", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <nav className="flex items-center gap-1 overflow-x-auto">
        {adminLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isPending}
        className="text-white/60 hover:text-white hover:bg-white/10 gap-1.5 shrink-0"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="text-xs">{isPending ? "Saliendo..." : "Salir"}</span>
      </Button>
    </div>
  );
}
