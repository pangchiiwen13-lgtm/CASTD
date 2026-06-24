"use client";
import { useEffect, useState } from "react";
import { api, SuperstarBooking } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { RatingModal } from "@/components/RatingModal";

const STATUS_META: Record<string, { label: string; color: string; dot: string; description: string }> = {
  open:      { label: "Submitted",  color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",   description: "Your booking has been submitted and is awaiting review." },
  reviewing: { label: "Reviewing",  color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400",  description: "The Northstar team is reviewing this booking." },
  confirmed: { label: "Confirmed",  color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500",  description: "You've been confirmed for this campaign. Await brand contact." },
  closed:    { label: "Closed",     color: "bg-[#F5F3F0] text-[#9A9A9A] border-[#E8E4E0]", dot: "bg-[#CCCCCC]",  description: "This booking has been closed." },
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
        <h1 className="text-2xl font-bold text-[#1A1A1A]">My Bookings</h1>
        <p className="text-sm text-[#9A9A9A] mt-1">All campaigns that have submitted an inquiry for you.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 border border-[#F0EDEA] shadow-sm w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-all ${tab === t ? "bg-[#0C0C0C] text-[#FFD200]" : "text-[#9A9A9A] hover:text-[#1A1A1A]"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#9A9A9A] text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#F0EDEA]">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F3F0] mx-auto mb-3 flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-[#DDDDDD] inline-block" />
          </div>
          <p className="font-medium text-[#1A1A1A]">No bookings {tab !== "All" ? `in "${tab}"` : "yet"}</p>
          <p className="text-sm text-[#9A9A9A] mt-1">
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
              <div key={b.id} className="rounded-2xl bg-white border border-[#F0EDEA] p-5 hover:shadow-md transition-shadow shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate text-[#1A1A1A]">{b.campaign_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${meta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#9A9A9A] mt-1">{b.brand_name}</p>
                    {b.campaign_type && (
                      <p className="text-xs text-[#9A9A9A] mt-0.5">{b.campaign_type}</p>
                    )}
                  </div>
                  <p className="text-xs text-[#9A9A9A] shrink-0 mt-1">
                    {new Date(b.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {b.brief_text && (
                  <p className="text-sm text-[#9A9A9A] mt-3 line-clamp-2">{b.brief_text}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#9A9A9A]">
                  {b.budget_range && <span>Budget: {b.budget_range}</span>}
                  {b.preferred_dates && <span>Dates: {b.preferred_dates}</span>}
                </div>

                <div className={`mt-4 text-xs px-3 py-2 rounded-xl border flex items-center justify-between gap-4 ${meta.color}`}>
                  <span>{meta.description}</span>
                  {b.status === "closed" && (
                    ratedIds.has(b.id) ? (
                      <span className="text-green-600 font-medium shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Rated
                      </span>
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
