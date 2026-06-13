"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, type Notification } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_DOT: Record<string, string> = {
  inquiry_submitted: "bg-blue-400",
  inquiry_reviewing: "bg-amber-400",
  inquiry_confirmed: "bg-green-500",
  inquiry_closed:    "bg-[#CCCCCC]",
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  const fetchCount = useCallback(async () => {
    const token = getSessionToken();
    if (!token) return;
    try {
      const { count } = await api.getUnreadCount(token);
      setUnread(count);
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    const token = getSessionToken() || "";
    try {
      const list = await api.getNotifications(token);
      setNotifications(list);
    } finally {
      setLoading(false);
    }
    // Mark all read silently
    if (unread > 0) {
      await api.markAllRead(token).catch(() => {});
      setUnread(0);
    }
  }

  async function handleClick(n: Notification) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FFD200] text-[#0C0C0C] text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-xl border bg-background shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="text-sm font-semibold">Notifications</span>
            {notifications.some(n => !n.is_read) && (
              <button
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  api.markAllRead(getSessionToken() || "").catch(() => {});
                  setNotifications(list => list.map(n => ({ ...n, is_read: true })));
                  setUnread(0);
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-muted-foreground text-center">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                <div className="w-8 h-8 rounded-xl bg-[#F5F3F0] mx-auto mb-2 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full border-2 border-[#CCCCCC] inline-block" />
                </div>
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-[#FFF8EC] transition-colors flex gap-3",
                    !n.is_read && "bg-[#FFFBEB]",
                  )}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-2 inline-block ${TYPE_DOT[n.type] || "bg-[#9A9A9A]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm leading-tight", !n.is_read && "font-semibold")}>{n.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.body}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#FFD200] shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
