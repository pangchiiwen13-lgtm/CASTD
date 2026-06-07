"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { api, type Campaign } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel } from "@/components/chat/ChatPanel";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "In progress",               color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Awaiting your confirmation", color: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed",                  color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled",                  color: "bg-gray-100 text-gray-500" },
};

function fmtDate(s?: string) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function AutoReleaseCountdown({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000));
  return (
    <span className="text-xs text-amber-600 font-medium">
      Auto-confirms in {days} day{days !== 1 ? "s" : ""}
    </span>
  );
}

export default function BrandCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session && id) {
      const token = getSessionToken() || "";
      api.getCampaign(id, token)
        .then(setCampaign)
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [session, isPending, id]);

  async function handleConfirm() {
    if (!campaign) return;
    setConfirming(true);
    try {
      const updated = await api.confirmDelivery(campaign.id, getSessionToken() || "");
      setCampaign(c => c ? { ...c, ...updated } : c);
    } finally { setConfirming(false); }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );

  if (!campaign) return (
    <div className="max-w-3xl mx-auto px-6 py-10 text-center">
      <p className="text-muted-foreground">Campaign not found.</p>
      <Link href="/campaigns" className="text-sm text-primary hover:underline mt-2 block">Back to Campaigns</Link>
    </div>
  );

  const st = STATUS_LABELS[campaign.status] || { label: campaign.status, color: "bg-gray-100 text-gray-600" };
  const photo = campaign.photo_urls?.[0];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        ← Back to Campaigns
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-[#0C0C0C] shrink-0 flex items-center justify-center">
            {photo
              ? <img src={photo} alt="" className="w-full h-full object-cover" />
              : <span className="text-[#FFD200] font-bold">{campaign.talent_name?.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-bold text-xl">{campaign.campaign_name}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              with <span className="font-medium">{campaign.talent_name}</span>
              {campaign.ig_handle && <span> @{campaign.ig_handle}</span>}
              {campaign.shoot_date && <span> - {campaign.shoot_date}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Started {fmtDate(campaign.created_at)}</p>
          </div>
        </div>

        {/* Brief */}
        {(campaign.brief_text || campaign.deliverables || campaign.campaign_type) && (
          <div className="mt-5 pt-5 border-t space-y-3">
            {campaign.campaign_type && (
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Type:</span> {campaign.campaign_type}</p>
            )}
            {campaign.deliverables && (
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Deliverables:</span> {campaign.deliverables}</p>
            )}
            {campaign.brief_text && (
              <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-medium text-foreground">Brief:</span> {campaign.brief_text}</p>
            )}
          </div>
        )}

        {/* Delivery confirmation section */}
        {campaign.status === "delivered" && (
          <div className="mt-5 pt-5 border-t space-y-3">
            <p className="text-sm font-semibold">Superstar marked as delivered</p>
            {campaign.deliverable_note && (
              <p className="text-sm text-muted-foreground italic">"{campaign.deliverable_note}"</p>
            )}
            {campaign.deliverable_urls?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {campaign.deliverable_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs underline text-blue-600 hover:text-blue-800">
                    Deliverable {i + 1}
                  </a>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                size="sm"
                className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
                disabled={confirming}
                onClick={handleConfirm}
              >
                {confirming ? "Confirming..." : "Confirm delivery"}
              </Button>
              {campaign.auto_release_at && <AutoReleaseCountdown dateStr={campaign.auto_release_at} />}
            </div>
          </div>
        )}

        {campaign.status === "completed" && (
          <div className="mt-5 pt-5 border-t flex items-center gap-2 text-green-600">
            <span className="text-lg">✓</span>
            <span className="text-sm font-medium">Delivery confirmed on {fmtDate(campaign.brand_confirmed_at)}</span>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="mb-3">
        <h2 className="font-semibold text-sm mb-3">Messages</h2>
        <ChatPanel
          campaignId={campaign.id}
          myType="brand"
          otherName={campaign.talent_name}
        />
      </div>
    </div>
  );
}
