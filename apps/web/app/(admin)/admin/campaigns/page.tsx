"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Campaign } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_required: { label: "No payment",     color: "bg-gray-100 text-gray-500" },
  pending:      { label: "Pending",         color: "bg-amber-100 text-amber-700" },
  held:         { label: "Held in escrow",  color: "bg-emerald-100 text-emerald-700" },
  released:     { label: "Released",        color: "bg-blue-100 text-blue-700" },
  refunded:     { label: "Refunded",        color: "bg-red-100 text-red-700" },
};

function fmtDate(s?: string) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCampaignsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"held" | "all">("held");

  useEffect(() => {
    if (!session) return;
    const token = getSessionToken() || "";
    api.adminListCampaigns(token)
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  async function handleRelease(campaignId: string) {
    if (!confirm("Release this payment to the talent? This cannot be undone.")) return;
    setReleasing(campaignId);
    try {
      const token = getSessionToken() || "";
      const updated = await api.releaseCampaignPayment(campaignId, token);
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, ...updated } : c));
    } catch (e: any) {
      alert(e.message || "Failed to release payment");
    } finally { setReleasing(null); }
  }

  const cashCampaigns = campaigns.filter(c => c.remuneration_type === "cash" && c.amount_sgd);
  const displayed = filter === "held"
    ? cashCampaigns.filter(c => c.payment_status === "held")
    : cashCampaigns;

  const heldCount = cashCampaigns.filter(c => c.payment_status === "held").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          Admin
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold">Campaign Payments</h1>
      </div>

      {heldCount > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
          <p className="text-sm font-medium text-emerald-800">
            {heldCount} campaign{heldCount > 1 ? "s" : ""} with payment held in escrow - action required
          </p>
          <p className="text-xs text-emerald-700 mt-1">
            Review each campaign below. Once the brand has confirmed delivery, click "Release payment" to pay the talent via bank transfer or PayNow.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("held")}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${filter === "held" ? "bg-[#0C0C0C] text-white border-[#0C0C0C]" : "border-gray-200 hover:border-gray-400"}`}
        >
          Held in escrow {heldCount > 0 && `(${heldCount})`}
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${filter === "all" ? "bg-[#0C0C0C] text-white border-[#0C0C0C]" : "border-gray-200 hover:border-gray-400"}`}
        >
          All cash campaigns
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {filter === "held" ? "No payments currently held in escrow." : "No cash campaigns yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(c => {
            const ps = PAYMENT_STATUS_LABELS[c.payment_status || "not_required"];
            return (
              <div key={c.id} className="rounded-xl border border-[#F0EDEA] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{c.campaign_name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ps.color}`}>{ps.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.company_name} x {c.talent_name}
                      {c.ig_handle && <span> (@{c.ig_handle})</span>}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-xs font-medium text-[#1A1A1A]">SGD {c.amount_sgd}</span>
                      <span className="text-xs text-muted-foreground">Status: {c.status}</span>
                      <span className="text-xs text-muted-foreground">Created: {fmtDate(c.created_at)}</span>
                      {c.payment_released_at && (
                        <span className="text-xs text-blue-600">Released: {fmtDate(c.payment_released_at)}</span>
                      )}
                    </div>
                  </div>

                  {c.payment_status === "held" && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      disabled={releasing === c.id}
                      onClick={() => handleRelease(c.id)}
                    >
                      {releasing === c.id ? "Releasing..." : "Release payment"}
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
