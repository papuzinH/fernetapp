"use client";

import { useEffect, useState } from "react";
import { differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";

interface CountdownTimerProps {
  targetDate: string; // ISO string
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate));
    }, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [targetDate]);

  if (timeLeft.total <= 0) return null;

  return (
    <div className="flex items-center gap-3">
      <TimeUnit value={timeLeft.days} label="días" />
      <span className="text-2xl font-bold text-muted-foreground">:</span>
      <TimeUnit value={timeLeft.hours} label="hs" />
      <span className="text-2xl font-bold text-muted-foreground">:</span>
      <TimeUnit value={timeLeft.minutes} label="min" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </span>
    </div>
  );
}

function calcTimeLeft(targetDate: string) {
  const target = new Date(targetDate);
  const now = new Date();
  const total = target.getTime() - now.getTime();

  if (total <= 0) return { days: 0, hours: 0, minutes: 0, total: 0 };

  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;

  return { days, hours, minutes, total };
}
