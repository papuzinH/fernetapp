"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shield, Menu, X, Sun, Moon, Users, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTheme } from "next-themes";
import { PushNotificationOptIn } from "@/components/push-notification-opt-in";
import { SlideIn } from "@/components/motion";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Partidos", icon: CalendarDays },
  { href: "/players", label: "Jugadores", icon: Users },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl dark:bg-[oklch(0.06_0.005_260/0.85)] border-b border-border/50 dark:border-white/[0.06]">
      {/* Gold accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Image
            src="/Escudo Fernet 2023 PNG.png"
            alt="Escudo Club Atlético Fernet con Guaymallén"
            width={36}
            height={36}
            className="object-contain drop-shadow-sm transition-all duration-300 group-hover:drop-shadow-[0_0_8px_oklch(0.60_0.16_55/0.4)]"
            priority
          />
          <span className="text-lg font-bold tracking-tight">
            Fernet<span className="text-gradient-gold">App</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-200",
                    isActive
                      ? "bg-accent/15 text-accent dark:bg-accent/10 dark:text-accent pointer-events-none font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}

          <div className="w-px h-6 bg-border/50 mx-1" />

          <PushNotificationOptIn />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-0.5"
            aria-label="Cambiar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
        </nav>

        {/* Mobile right side */}
        <div className="flex items-center gap-1 md:hidden">
          <PushNotificationOptIn />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Cambiar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav — animated slide */}
      <SlideIn isOpen={mobileOpen} className="md:hidden border-t border-border/30 dark:border-white/[0.04]">
        <nav className="px-4 pb-4 pt-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive
                      ? "bg-accent/15 text-accent font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </SlideIn>
    </header>
  );
}
