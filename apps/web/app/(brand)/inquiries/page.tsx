"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Inquiry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";

const STATUS_META: Record<string, {
  label: string; color: string; icon: string; description: string;
}> = {
  open: {
    label: "Submitted",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: "📋",
    description: "Your inquiry has been submitted. The CASTD team is reviewing it.",
  },
  reviewing: {
    label: "Reviewing",
    color: "bg-yellow-50 text-yellow-800 border-yellow-200",
    icon: "🔍",
    description: "We're reviewing your inquiry and matching you with the right Superstar. Confirm when you're ready to proceed.",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: "✅",
    description: "You're confirmed with this Superstar. We'll be in touch with next steps shortly.",
  },
  closed: {
    label: "Closed",
    color: "bg-gray-50 text-gray-500 border-gray-200",
    icon: "🚫",
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

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session) return;
    api.getInquiries(getSessionToken() || "")
      .then(setInquiries)
      .finally(() => setLoading(false));
  }, [session, isPending]);

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
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your campaign submissions from browsing to confirmed booking.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
            {t === "Active" && activeCount > 0 && (
              <span className="ml-1.5 bg-[#FFD200] text-[#0C0C0C] text-xs font-bold px-1.5 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">No {tab !== "All" ? tab.toLowerCase() + " " : ""}inquiries</p>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "All"
              ? "Browse the catalog and submit an inquiry to get started."
              : "Try the All tab to see everything."}
          </p>
          {tab === "All" && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/catalog")}
            >
              Browse catalog →
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(inq => {
            const meta = STATUS_META[inq.status] || STATUS_META.open;
            return (
              <div key={inq.id} className="rounded-xl border overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold">{inq.campaign_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                        {meta.icon} {meta.label}
                      </span>
                    </div>
                    {inq.campaign_type && (
                      <p className="text-sm text-muted-foreground">{inq.campaign_type}</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
                    {new Date(inq.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Brief */}
                {inq.brief_text && (
                  <p className="px-5 pb-3 text-sm text-muted-foreground line-clamp-2">{inq.brief_text}</p>
                )}

                {/* Meta */}
                <div className="px-5 pb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {inq.budget_range && <span>💰 {inq.budget_range}</span>}
                  {inq.preferred_dates && <span>📅 {inq.preferred_dates}</span>}
                </div>

                {/* Status description + action */}
                <div className={`px-5 py-4 border-t flex items-center justify-between gap-4 ${meta.color}`}>
                  <p className="text-xs">{meta.description}</p>
                  {inq.status === "reviewing" && (
                    <Button
                      size="sm"
                      className="shrink-0 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] border-0"
                      onClick={() => handleConfirm(inq.id)}
                      disabled={confirming === inq.id}
                    >
                      {confirming === inq.id ? "Processing…" : "Confirm talent →"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
