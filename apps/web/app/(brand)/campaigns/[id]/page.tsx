"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { api, type BrandProject, type Campaign } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel } from "@/components/chat/ChatPanel";
import Link from "next/link";
import { cn } from "@/lib/utils";

const HIRE_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  active:    { label: "In progress",   color: "bg-blue-100 text-blue-800",   dot: "bg-blue-400" },
  delivered: { label: "Awaiting confirmation", color: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  completed: { label: "Completed",     color: "bg-green-100 text-green-800", dot: "bg-green-500" },
  cancelled: { label: "Cancelled",     color: "bg-[#F5F3F0] text-[#9A9A9A]", dot: "bg-[#CCCCCC]" },
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

type ProjectWithHires = BrandProject & { hires: Campaign[] };

export default function BrandProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithHires | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"hires" | "history">("hires");
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session && id) {
      const token = getSessionToken() || "";
      api.getProject(id, token)
        .then(p => setProject(p as ProjectWithHires))
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [session, isPending, id]);

  async function handleConfirm(campaignId: string) {
    setConfirming(campaignId);
    try {
      const updated = await api.confirmDelivery(campaignId, getSessionToken() || "");
      setProject(prev => prev ? {
        ...prev,
        hires: prev.hires.map(h => h.id === campaignId ? { ...h, ...updated } : h),
      } : prev);
    } catch { /* ignore */ }
    setConfirming(null);
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!project) return (
    <div className="max-w-4xl mx-auto px-6 py-10 text-center">
      <p className="text-muted-foreground">Campaign not found.</p>
      <Link href="/campaigns" className="text-sm text-primary hover:underline mt-2 block">Back to Campaigns</Link>
    </div>
  );

  const activeHires = project.hires.filter(h => h.status === "active" || h.status === "delivered");
  const hireHistory = project.hires.filter(h => h.status === "completed" || h.status === "cancelled");

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        &larr; Back to Campaigns
      </Link>

      {/* Campaign header */}
      <div className="rounded-2xl bg-white border border-[#F0EDEA] shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-xl text-[#1A1A1A] mb-1">{project.name}</h1>
            <div className="flex flex-wrap gap-2 text-xs text-[#9A9A9A]">
              {project.campaign_type && <span className="px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A]">{project.campaign_type}</span>}
              {project.shoot_date && <span>Shoot: {project.shoot_date}</span>}
              {project.budget_range && <span>Budget: {project.budget_range}</span>}
            </div>
          </div>
          <Link href="/catalog">
            <Button size="sm" className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] shrink-0">
              + Add Superstar
            </Button>
          </Link>
        </div>
        {(project.brief_text || project.deliverables) && (
          <div className="mt-4 pt-4 border-t border-[#F0EDEA] space-y-2">
            {project.brief_text && (
              <p className="text-xs text-[#6A6A6A] leading-relaxed">
                <span className="font-medium text-[#1A1A1A]">Brief:</span> {project.brief_text}
              </p>
            )}
            {project.deliverables && (
              <p className="text-xs text-[#6A6A6A]">
                <span className="font-medium text-[#1A1A1A]">Deliverables:</span> {project.deliverables}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-white border border-[#F0EDEA] p-1 rounded-xl shadow-sm w-fit">
        <TabBtn active={tab === "hires"} onClick={() => { setTab("hires"); setOpenChat(null); }} count={activeHires.length}>
          Active Hires
        </TabBtn>
        <TabBtn active={tab === "history"} onClick={() => { setTab("history"); setOpenChat(null); }} count={hireHistory.length}>
          Hire History
        </TabBtn>
      </div>

      {/* ACTIVE HIRES TAB */}
      {tab === "hires" && (
        <div>
          {activeHires.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#F0EDEA] py-12 px-8 text-center shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-[#F5F3F0] mx-auto mb-3 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-[#CCCCCC]" />
              </div>
              <p className="text-sm text-[#9A9A9A] mb-4">No active hires yet.</p>
              <Link href="/catalog">
                <Button size="sm" className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full">
                  Browse Superstars
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeHires.map(hire => (
                <div key={hire.id}>
                  <HireCard
                    hire={hire}
                    onConfirm={hire.status === "delivered" ? () => handleConfirm(hire.id) : undefined}
                    confirming={confirming === hire.id}
                    showChat
                    chatOpen={openChat === hire.id}
                    onToggleChat={() => setOpenChat(openChat === hire.id ? null : hire.id)}
                  />
                  {openChat === hire.id && (
                    <div className="mt-2 rounded-2xl bg-white border border-[#F0EDEA] shadow-sm overflow-hidden">
                      <div className="px-5 py-3 border-b border-[#F0EDEA]">
                        <p className="text-xs font-semibold text-[#1A1A1A]">Messages with {hire.talent_name}</p>
                      </div>
                      <div className="p-4">
                        <ChatPanel
                          campaignId={hire.id}
                          myType="brand"
                          otherName={hire.talent_name || "Superstar"}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HIRE HISTORY TAB */}
      {tab === "history" && (
        <div>
          {hireHistory.length === 0 ? (
            <div className="rounded-2xl bg-white border border-[#F0EDEA] py-12 px-8 text-center shadow-sm">
              <p className="text-sm text-[#9A9A9A]">No completed hires yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hireHistory.map(hire => (
                <HistoryCard key={hire.id} hire={hire} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, count, children }: {
  active: boolean; onClick: () => void; count: number; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 text-sm py-2 px-4 rounded-lg font-medium transition-all",
        active ? "bg-[#0C0C0C] text-white shadow-sm" : "text-[#9A9A9A] hover:text-[#1A1A1A]",
      )}
    >
      {children}
      {count > 0 && (
        <span className={cn(
          "text-[10px] min-w-[18px] h-[18px] px-1 rounded-full font-bold flex items-center justify-center",
          active ? "bg-white/20 text-white" : "bg-[#F5F3F0] text-[#9A9A9A]",
        )}>{count}</span>
      )}
    </button>
  );
}

function HireCard({ hire, onConfirm, confirming, showChat, chatOpen, onToggleChat }: {
  hire: Campaign;
  onConfirm?: () => void;
  confirming?: boolean;
  showChat?: boolean;
  chatOpen?: boolean;
  onToggleChat?: () => void;
}) {
  const st = HIRE_STATUS[hire.status] || { label: hire.status, color: "bg-[#F5F3F0] text-[#9A9A9A]", dot: "bg-[#CCCCCC]" };
  const photo = hire.photo_urls?.[0];

  return (
    <div className="rounded-2xl bg-white border border-[#F0EDEA] px-5 py-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-[#0C0C0C] shrink-0 flex items-center justify-center">
          {photo
            ? <img src={photo} alt="" className="w-full h-full object-cover" />
            : <span className="text-[#FFD200] font-bold text-xs">{hire.talent_name?.slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-[#1A1A1A]">{hire.talent_name}</span>
            {hire.ig_handle && <span className="text-xs text-[#9A9A9A]">@{hire.ig_handle}</span>}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
          </div>
          {hire.shoot_date && <p className="text-xs text-[#9A9A9A] mt-0.5">Shoot: {hire.shoot_date}</p>}

          {/* Delivered state */}
          {hire.status === "delivered" && (
            <div className="mt-3 space-y-2">
              {hire.deliverable_note && (
                <p className="text-sm text-[#6A6A6A] italic">"{hire.deliverable_note}"</p>
              )}
              {hire.deliverable_urls?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hire.deliverable_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="text-xs underline text-blue-600 hover:text-blue-800">
                      Deliverable {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {onConfirm && (
                  <Button
                    size="sm"
                    className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full"
                    disabled={confirming}
                    onClick={onConfirm}
                  >
                    {confirming ? "Confirming..." : "Confirm delivery"}
                  </Button>
                )}
                {hire.auto_release_at && <AutoReleaseCountdown dateStr={hire.auto_release_at} />}
              </div>
            </div>
          )}
        </div>

        {showChat && onToggleChat && (
          <button
            onClick={onToggleChat}
            className={cn(
              "shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
              chatOpen
                ? "bg-[#0C0C0C] text-white border-[#0C0C0C]"
                : "border-[#E0DDD9] text-[#6A6A6A] hover:border-[#0C0C0C] hover:text-[#1A1A1A]",
            )}
          >
            {chatOpen ? "Close chat" : "Open chat"}
          </button>
        )}
      </div>
    </div>
  );
}

function HistoryCard({ hire }: { hire: Campaign }) {
  const st = HIRE_STATUS[hire.status] || { label: hire.status, color: "bg-[#F5F3F0] text-[#9A9A9A]", dot: "bg-[#CCCCCC]" };
  const photo = hire.photo_urls?.[0];

  return (
    <div className="rounded-2xl bg-white border border-[#F0EDEA] px-5 py-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#F5F3F0] shrink-0 flex items-center justify-center">
          {photo
            ? <img src={photo} alt="" className="w-full h-full object-cover" />
            : <span className="text-[#9A9A9A] font-bold text-xs">{hire.talent_name?.slice(0, 2).toUpperCase()}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-medium text-sm text-[#1A1A1A]">{hire.talent_name}</span>
            {hire.ig_handle && <span className="text-xs text-[#9A9A9A]">@{hire.ig_handle}</span>}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
          </div>
          <div className="text-xs text-[#9A9A9A] space-y-0.5">
            {hire.shoot_date && <p>Shoot: {hire.shoot_date}</p>}
            {hire.remuneration_type && (
              <p>Remuneration: {hire.remuneration_type === "cash" && hire.amount_sgd
                ? `SGD ${(hire.amount_sgd / 100).toFixed(2)}`
                : hire.remuneration_type === "cash" ? "Cash" : "Product / service"
              }</p>
            )}
            {hire.deliverables && <p>Deliverables: {hire.deliverables}</p>}
            {hire.brand_confirmed_at && (
              <p className="text-green-600 font-medium">Confirmed {fmtDate(hire.brand_confirmed_at)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
