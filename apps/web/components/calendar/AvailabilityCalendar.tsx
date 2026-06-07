"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AvailabilityRule } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL  = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// 30-min time slots 00:00 - 23:30
function buildTimeOptions() {
  const opts: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = h.toString().padStart(2, "0");
      const mm = m === 0 ? "00" : "30";
      const val = `${hh}:${mm}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const ampm = h < 12 ? "am" : "pm";
      opts.push({ value: val, label: `${hour12}:${mm}${ampm}` });
    }
  }
  return opts;
}
const TIME_OPTIONS = buildTimeOptions();

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
}

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

interface Props {
  talentId: string;
  blockedDates: string[];
  availabilityRules: AvailabilityRule[];
  editable?: boolean;
  token?: string;
  onBlockedChange?: (dates: string[]) => void;
  onRulesChange?: (rules: AvailabilityRule[]) => void;
}

export function AvailabilityCalendar({
  talentId, blockedDates, availabilityRules,
  editable = false, token,
  onBlockedChange, onRulesChange,
}: Props) {

  // ---- Schedule (weekly hours) state ----
  // Index 0-6 = Sun-Sat; null means day not active
  const [rules, setRules] = useState<(AvailabilityRule | null)[]>(() => {
    const arr: (AvailabilityRule | null)[] = Array(7).fill(null);
    availabilityRules.forEach(r => { arr[r.day_of_week] = r; });
    return arr;
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [tab, setTab] = useState<"schedule" | "dates">("schedule");

  // ---- Calendar (block dates) state ----
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [blocked, setBlocked] = useState<Set<string>>(new Set(blockedDates));

  // Sync state when props load asynchronously (async API fetch after mount)
  useEffect(() => {
    setBlocked(new Set(blockedDates));
  }, [blockedDates]);

  useEffect(() => {
    const arr: (AvailabilityRule | null)[] = Array(7).fill(null);
    availabilityRules.forEach(r => { arr[r.day_of_week] = r; });
    setRules(arr);
  }, [availabilityRules]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const todayKey = toKey(today);

  // Build a DOW -> rule map for the read-only view
  const rulesMap = new Map<number, AvailabilityRule>(
    availabilityRules.map(r => [r.day_of_week, r])
  );

  // ---- Schedule actions ----
  function toggleDay(dow: number) {
    setRules(prev => {
      const next = [...prev];
      next[dow] = next[dow] ? null : { day_of_week: dow, start_time: "09:00", end_time: "18:00" };
      return next;
    });
  }

  function updateTime(dow: number, field: "start_time" | "end_time", val: string) {
    setRules(prev => {
      const next = [...prev];
      if (next[dow]) next[dow] = { ...next[dow]!, [field]: val };
      return next;
    });
  }

  function applyPreset(preset: "weekdays-9-6" | "weekdays-10-7" | "evenings" | "weekends" | "clear") {
    setRules(() => {
      const next: (AvailabilityRule | null)[] = Array(7).fill(null);
      if (preset === "clear") return next;
      if (preset === "weekdays-9-6") {
        [1, 2, 3, 4, 5].forEach(d => { next[d] = { day_of_week: d, start_time: "09:00", end_time: "18:00" }; });
      } else if (preset === "weekdays-10-7") {
        [1, 2, 3, 4, 5].forEach(d => { next[d] = { day_of_week: d, start_time: "10:00", end_time: "19:00" }; });
      } else if (preset === "evenings") {
        [1, 2, 3, 4, 5].forEach(d => { next[d] = { day_of_week: d, start_time: "18:00", end_time: "22:00" }; });
      } else if (preset === "weekends") {
        [0, 6].forEach(d => { next[d] = { day_of_week: d, start_time: "10:00", end_time: "17:00" }; });
      }
      return next;
    });
  }

  async function saveSchedule() {
    if (!token) return;
    setSavingSchedule(true);
    setSavedMsg("");
    try {
      const activeRules = rules.filter(Boolean) as AvailabilityRule[];
      const res = await fetch(`${API_URL}/calendar/${talentId}/schedule`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ rules: activeRules }),
      });
      if (res.ok) {
        setSavedMsg("Saved");
        onRulesChange?.(activeRules);
        setTimeout(() => setSavedMsg(""), 2500);
      }
    } finally { setSavingSchedule(false); }
  }

  // ---- Block-date calendar actions ----
  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
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
          if (next.has(key)) next.delete(key); else next.add(key);
          onBlockedChange?.([...next]);
          return next;
        });
      }
    } finally { setToggling(null); }
  }

  // ---- Calendar grid ----
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // ========================================================
  // READ-ONLY VIEW (for brands)
  // ========================================================
  if (!editable) {
    return (
      <div className="select-none">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth}
            className="w-8 h-8 rounded-lg hover:bg-[#FFF0D6] flex items-center justify-center font-bold text-[#1A1A1A] transition-colors">
            &lt;
          </button>
          <span className="text-sm font-semibold text-[#1A1A1A]">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth}
            className="w-8 h-8 rounded-lg hover:bg-[#FFF0D6] flex items-center justify-center font-bold text-[#1A1A1A] transition-colors">
            &gt;
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] text-[#9A9A9A] font-semibold uppercase tracking-wider py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} />;
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isPast = key < todayKey;
            const isBlocked = blocked.has(key);
            const dow = new Date(year, month, day).getDay();
            const rule = rulesMap.get(dow);
            const hasSlot = !!rule && !isBlocked && !isPast;
            const isToday = key === todayKey;
            const isHovered = hoveredKey === key;

            return (
              <div
                key={key}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-lg text-xs font-medium relative transition-all",
                  isPast && "text-[#CCCCCC]",
                  !isPast && isBlocked && "bg-red-50 text-red-500",
                  !isPast && !isBlocked && hasSlot && "bg-[#E8F5E9] text-[#1A1A1A] cursor-pointer hover:bg-[#C8E6C9]",
                  !isPast && !isBlocked && !rule && "text-[#BBBBBB]",
                  isToday && !isBlocked && "ring-2 ring-[#FFD200] ring-offset-1",
                )}
                onMouseEnter={() => hasSlot && setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                {day}
                {isHovered && rule && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#1A1A1A] text-white text-[9px] rounded-lg px-2 py-1.5 whitespace-nowrap z-20 shadow-lg pointer-events-none">
                    {fmt12(rule.start_time)} - {fmt12(rule.end_time)}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1A1A1A]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[10px] text-[#9A9A9A]">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#E8F5E9] border border-[#C8E6C9] inline-block" />
            Available (hover for hours)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-50 inline-block" />
            Unavailable
          </span>
        </div>

        {/* Weekly summary */}
        {availabilityRules.length > 0 && (
          <div className="mt-5 pt-4 border-t border-[#F0EDEA]">
            <p className="text-[10px] text-[#9A9A9A] uppercase tracking-widest font-semibold mb-3">Weekly hours</p>
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5, 6, 0].map(d => {
                const r = rulesMap.get(d);
                if (!r) return null;
                return (
                  <div key={d} className="flex items-center justify-between text-xs">
                    <span className="text-[#9A9A9A] w-24">{DAYS_FULL[d]}</span>
                    <span className="font-medium text-[#1A1A1A]">{fmt12(r.start_time)} - {fmt12(r.end_time)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {availabilityRules.length === 0 && (
          <p className="mt-4 text-xs text-[#BBBBBB] italic">No recurring schedule set yet.</p>
        )}
      </div>
    );
  }

  // ========================================================
  // EDITABLE VIEW (for talent / superstar)
  // ========================================================
  return (
    <div className="select-none">
      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-[#F5F3F0] p-1 rounded-xl">
        <button
          onClick={() => setTab("schedule")}
          className={cn(
            "flex-1 text-sm py-2 px-4 rounded-lg font-medium transition-all",
            tab === "schedule" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#9A9A9A] hover:text-[#1A1A1A]",
          )}
        >
          Weekly Hours
        </button>
        <button
          onClick={() => setTab("dates")}
          className={cn(
            "flex-1 text-sm py-2 px-4 rounded-lg font-medium transition-all",
            tab === "dates" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#9A9A9A] hover:text-[#1A1A1A]",
          )}
        >
          Block Dates
        </button>
      </div>

      {/* ---- SCHEDULE TAB ---- */}
      {tab === "schedule" && (
        <div className="space-y-5">
          {/* Quick-set presets */}
          <div>
            <p className="text-xs text-[#9A9A9A] mb-2 font-medium uppercase tracking-wider">Quick set</p>
            <div className="flex flex-wrap gap-2">
              {([
                { label: "Weekdays 9am - 6pm",  preset: "weekdays-9-6"  },
                { label: "Weekdays 10am - 7pm", preset: "weekdays-10-7" },
                { label: "Weekends 10am - 5pm", preset: "weekends"       },
                { label: "Evenings 6pm - 10pm", preset: "evenings"       },
                { label: "Clear all",           preset: "clear"          },
              ] as const).map(({ label, preset }) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-all font-medium",
                    preset === "clear"
                      ? "border-[#E8E4E0] text-[#9A9A9A] hover:border-red-200 hover:text-red-500"
                      : "border-[#FFD200]/60 bg-[#FFFBEB] text-[#1A1A1A] hover:bg-[#FFD200]/20 hover:border-[#FFD200]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Day rows - Mon to Sun */}
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 0].map(dow => {
              const rule = rules[dow];
              const active = !!rule;
              return (
                <div
                  key={dow}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
                    active ? "border-[#FFD200] bg-[#FFFBEB]" : "border-[#E8E4E0] bg-white",
                  )}
                >
                  {/* Toggle */}
                  <button
                    onClick={() => toggleDay(dow)}
                    className={cn(
                      "w-10 h-6 rounded-full relative transition-colors flex-shrink-0",
                      active ? "bg-[#FFD200]" : "bg-[#E0DDD9]",
                    )}
                  >
                    <span className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                      active ? "translate-x-5" : "translate-x-1",
                    )} />
                  </button>

                  {/* Day name */}
                  <span className={cn(
                    "text-sm w-24 font-medium flex-shrink-0",
                    active ? "text-[#1A1A1A]" : "text-[#BBBBBB]",
                  )}>
                    {DAYS_FULL[dow]}
                  </span>

                  {/* Time range */}
                  {active ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <select
                        value={rule!.start_time}
                        onChange={e => updateTime(dow, "start_time", e.target.value)}
                        className="text-xs border border-[#E8E4E0] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#FFD200] flex-1 min-w-0"
                      >
                        {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <span className="text-xs text-[#9A9A9A] flex-shrink-0">to</span>
                      <select
                        value={rule!.end_time}
                        onChange={e => updateTime(dow, "end_time", e.target.value)}
                        className="text-xs border border-[#E8E4E0] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#FFD200] flex-1 min-w-0"
                      >
                        {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs text-[#CCCCCC] italic">Not available</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save row */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              onClick={saveSchedule}
              disabled={savingSchedule}
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-xl font-semibold"
            >
              {savingSchedule ? "Saving..." : "Save schedule"}
            </Button>
            {savedMsg && (
              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {savedMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ---- BLOCK DATES TAB ---- */}
      {tab === "dates" && (
        <div>
          <p className="text-xs text-[#9A9A9A] mb-4 leading-relaxed">
            Click dates to mark them unavailable. Use this for holidays, leave, or specific days you cannot shoot.
          </p>

          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth}
              className="w-8 h-8 rounded-lg hover:bg-[#F5F3F0] flex items-center justify-center font-bold text-[#1A1A1A] transition-colors">
              &lt;
            </button>
            <span className="text-sm font-semibold text-[#1A1A1A]">{MONTHS[month]} {year}</span>
            <button onClick={nextMonth}
              className="w-8 h-8 rounded-lg hover:bg-[#F5F3F0] flex items-center justify-center font-bold text-[#1A1A1A] transition-colors">
              &gt;
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[10px] text-[#9A9A9A] font-semibold uppercase tracking-wider py-1">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isBlocked = blocked.has(key);
              const isToday = key === todayKey;
              const isPast = key < todayKey;
              const isToggling = toggling === key;

              return (
                <button
                  key={key}
                  onClick={() => !isPast && toggleDate(key)}
                  disabled={isPast || isToggling}
                  className={cn(
                    "aspect-square w-full flex items-center justify-center rounded-lg text-xs font-medium transition-all",
                    isPast && "text-[#CCCCCC] cursor-default",
                    !isPast && !isBlocked && "hover:bg-[#FFF8EC] text-[#1A1A1A]",
                    !isPast && isBlocked && "bg-red-100 text-red-700 hover:bg-red-200",
                    isToday && !isBlocked && "ring-2 ring-[#FFD200]",
                    isToggling && "opacity-40",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-[10px] text-[#9A9A9A]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-lg bg-white border border-[#E8E4E0] inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-lg bg-red-100 inline-block" />
              Blocked
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
