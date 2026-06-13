"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Inquiry } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "Awaiting your response", color: "bg-amber-50 text-amber-700",   dot: "bg-amber-400" },
  accepted:  { label: "Accepted",               color: "bg-green-50 text-green-700",   dot: "bg-green-500" },
  declined:  { label: "Declined",               color: "bg-[#F5F3F0] text-[#9A9A9A]", dot: "bg-[#CCCCCC]" },
  cancelled: { label: "Cancelled",              color: "bg-[#F5F3F0] text-[#9A9A9A]", dot: "bg-[#CCCCCC]" },
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCompensation(inq: Inquiry) {
  if (inq.remuneration_type === "product") return inq.product_description ? `Product: ${inq.product_description}` : "Product / Gifting";
  if (inq.budget_range) return inq.budget_range;
  return "Cash";
}

export default function SuperstarOffersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [offers, setOffers] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) {
      const token = getSessionToken() || "";
      api.getReceivedInquiries(token)
        .then(list => setOffers(list.filter(i => i.direction === "brand_to_superstar")))
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [session, isPending]);

  async function respond(id: string, action: "accept" | "decline") {
    setResponding(id);
    try {
      const token = getSessionToken() || "";
      const updated = await api.respondToInquiry(id, action, token);
      setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
      if (action === "accept") {
        router.push("/superstar/campaigns");
      }
    } catch { /* ignore */ }
    setResponding(null);
  }

  const pending   = offers.filter(o => o.status === "pending");
  const responded = offers.filter(o => o.status !== "pending");

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Offers</h1>
        <p className="text-sm text-[#9A9A9A] mt-1">Brand offers sent directly to you. Accept to start the campaign.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : offers.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F0EDEA] py-16 px-8 text-center shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F3F0] mx-auto mb-3 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-[#CCCCCC]" />
          </div>
          <p className="text-sm text-[#9A9A9A]">No offers yet. Keep your profile up to date to attract brands.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-semibold text-[#1A1A1A]">Waiting for your response</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">{pending.length}</span>
              </div>
              <div className="space-y-3">
                {pending.map(o => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    responding={responding === o.id}
                    onAccept={() => respond(o.id, "accept")}
                    onDecline={() => respond(o.id, "decline")}
                  />
                ))}
              </div>
            </div>
          )}
          {responded.length > 0 && (
            <div>
              <h2 className="font-semibold text-[#1A1A1A] mb-3">Previous offers</h2>
              <div className="space-y-3">
                {responded.map(o => <OfferCard key={o.id} offer={o} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OfferCard({ offer: o, responding, onAccept, onDecline }: {
  offer: Inquiry;
  responding?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const st = STATUS_META[o.status] || STATUS_META.pending;
  const isPending = o.status === "pending";

  return (
    <div className={`rounded-2xl bg-white border shadow-sm overflow-hidden ${isPending ? "border-amber-200" : "border-[#F0EDEA]"}`}>
      {isPending && <div className="h-1 bg-[#FFD200]" />}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-[#1A1A1A]">{o.campaign_name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
            </div>
            <p className="text-xs text-[#9A9A9A]">
              from <span className="font-medium text-[#6A6A6A]">{o.company_name}</span>
              <span> - {fmtDate(o.created_at)}</span>
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-[#6A6A6A]">
          {(o.remuneration_type || o.budget_range) && (
            <p><span className="font-medium text-[#1A1A1A]">Offer:</span> {fmtCompensation(o)}</p>
          )}
          {o.preferred_dates && (
            <p><span className="font-medium text-[#1A1A1A]">Dates:</span> {o.preferred_dates}</p>
          )}
          {o.brief_text && (
            <p className="leading-relaxed line-clamp-3">
              <span className="font-medium text-[#1A1A1A]">Brief:</span> {o.brief_text}
            </p>
          )}
        </div>

        {isPending && onAccept && onDecline && (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full font-semibold flex-1"
              disabled={responding}
              onClick={onAccept}
            >
              {responding ? "Accepting..." : "Accept offer"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-full flex-1 border-[#E0DDD9] text-[#6A6A6A]"
              disabled={responding}
              onClick={onDecline}
            >
              Decline
            </Button>
          </div>
        )}

        {o.status === "accepted" && (
          <div className="mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-xs text-green-600 font-medium">Campaign active - check Campaigns to chat</span>
          </div>
        )}
      </div>
    </div>
  );
}
