"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Sun,
  Moon,
  Users,
  CalendarDays,
  Trophy,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { PushNotificationOptIn } from "@/components/push-notification-opt-in";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/matches", label: "Partidos", icon: CalendarDays },
  { href: "/players", label: "Jugadores", icon: Users },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/posiciones", label: "Posiciones", icon: Trophy },
  { href: "/admin", label: "Admin", icon: Shield },
];

// Detect scroll for solid background. Subscribing to the browser instead of
// mirroring it into state keeps the first paint consistent with the server,
// which renders the transparent variant.
function subscribeToScroll(onScroll: () => void) {
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const scrolled = useSyncExternalStore(
    subscribeToScroll,
    () => window.scrollY > 8,
    () => false,
  );

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile menu on route change, adjusting during render so the closed
  // menu is part of the same commit as the new route.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setMobileOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          scrolled
            ? "bg-background/95 dark:bg-[oklch(0.06_0.005_260/0.97)] backdrop-blur-2xl shadow-[0_1px_12px_rgba(0,0,0,0.25)] border-b border-white/[0.04]"
            : "bg-background/60 dark:bg-[oklch(0.06_0.005_260/0.7)] backdrop-blur-xl border-b border-transparent"
        )}
      >
        {/* Gold accent line */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent transition-opacity duration-300",
            scrolled ? "opacity-100" : "opacity-40"
          )}
        />

        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Image
                src="/Escudo Fernet 2023 PNG.png"
                alt="Escudo Club Atlético Fernet con Guaymallén"
                width={36}
                height={36}
                className="object-contain drop-shadow-sm transition-[filter] duration-300 group-hover:drop-shadow-[0_0_10px_oklch(0.60_0.16_55/0.5)]"
                priority
              />
            </motion.div>
            <span className="text-lg font-bold tracking-tight select-none">
              Fernet<span className="text-gradient-gold">App</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");
              return (
                <Link key={link.href} href={link.href}>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 relative transition-colors duration-200",
                        isActive
                          ? "bg-accent/15 text-accent dark:bg-accent/10 dark:text-accent font-semibold shadow-[inset_0_0_12px_oklch(0.60_0.16_55/0.06)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-md bg-accent/10 -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                      )}
                    </Button>
                  </motion.div>
                </Link>
              );
            })}

            <div className="w-px h-6 bg-border/40 dark:bg-white/[0.06] mx-2" />

            <PushNotificationOptIn />

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="ml-0.5 relative"
                aria-label="Cambiar tema"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
              </Button>
            </motion.div>
          </nav>

          {/* Mobile right side */}
          <div className="flex items-center gap-1 md:hidden">
            <PushNotificationOptIn />
            <motion.div
              whileTap={{ scale: 0.9, rotate: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Cambiar tema"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
              </Button>
            </motion.div>

            {/* Animated hamburger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              className="relative"
            >
              <div className="flex flex-col items-center justify-center w-5 h-5 gap-[5px]">
                <motion.span
                  animate={
                    mobileOpen
                      ? { rotate: 45, y: 7 }
                      : { rotate: 0, y: 0 }
                  }
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="block w-5 h-[2px] bg-current origin-center"
                />
                <motion.span
                  animate={
                    mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }
                  }
                  transition={{ duration: 0.15 }}
                  className="block w-5 h-[2px] bg-current origin-center"
                />
                <motion.span
                  animate={
                    mobileOpen
                      ? { rotate: -45, y: -7 }
                      : { rotate: 0, y: 0 }
                  }
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="block w-5 h-[2px] bg-current origin-center"
                />
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Fullscreen Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/98 dark:bg-[oklch(0.06_0.005_260/0.98)] backdrop-blur-2xl" />

            {/* Content */}
            <nav className="relative flex flex-col h-full pt-20 pb-8 px-6">
              {/* Nav links */}
              <div className="flex-1 flex flex-col justify-center gap-2">
                {navLinks.map((link, i) => {
                  const Icon = link.icon;
                  const isActive =
                    pathname === link.href ||
                    pathname.startsWith(link.href + "/");
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{
                        duration: 0.3,
                        delay: i * 0.06,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                    >
                      <Link href={link.href} onClick={() => setMobileOpen(false)}>
                        <motion.div
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            "flex items-center gap-4 px-5 py-4 rounded-2xl text-lg font-medium transition-colors duration-200",
                            isActive
                              ? "bg-accent/12 text-accent font-semibold shadow-[inset_0_0_20px_oklch(0.60_0.16_55/0.06)]"
                              : "text-muted-foreground active:bg-white/[0.05]"
                          )}
                        >
                          <div
                            className={cn(
                              "flex items-center justify-center w-11 h-11 rounded-xl transition-colors duration-200",
                              isActive
                                ? "bg-accent/15 text-accent"
                                : "bg-white/[0.04] text-muted-foreground"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span>{link.label}</span>
                          {isActive && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                          )}
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom branding */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="text-center pt-6 border-t border-white/[0.06]"
              >
                <p className="text-xs text-muted-foreground/50 tracking-widest uppercase">
                  Fernet con Guaymallén
                </p>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
