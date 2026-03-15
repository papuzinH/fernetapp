"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  targetDate: string; // ISO string
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 1_000); // update every second
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <TimeUnit value={timeLeft.days} label="días" />
      <Sep />
      <TimeUnit value={timeLeft.hours} label="hs" />
      <Sep />
      <TimeUnit value={timeLeft.minutes} label="min" />
      <Sep />
      <TimeUnit value={timeLeft.seconds} label="seg" />
    </div>
  );
}

function Sep() {
  return <span className="text-2xl font-bold text-accent/60 pb-5 animate-pulse-colon">:</span>;
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl bg-white/[0.04] dark:bg-white/[0.06] border border-white/[0.06] px-2.5 sm:px-3.5 py-1.5 backdrop-blur-sm">
        <span className="text-3xl sm:text-4xl font-serif font-black tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-1.5 font-medium">
        {label}
      </span>
    </div>
  );
}

function calcTimeLeft(targetDate: string) {
  const target = new Date(targetDate);
  const now = new Date();
  const total = target.getTime() - now.getTime();

  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, total };
}
