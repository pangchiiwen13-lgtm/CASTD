"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { api, type Campaign } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChatPanel, type CampaignMeta } from "@/components/chat/ChatPanel";
import { TestimonialPromptDialog, hasGivenTestimonial } from "@/components/TestimonialPromptDialog";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "In progress",                color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered - awaiting brand", color: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed",                  color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled",                  color: "bg-gray-100 text-gray-500" },
};

function fmtDate(s?: string) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuperstarCampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeliver, setShowDeliver] = useState(false);
  const [deliverUrls, setDeliverUrls] = useState("");
  const [deliverNote, setDeliverNote] = useState("");
  const [delivering, setDelivering] = useState(false);
  const [testimonialCampaign, setTestimonialCampaign] = useState<{ inquiryId: string; name: string } | null>(null);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session && id) {
      const token = getSessionToken() || "";
      api.getCampaign(id, token)
        .then(async (c) => {
          setCampaign(c);
          // Prompt for testimonial when viewing a completed campaign (3rd+)
          if (c.status === "completed" && c.inquiry_id && !hasGivenTestimonial()) {
            const { count } = await api.getCompletedCount(token).catch(() => ({ count: 0 }));
            if (count >= 3) {
              setTestimonialCampaign({ inquiryId: c.inquiry_id, name: c.campaign_name });
            }
          }
        })
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [session, isPending, id]);

  async function handleDeliver() {
    if (!campaign) return;
    setDelivering(true);
    try {
      const urls = deliverUrls.split("\n").map(u => u.trim()).filter(Boolean);
      const updated = await api.markDelivered(
        campaign.id,
        { deliverable_urls: urls, deliverable_note: deliverNote || undefined },
        getSessionToken() || ""
      );
      setCampaign(c => c ? { ...c, ...updated } : c);
      setShowDeliver(false);
    } finally { setDelivering(false); }
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
      <Link href="/superstar/campaigns" className="text-sm text-primary hover:underline mt-2 block">Back</Link>
    </div>
  );

  const st = STATUS_LABELS[campaign.status] || { label: campaign.status, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/superstar/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        ← Back to Campaigns
      </Link>

      {/* Header card */}
      <div className="rounded-2xl bg-white border border-[#F0EDEA] shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-bold text-xl">{campaign.campaign_name}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{campaign.company_name}</span>
              {campaign.industry && <span> - {campaign.industry}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Started {fmtDate(campaign.created_at)}</p>
          </div>
          {campaign.status === "active" && (
            <Button
              size="sm"
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] shrink-0"
              onClick={() => setShowDeliver(true)}
            >
              Mark as delivered
            </Button>
          )}
        </div>

        {/* Brief */}
        {(campaign.brief_text || campaign.deliverables || campaign.campaign_type || campaign.shoot_date) && (
          <div className="mt-5 pt-5 border-t space-y-3">
            {campaign.campaign_type && (
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Type:</span> {campaign.campaign_type}</p>
            )}
            {campaign.shoot_date && (
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Dates:</span> {campaign.shoot_date}</p>
            )}
            {campaign.deliverables && (
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Deliverables:</span> {campaign.deliverables}</p>
            )}
            {campaign.brief_text && (
              <p className="text-xs text-muted-foreground leading-relaxed"><span className="font-medium text-foreground">Brief:</span> {campaign.brief_text}</p>
            )}
          </div>
        )}

        {/* Delivered state */}
        {campaign.status === "delivered" && (
          <div className="mt-5 pt-5 border-t">
            <p className="text-sm font-medium text-amber-700">
              Waiting for brand to confirm delivery
              {campaign.auto_release_at && (
                <span className="ml-2 font-normal text-amber-600">
                  (auto-confirms {fmtDate(campaign.auto_release_at)})
                </span>
              )}
            </p>
            {campaign.deliverable_urls?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {campaign.deliverable_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="text-xs underline text-blue-600">
                    Deliverable {i + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {campaign.status === "completed" && (
          <div className="mt-5 pt-5 border-t flex items-center gap-2 text-green-600">
            <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">ok</span>
            <span className="text-sm font-medium">Completed {fmtDate(campaign.brand_confirmed_at)}</span>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="mb-3">
        <h2 className="font-semibold text-sm mb-3">Messages</h2>
        <ChatPanel
          campaignId={campaign.id}
          myType="superstar"
          otherName={campaign.company_name}
          campaign={{
            campaign_name: campaign.campaign_name,
            status: campaign.status,
            brief_text: campaign.brief_text,
            deliverables: campaign.deliverables,
            remuneration_type: campaign.remuneration_type,
            amount_sgd: campaign.amount_sgd,
            shoot_date: campaign.shoot_date,
            company_name: campaign.company_name,
          } as CampaignMeta}
        />
      </div>

      {testimonialCampaign && (
        <TestimonialPromptDialog
          inquiryId={testimonialCampaign.inquiryId}
          campaignName={testimonialCampaign.name}
          onClose={() => setTestimonialCampaign(null)}
        />
      )}

      {/* Deliver dialog */}
      <Dialog open={showDeliver} onOpenChange={() => setShowDeliver(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark as delivered</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Share your deliverable links and a message to the brand.
            </p>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Links <span className="text-muted-foreground">(one per line)</span></label>
              <Textarea value={deliverUrls} onChange={e => setDeliverUrls(e.target.value)}
                placeholder={"https://instagram.com/p/...\nhttps://drive.google.com/..."}
                className="resize-none min-h-[80px] font-mono text-xs" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Message to brand <span className="text-muted-foreground">(optional)</span></label>
              <Textarea value={deliverNote} onChange={e => setDeliverNote(e.target.value)}
                placeholder="e.g. Posted on Tuesday as agreed!"
                className="resize-none min-h-[70px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliver(false)}>Cancel</Button>
            <Button onClick={handleDeliver} disabled={delivering}
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">
              {delivering ? "Submitting..." : "Submit delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
