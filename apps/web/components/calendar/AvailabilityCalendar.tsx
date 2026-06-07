"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Props {
  talentId: string;
  blockedDates: string[];  // "YYYY-MM-DD" list
  editable?: boolean;      // true for superstar's own profile
  token?: string;
  onChange?: (dates: string[]) => void;
}

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function AvailabilityCalendar({ talentId, blockedDates, editable = false, token, onChange }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [blocked, setBlocked] = useState<Set<string>>(new Set(blockedDates));
  const [toggling, setToggling] = useState<string | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toKey(today);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function toggleDate(key: string) {
    if (!editable || !token || toggling) return;
    setToggling(key);
    try {
      const res = await fetch(`${API_URL}/calendar/${talentId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ date: key }),
      });
      if (res.ok) {
        setBlocked(prev => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          onChange?.([...next]);
          return next;
        });
      }
    } finally { setToggling(null); }
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-sm font-bold">
          &lt;
        </button>
        <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-sm font-bold">
          &gt;
        </button>
      </div>

      {/* Day header */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isBlocked = blocked.has(key);
          const isToday = key === todayKey;
          const isPast = key < todayKey;
          const isToggling = toggling === key;

          return (
            <button
              key={key}
              onClick={() => !isPast && toggleDate(key)}
              disabled={isPast || !editable || isToggling}
              className={cn(
                "aspect-square w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                isPast && "text-muted-foreground/30 cursor-default",
                !isPast && !isBlocked && "hover:bg-green-50 text-[#0C0C0C]",
                isBlocked && !isPast && "bg-red-100 text-red-700 hover:bg-red-200",
                isToday && !isBlocked && "ring-2 ring-[#FFD200] ring-offset-1",
                isToggling && "opacity-50",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-50 border border-green-200 inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 inline-block" />
          Unavailable
        </span>
        {editable && <span className="ml-auto">Click dates to toggle</span>}
      </div>
    </div>
  );
}
