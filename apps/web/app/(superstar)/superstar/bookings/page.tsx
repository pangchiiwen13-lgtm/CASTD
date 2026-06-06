"use client";
import { useEffect, useState } from "react";
import { api, SuperstarBooking } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { RatingModal } from "@/components/RatingModal";

const STATUS_META: Record<string, { label: string; color: string; icon: string; description: string }> = {
  open:      { label: "Submitted",  color: "bg-blue-50 text-blue-700 border-blue-200",      icon: "📋", description: "Your booking has been submitted and is awaiting review." },
  reviewing: { label: "Reviewing",  color: "bg-yellow-50 text-yellow-700 border-yellow-200",  icon: "🔍", description: "The CASTD team is reviewing this booking." },
  confirmed: { label: "Confirmed",  color: "bg-green-50 text-green-700 border-green-200",    icon: "✅", description: "You've been confirmed for this campaign. Await brand contact." },
  closed:    { label: "Closed",     color: "bg-gray-50 text-gray-500 border-gray-200",         icon: "🚫", description: "This booking has been closed." },
};

const TABS = ["All", "Active", "Confirmed", "Closed"] as const;
type Tab = typeof TABS[number];

export default function SuperstarBookingsPage() {
  const [bookings, setBookings] = useState<SuperstarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");
  const [ratingTarget, setRatingTarget] = useState<SuperstarBooking | null>(null);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    api.getMyBookings(token)
      .then(async (data) => {
        setBookings(data);
        // Pre-check which closed bookings are already rated
        const closed = data.filter(b => b.status === "closed");
        await Promise.all(closed.map(async (b) => {
          try {
            const r = await api.checkRating(b.id, token);
            if (r.has_rated) setRatedIds(s => new Set(s).add(b.id));
          } catch (_) {}
        }));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter(b => {
    if (tab === "All") return true;
    if (tab === "Active") return ["open", "reviewing"].includes(b.status);
    if (tab === "Confirmed") return b.status === "confirmed";
    if (tab === "Closed") return b.status === "closed";
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-sm text-muted-foreground mt-1">All campaigns that have submitted an inquiry for you.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No bookings {tab !== "All" ? `in "${tab}"` : "yet"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "All"
              ? "Brands can discover and book you once your profile is live."
              : "Try the All tab to see all bookings."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => {
            const meta = STATUS_META[b.status] || STATUS_META.open;
            return (
              <div key={b.id} className="rounded-xl border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{b.campaign_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{b.brand_name}</p>
                    {b.campaign_type && (
                      <p className="text-xs text-muted-foreground mt-0.5">{b.campaign_type}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0 mt-1">
                    {new Date(b.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {b.brief_text && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{b.brief_text}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {b.budget_range && <span>💰 {b.budget_range}</span>}
                  {b.preferred_dates && <span>📅 {b.preferred_dates}</span>}
                </div>

                {/* Status description */}
                <div className={`mt-4 text-xs px-3 py-2 rounded-lg border flex items-center justify-between gap-4 ${meta.color}`}>
                  <span>{meta.description}</span>
                  {b.status === "closed" && (
                    ratedIds.has(b.id) ? (
                      <span className="text-green-600 font-medium shrink-0">★ Rated</span>
                    ) : (
                      <button
                        className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
                        onClick={() => setRatingTarget(b)}
                      >
                        Rate this brand
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ratingTarget && (
        <RatingModal
          inquiryId={ratingTarget.id}
          campaignName={ratingTarget.campaign_name}
          onClose={() => setRatingTarget(null)}
          onDone={() => {
            setRatedIds(s => new Set(s).add(ratingTarget.id));
            setRatingTarget(null);
          }}
        />
      )}
    </div>
  );
}
