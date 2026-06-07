"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Campaign } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: "In progress",  color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Awaiting your confirmation", color: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed",    color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled",    color: "bg-gray-100 text-gray-500" },
};

function fmtDate(s?: string) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function AutoReleaseCountdown({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.max(0, Math.ceil((d.getTime() - now.getTime()) / 86400000));
  return <span className="text-xs text-amber-600 font-medium">Auto-confirms in {days} day{days !== 1 ? "s" : ""}</span>;
}

export default function BrandCampaignsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) {
      const token = getSessionToken() || "";
      api.getBrandCampaigns(token).then(setCampaigns).catch(() => null).finally(() => setLoading(false));
    }
  }, [session, isPending]);

  async function handleConfirm(id: string) {
    setConfirming(id);
    try {
      const updated = await api.confirmDelivery(id, getSessionToken() || "");
      setCampaigns(list => list.map(c => c.id === id ? { ...c, ...updated } : c));
    } catch { /* ignore */ }
    setConfirming(null);
  }

  const active    = campaigns.filter(c => c.status === "active");
  const delivered = campaigns.filter(c => c.status === "delivered");
  const done      = campaigns.filter(c => c.status === "completed" || c.status === "cancelled");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your active bookings with Superstars.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#EBEBEB] py-16 px-8 text-center">
          <p className="text-4xl mb-4">🎬</p>
          <h2 className="text-lg font-semibold mb-2">No campaigns yet</h2>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Campaigns are created when an inquiry is confirmed. Browse the catalog and submit inquiries to get started.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/catalog"><Button className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">Browse catalog</Button></Link>
            <Link href="/inquiries"><Button variant="outline">View inquiries</Button></Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Needs your action */}
          {delivered.length > 0 && (
            <Section title="Needs your confirmation" count={delivered.length} accent>
              {delivered.map(c => (
                <CampaignCard key={c.id} campaign={c}>
                  <div className="mt-3 flex flex-col gap-2">
                    {c.deliverable_note && (
                      <p className="text-sm text-muted-foreground italic">"{c.deliverable_note}"</p>
                    )}
                    {c.deliverable_urls?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {c.deliverable_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs underline text-blue-600 hover:text-blue-800">
                            Deliverable {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <Button
                        size="sm"
                        className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
                        disabled={confirming === c.id}
                        onClick={() => handleConfirm(c.id)}
                      >
                        {confirming === c.id ? "Confirming..." : "Confirm delivery"}
                      </Button>
                      {c.auto_release_at && <AutoReleaseCountdown dateStr={c.auto_release_at} />}
                    </div>
                  </div>
                </CampaignCard>
              ))}
            </Section>
          )}

          {/* Active */}
          {active.length > 0 && (
            <Section title="In progress" count={active.length}>
              {active.map(c => <CampaignCard key={c.id} campaign={c} />)}
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
    </div>
  );
}

function Section({ title, count, accent, children }: { title: string; count: number; accent?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-semibold text-base">{title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${accent ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{count}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CampaignCard({ campaign: c, children }: { campaign: Campaign; children?: React.ReactNode }) {
  const st = STATUS_LABELS[c.status] || { label: c.status, color: "bg-gray-100 text-gray-600" };
  const photo = c.photo_urls?.[0];

  return (
    <div className="rounded-xl border px-5 py-4 hover:bg-muted/30 transition-colors group relative">
      <div className="flex items-start gap-4">
        {/* Talent photo */}
        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#0C0C0C] shrink-0 flex items-center justify-center">
          {photo
            ? <img src={photo} alt="" className="w-full h-full object-cover" />
            : <span className="text-[#FFD200] font-bold text-sm">{c.talent_name?.slice(0,2).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{c.campaign_name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            with <span className="font-medium">{c.talent_name}</span>
            {c.ig_handle && <span> @{c.ig_handle}</span>}
            {c.shoot_date && <span> · {c.shoot_date}</span>}
            <span> · Started {fmtDate(c.created_at)}</span>
          </p>
          {c.brief_text && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{c.brief_text}</p>
          )}
        </div>
        <Link
          href={`/campaigns/${c.id}`}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
        >
          {c.status === "completed" ? "View" : "Open chat"}
        </Link>
      </div>
      {children}
    </div>
  );
}
