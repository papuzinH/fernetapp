"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

// ── Reusable animation variants ──

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

// ── MotionCard: Animated card wrapper with hover/tap feedback ──

export function MotionCard({
  children,
  className,
  delay = 0,
  ...props
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
} & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      whileHover={{
        y: -3,
        boxShadow:
          "0 8px 40px oklch(0 0 0 / 50%), 0 0 28px oklch(0.60 0.16 55 / 22%), 0 0 64px oklch(0.60 0.16 55 / 8%)",
        transition: { duration: 0.22 },
      }}
      whileTap={{ scale: 0.97, boxShadow: "0 2px 12px oklch(0 0 0 / 40%)" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerContainer: Staggers children entrance ──

export function StaggerContainer({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.06,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerItem: Single child within a StaggerContainer ──

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── FadeIn: Simple fade with optional direction ──

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}) {
  const offset = 20;
  const directionMap = {
    up: { y: offset },
    down: { y: -offset },
    left: { x: offset },
    right: { x: -offset },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── SlideIn: Mobile menu slide animation ──

export function SlideIn({
  children,
  className,
  isOpen,
}: {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={
        isOpen
          ? { height: "auto", opacity: 1 }
          : { height: 0, opacity: 0 }
      }
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}
