"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Campaign } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "In progress",  color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Delivered - awaiting brand",  color: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed",    color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled",    color: "bg-gray-100 text-gray-500" },
};

function fmtDate(s?: string) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export default function SuperstarCampaignsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverTarget, setDeliverTarget] = useState<Campaign | null>(null);
  const [deliverNote, setDeliverNote] = useState("");
  const [deliverUrls, setDeliverUrls] = useState("");
  const [delivering, setDelivering] = useState(false);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) {
      const token = getSessionToken() || "";
      api.getSuperstarCampaigns(token).then(setCampaigns).catch(() => null).finally(() => setLoading(false));
    }
  }, [session, isPending]);

  async function handleDeliver() {
    if (!deliverTarget) return;
    setDelivering(true);
    try {
      const urls = deliverUrls.split("\n").map(u => u.trim()).filter(Boolean);
      const updated = await api.markDelivered(
        deliverTarget.id,
        { deliverable_urls: urls, deliverable_note: deliverNote || undefined },
        getSessionToken() || ""
      );
      setCampaigns(list => list.map(c => c.id === deliverTarget.id ? { ...c, ...updated } : c));
      setDeliverTarget(null);
      setDeliverNote("");
      setDeliverUrls("");
    } catch { /* ignore */ }
    setDelivering(false);
  }

  const active    = campaigns.filter(c => c.status === "active");
  const delivered = campaigns.filter(c => c.status === "delivered");
  const done      = campaigns.filter(c => c.status === "completed" || c.status === "cancelled");

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your active and past brand collaborations.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#EBEBEB] py-16 px-8 text-center">
          <p className="text-4xl mb-4">🎬</p>
          <h2 className="text-lg font-semibold mb-2">No campaigns yet</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Campaigns appear here when a brand confirms a booking with you. Make sure your profile is published and looking great!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active - needs delivery */}
          {active.length > 0 && (
            <Section title="Active" count={active.length}>
              {active.map(c => (
                <CampaignCard key={c.id} campaign={c}>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
                      onClick={() => { setDeliverTarget(c); setDeliverNote(""); setDeliverUrls(""); }}
                    >
                      Mark as delivered
                    </Button>
                  </div>
                </CampaignCard>
              ))}
            </Section>
          )}

          {/* Waiting on brand */}
          {delivered.length > 0 && (
            <Section title="Awaiting brand confirmation" count={delivered.length}>
              {delivered.map(c => (
                <CampaignCard key={c.id} campaign={c}>
                  {c.auto_release_at && (
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      Auto-confirms on {fmtDate(c.auto_release_at)}
                    </p>
                  )}
                </CampaignCard>
              ))}
            </Section>
          )}

          {/* Past */}
          {done.length > 0 && (
            <Section title="Past campaigns" count={done.length}>
              {done.map(c => <CampaignCard key={c.id} campaign={c} />)}
            </Section>
          )}
        </div>
      )}

      {/* Deliver dialog */}
      <Dialog open={!!deliverTarget} onOpenChange={() => setDeliverTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as delivered</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              Let the brand know you've completed the work for <strong>{deliverTarget?.campaign_name}</strong>.
            </p>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Deliverable links <span className="text-muted-foreground">(one per line - social posts, Google Drive, etc.)</span></label>
              <Textarea
                value={deliverUrls}
                onChange={e => setDeliverUrls(e.target.value)}
                placeholder={"https://instagram.com/p/...\nhttps://drive.google.com/..."}
                className="resize-none min-h-[80px] font-mono text-xs"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Message to brand <span className="text-muted-foreground">(optional)</span></label>
              <Textarea
                value={deliverNote}
                onChange={e => setDeliverNote(e.target.value)}
                placeholder="e.g. Posted on Tuesday as agreed. Let me know if you need any adjustments!"
                className="resize-none min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverTarget(null)}>Cancel</Button>
            <Button
              onClick={handleDeliver}
              disabled={delivering}
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
            >
              {delivering ? "Submitting..." : "Submit delivery"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-base">{title}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CampaignCard({ campaign: c, children }: { campaign: Campaign; children?: React.ReactNode }) {
  const st = STATUS_LABELS[c.status] || { label: c.status, color: "bg-gray-100 text-gray-600" };

  return (
    <div className="rounded-xl border px-5 py-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#0C0C0C] shrink-0 flex items-center justify-center">
          <span className="text-[#FFD200] font-bold text-xs">{c.company_name?.slice(0,2).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{c.campaign_name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium">{c.company_name}</span>
            {c.industry && <span> · {c.industry}</span>}
            {c.shoot_date && <span> · {c.shoot_date}</span>}
            <span> · Started {new Date(c.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</span>
          </p>
          {c.brief_text && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{c.brief_text}</p>
          )}
          {c.deliverables && (
            <p className="text-xs text-[#0C0C0C] font-medium mt-1">
              Deliverables: {c.deliverables}
            </p>
          )}
        </div>
        <Link
          href={`/superstar/campaigns/${c.id}`}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          {c.status === "completed" ? "View" : "Open chat"}
        </Link>
      </div>
      {children}
    </div>
  );
}
