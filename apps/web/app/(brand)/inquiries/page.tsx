"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Inquiry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";
import { RatingModal } from "@/components/RatingModal";
import Link from "next/link";

const STATUS_META: Record<string, {
  label: string; color: string; dot: string; description: string;
}> = {
  open: {
    label: "Submitted",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
    description: "Your inquiry has been submitted. The CASTD team is reviewing it.",
  },
  reviewing: {
    label: "Reviewing",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
    description: "We're reviewing your inquiry and matching you with the right Superstar. Confirm when you're ready to proceed.",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
    description: "Booking confirmed! Head to Campaigns to chat with your Superstar and track delivery.",
  },
  closed: {
    label: "Closed",
    color: "bg-[#F5F3F0] text-[#9A9A9A] border-[#E8E4E0]",
    dot: "bg-[#CCCCCC]",
    description: "This inquiry has been closed.",
  },
};

const TABS = ["All", "Active", "Confirmed", "Closed"] as const;
type Tab = typeof TABS[number];

export default function InquiriesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("All");
  const [ratingTarget, setRatingTarget] = useState<Inquiry | null>(null);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session) return;
    api.getInquiries(getSessionToken() || "")
      .then(setInquiries)
      .finally(() => setLoading(false));
  }, [session, isPending]);

  async function checkIfRated(inq: Inquiry) {
    if (inq.status !== "closed") return;
    const token = getSessionToken();
    if (!token) return;
    try {
      const result = await api.checkRating(inq.id, token);
      if (result.has_rated) setRatedIds(s => new Set(s).add(inq.id));
    } catch (_) {}
  }

  async function handleConfirm(inquiryId: string) {
    setConfirming(inquiryId);
    try {
      const result = await api.createCheckout(inquiryId, getSessionToken() || "");
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      } else if (result.confirmed) {
        setInquiries(list => list.map(i => i.id === inquiryId ? { ...i, status: "confirmed" } : i));
      }
    } finally {
      setConfirming(null);
    }
  }

  const filtered = inquiries.filter(inq => {
    if (tab === "All") return true;
    if (tab === "Active") return ["open", "reviewing"].includes(inq.status);
    if (tab === "Confirmed") return inq.status === "confirmed";
    if (tab === "Closed") return inq.status === "closed";
    return true;
  });

  const activeCount = inquiries.filter(i => ["open", "reviewing"].includes(i.status)).length;

  return (
    <>
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Inquiries</h1>
        <p className="text-sm text-[#9A9A9A] mt-1">
          Track your campaign submissions from browsing to confirmed booking.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 border border-[#F0EDEA] shadow-sm w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 ${tab === t ? "bg-[#FFD200] text-[#0C0C0C]" : "text-[#9A9A9A] hover:text-[#1A1A1A]"}`}>
            {t}
            {t === "Active" && activeCount > 0 && (
              <span className="bg-[#0C0C0C] text-[#FFD200] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#F0EDEA]">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F3F0] mx-auto mb-3 flex items-center justify-center">
            <span className="w-4 h-4 rounded-full bg-[#DDDDDD] inline-block" />
          </div>
          <p className="font-medium text-[#1A1A1A]">No {tab !== "All" ? tab.toLowerCase() + " " : ""}inquiries</p>
          <p className="text-sm text-[#9A9A9A] mt-1">
            {tab === "All"
              ? "Browse the catalog and submit an inquiry to get started."
              : "Try the All tab to see everything."}
          </p>
          {tab === "All" && (
            <Button
              variant="outline"
              className="mt-4 rounded-full"
              onClick={() => router.push("/catalog")}
            >
              Browse catalog
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(inq => {
            const meta = STATUS_META[inq.status] || STATUS_META.open;
            return (
              <div key={inq.id} className="rounded-2xl bg-white border border-[#F0EDEA] overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-[#1A1A1A]">{inq.campaign_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${meta.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${meta.dot}`} />
                        {meta.label}
                      </span>
                    </div>
                    {inq.campaign_type && (
                      <p className="text-sm text-[#9A9A9A]">{inq.campaign_type}</p>
                    )}
                  </div>
                  <p className="text-xs text-[#9A9A9A] shrink-0 mt-0.5">
                    {new Date(inq.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Brief */}
                {inq.brief_text && (
                  <p className="px-5 pb-3 text-sm text-[#9A9A9A] line-clamp-2">{inq.brief_text}</p>
                )}

                {/* Meta */}
                <div className="px-5 pb-3 flex flex-wrap gap-4 text-xs text-[#9A9A9A]">
                  {inq.budget_range && <span>Budget: {inq.budget_range}</span>}
                  {inq.preferred_dates && <span>Dates: {inq.preferred_dates}</span>}
                </div>

                {/* Status description + action */}
                <div className={`px-5 py-4 border-t border-[#F0EDEA] flex items-center justify-between gap-4 ${meta.color}`}>
                  <p className="text-xs">{meta.description}</p>
                  {inq.status === "reviewing" && (
                    <Button
                      size="sm"
                      className="shrink-0 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] border-0 rounded-full"
                      onClick={() => handleConfirm(inq.id)}
                      disabled={confirming === inq.id}
                    >
                      {confirming === inq.id ? "Processing..." : "Confirm talent"}
                    </Button>
                  )}
                  {inq.status === "confirmed" && (
                    <Link href="/campaigns">
                      <Button size="sm" className="shrink-0 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] border-0 rounded-full">
                        View Campaign
                      </Button>
                    </Link>
                  )}
                  {inq.status === "closed" && (
                    ratedIds.has(inq.id) ? (
                      <span className="text-xs text-green-600 font-medium shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Rated
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-8 text-xs rounded-full"
                        onClick={() => { checkIfRated(inq); setRatingTarget(inq); }}
                      >
                        Leave a review
                      </Button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

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
    </>
  );
}
