"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Inquiry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; color: string; dot: string; desc: string }> = {
  pending:   { label: "Awaiting response", color: "bg-amber-50 text-amber-700 border-amber-200",  dot: "bg-amber-400",   desc: "Waiting for the Superstar to accept or decline." },
  accepted:  { label: "Accepted",          color: "bg-green-50 text-green-700 border-green-200",  dot: "bg-green-500",   desc: "Offer accepted. Head to Campaigns to chat and track delivery." },
  declined:  { label: "Declined",          color: "bg-[#F5F3F0] text-[#9A9A9A] border-[#E8E4E0]", dot: "bg-[#CCCCCC]", desc: "The Superstar has declined this offer." },
  cancelled: { label: "Cancelled",         color: "bg-[#F5F3F0] text-[#9A9A9A] border-[#E8E4E0]", dot: "bg-[#CCCCCC]", desc: "This offer was cancelled." },
};

const TABS = ["All", "Pending", "Accepted", "Closed"] as const;
type Tab = typeof TABS[number];

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCompensation(inq: Inquiry) {
  if (inq.remuneration_type === "product") return inq.product_description ? `Product: ${inq.product_description.slice(0, 60)}` : "Product / Gifting";
  if (inq.budget_range) return inq.budget_range;
  return "Cash";
}

export default function InquiriesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session) return;
    api.getInquiries(getSessionToken() || "")
      .then(setInquiries)
      .finally(() => setLoading(false));
  }, [session, isPending]);

  const filtered = inquiries.filter(i => {
    if (tab === "All") return true;
    if (tab === "Pending") return i.status === "pending";
    if (tab === "Accepted") return i.status === "accepted";
    if (tab === "Closed") return i.status === "declined" || i.status === "cancelled";
    return true;
  });

  const pendingCount = inquiries.filter(i => i.status === "pending").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Sent Offers</h1>
          <p className="text-sm text-[#9A9A9A] mt-1">Offers sent to Superstars. Accepted offers move to Campaigns.</p>
        </div>
        <Link href="/catalog">
          <Button className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full">
            Browse catalog
          </Button>
        </Link>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 bg-white border border-[#F0EDEA] p-1 rounded-xl shadow-sm w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-1.5 text-sm py-1.5 px-4 rounded-lg font-medium transition-all",
              tab === t ? "bg-[#0C0C0C] text-white shadow-sm" : "text-[#9A9A9A] hover:text-[#1A1A1A]",
            )}
          >
            {t}
            {t === "Pending" && pendingCount > 0 && (
              <span className={cn(
                "text-[10px] min-w-[18px] h-[18px] px-1 rounded-full font-bold",
                tab === t ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700",
              )}>{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F0EDEA] py-16 px-8 text-center shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F3F0] mx-auto mb-3 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-[#CCCCCC]" />
          </div>
          {tab === "All" ? (
            <>
              <h2 className="text-base font-semibold mb-2">No offers sent yet</h2>
              <p className="text-sm text-[#9A9A9A] mb-5">Find a Superstar and send them an offer.</p>
              <Link href="/catalog"><Button className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full">Browse catalog</Button></Link>
            </>
          ) : (
            <p className="text-sm text-[#9A9A9A]">No {tab.toLowerCase()} offers.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inq => (
            <InquiryCard key={inq.id} inquiry={inq} />
          ))}
        </div>
      )}
    </div>
  );
}

function InquiryCard({ inquiry: i }: { inquiry: Inquiry }) {
  const st = STATUS_META[i.status] || STATUS_META.pending;
  const photo = i.photo_urls?.[0];

  return (
    <div className={cn(
      "rounded-2xl bg-white shadow-sm overflow-hidden",
      i.status === "pending" ? "border-2 border-amber-200" : "border border-[#F0EDEA]",
    )}>
      {i.status === "pending" && <div className="h-0.5 bg-[#FFD200]" />}
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-[#0C0C0C] shrink-0 flex items-center justify-center">
            {photo
              ? <img src={photo} alt="" className="w-full h-full object-cover" />
              : <span className="text-[#FFD200] font-bold text-xs">{i.talent_name?.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-sm text-[#1A1A1A]">{i.campaign_name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${st.color}`}>{st.label}</span>
            </div>
            <p className="text-xs text-[#9A9A9A]">
              to <span className="font-medium text-[#6A6A6A]">{i.talent_name}</span>
              {i.ig_handle && <span> @{i.ig_handle}</span>}
              <span> - {fmtDate(i.created_at)}</span>
            </p>
            <p className="text-xs text-[#9A9A9A] mt-1">{st.desc}</p>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#6A6A6A]">
              <span><span className="font-medium text-[#1A1A1A]">Offer:</span> {fmtCompensation(i)}</span>
              {i.preferred_dates && <span><span className="font-medium text-[#1A1A1A]">Dates:</span> {i.preferred_dates}</span>}
            </div>
          </div>

          {i.status === "accepted" && (
            <Link href="/campaigns" className="shrink-0 text-xs text-[#9A9A9A] hover:text-[#1A1A1A] underline underline-offset-2">
              View campaign
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
