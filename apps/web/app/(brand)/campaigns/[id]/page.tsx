"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { api, type BrandProject, type Campaign, type Inquiry } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatPanel, type CampaignMeta } from "@/components/chat/ChatPanel";
import { TestimonialPromptDialog, hasGivenTestimonial } from "@/components/TestimonialPromptDialog";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = ["Lifestyle", "Beauty", "Skincare", "Fashion", "Wellness", "Food", "Fitness"];
const LANGUAGES = ["English", "Mandarin", "Malay", "Tamil"];
const GENDERS = ["Female", "Male", "Non-binary", "Any"];
const VIBE_TAGS = ["Clean", "Bold", "Minimalist", "Warm", "Edgy", "Natural", "Playful", "Luxury", "Street", "Soft"];
const FOLLOWER_OPTIONS = [
  { label: "No minimum", value: "" },
  { label: "1K+", value: "1000" },
  { label: "5K+", value: "5000" },
  { label: "10K+", value: "10000" },
  { label: "50K+", value: "50000" },
  { label: "100K+", value: "100000" },
];

function MultiToggle({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  }
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button key={o} type="button" onClick={() => toggle(o)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border font-medium transition-all",
              selected.includes(o)
                ? "bg-[#0C0C0C] text-white border-[#0C0C0C]"
                : "border-[#E0DDD9] text-[#6A6A6A] hover:border-[#0C0C0C] hover:text-[#1A1A1A]",
            )}
          >{o}</button>
        ))}
      </div>
    </div>
  );
}

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

type ProjectWithHires = BrandProject & { hires: Campaign[]; applications: Inquiry[] };

export default function BrandProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithHires | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"hires" | "history" | "applications">("hires");
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [respondingApp, setRespondingApp] = useState<string | null>(null);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [showEditCriteria, setShowEditCriteria] = useState(false);
  const [testimonialCampaign, setTestimonialCampaign] = useState<{ inquiryId: string; name: string } | null>(null);

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
      const token = getSessionToken() || "";
      const updated = await api.confirmDelivery(campaignId, token);
      setProject(prev => prev ? {
        ...prev,
        hires: prev.hires.map(h => h.id === campaignId ? { ...h, ...updated } : h),
      } : prev);
      // Prompt for testimonial after 3rd completed campaign
      if (!hasGivenTestimonial()) {
        const { count } = await api.getCompletedCount(token).catch(() => ({ count: 0 }));
        if (count >= 3 && updated.inquiry_id) {
          setTestimonialCampaign({ inquiryId: updated.inquiry_id, name: updated.campaign_name });
        }
      }
    } catch { /* ignore */ }
    setConfirming(null);
  }

  async function handleRespondApp(inquiryId: string, action: "accept" | "decline") {
    setRespondingApp(inquiryId);
    try {
      const token = getSessionToken() || "";
      await api.respondToInquiry(inquiryId, action, token);
      // Refresh project to get updated hires/applications
      const updated = await api.getProject(id, token);
      setProject(updated as ProjectWithHires);
    } catch { /* ignore */ }
    setRespondingApp(null);
  }

  async function handleToggleOpen() {
    if (!project) return;
    setTogglingOpen(true);
    try {
      const token = getSessionToken() || "";
      await api.toggleProjectOpen(project.id, token);
      setProject(prev => prev ? { ...prev, is_open: !prev.is_open } : prev);
    } catch { /* ignore */ }
    setTogglingOpen(false);
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleOpen}
              disabled={togglingOpen}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                project.is_open
                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  : "border-[#E0DDD9] text-[#6A6A6A] hover:border-[#0C0C0C] hover:text-[#1A1A1A]",
              )}
            >
              {project.is_open ? "Open for applications" : "Closed"}
            </button>
            <Link href={`/catalog?campaign=${project.id}`}>
              <Button size="sm" className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">
                + Find Superstars
              </Button>
            </Link>
          </div>
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
        {/* Talent criteria */}
        {(() => {
          const hasCriteria = (project.target_content_types?.length ?? 0) > 0
            || (project.target_languages?.length ?? 0) > 0
            || !!project.target_gender
            || (project.target_vibe_tags?.length ?? 0) > 0
            || !!project.target_min_followers
            || !!project.target_age_min || !!project.target_age_max;
          return (
            <div className="mt-4 pt-4 border-t border-[#F0EDEA]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#1A1A1A]">Talent criteria</p>
                <button
                  onClick={() => setShowEditCriteria(true)}
                  className="text-xs text-[#9A9A9A] hover:text-[#1A1A1A] underline underline-offset-2"
                >
                  {hasCriteria ? "Edit" : "Set criteria"}
                </button>
              </div>
              {hasCriteria ? (
                <div className="flex flex-wrap gap-1.5">
                  {project.target_content_types?.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8EC] text-[#B8860B] border border-[#FFD200]/30 font-medium">{t}</span>
                  ))}
                  {project.target_languages?.map(l => (
                    <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">{l}</span>
                  ))}
                  {project.target_gender && project.target_gender !== "Any" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">{project.target_gender}</span>
                  )}
                  {(project.target_age_min || project.target_age_max) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">
                      Age: {project.target_age_min ?? "any"}-{project.target_age_max ?? "any"}
                    </span>
                  )}
                  {project.target_vibe_tags?.map(v => (
                    <span key={v} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">{v}</span>
                  ))}
                  {project.target_min_followers && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">
                      {Number(project.target_min_followers) >= 1000
                        ? `${(Number(project.target_min_followers) / 1000).toFixed(0)}K+ followers`
                        : `${project.target_min_followers}+ followers`}
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">AI scoring active</span>
                </div>
              ) : (
                <p className="text-xs text-[#9A9A9A]">
                  No criteria set yet. Set criteria to enable AI-powered talent matching for this campaign.
                </p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-5 bg-white border border-[#F0EDEA] p-1 rounded-xl shadow-sm w-fit">
        <TabBtn active={tab === "hires"} onClick={() => { setTab("hires"); setOpenChat(null); }} count={activeHires.length}>
          Active Hires
        </TabBtn>
        <TabBtn active={tab === "applications"} onClick={() => { setTab("applications"); setOpenChat(null); }} count={(project.applications || []).filter(a => a.status === "pending").length}>
          Applications
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
                          campaign={{
                            campaign_name: hire.campaign_name,
                            status: hire.status,
                            brief_text: hire.brief_text,
                            deliverables: hire.deliverables,
                            remuneration_type: hire.remuneration_type,
                            amount_sgd: hire.amount_sgd,
                            shoot_date: hire.shoot_date,
                            talent_name: hire.talent_name,
                          } as CampaignMeta}
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

      {/* APPLICATIONS TAB */}
      {tab === "applications" && (
        <div>
          {!project.is_open && (project.applications || []).length === 0 && (
            <div className="rounded-2xl bg-white border border-[#F0EDEA] py-12 px-8 text-center shadow-sm">
              <p className="text-sm text-[#9A9A9A] mb-3">This campaign is not open for applications.</p>
              <button
                onClick={handleToggleOpen}
                disabled={togglingOpen}
                className="text-sm text-[#FFD200] font-semibold hover:underline"
              >
                Open it to receive Superstar applications
              </button>
            </div>
          )}
          {(project.applications || []).length > 0 && (
            <div className="space-y-3">
              {(project.applications || []).map(app => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  responding={respondingApp === app.id}
                  onAccept={() => handleRespondApp(app.id, "accept")}
                  onDecline={() => handleRespondApp(app.id, "decline")}
                />
              ))}
            </div>
          )}
          {project.is_open && (project.applications || []).length === 0 && (
            <div className="rounded-2xl bg-white border border-[#F0EDEA] py-12 px-8 text-center shadow-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mx-auto mb-3" />
              <p className="text-sm text-[#9A9A9A]">Open for applications - Superstars can now discover and apply to this campaign.</p>
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

      {testimonialCampaign && (
        <TestimonialPromptDialog
          inquiryId={testimonialCampaign.inquiryId}
          campaignName={testimonialCampaign.name}
          onClose={() => setTestimonialCampaign(null)}
        />
      )}

      {showEditCriteria && project && (
        <EditCriteriaDialog
          project={project}
          onClose={() => setShowEditCriteria(false)}
          onSaved={(updated) => {
            setProject(prev => prev ? { ...prev, ...updated } : prev);
            setShowEditCriteria(false);
          }}
        />
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

function ApplicationCard({ application: app, responding, onAccept, onDecline }: {
  application: Inquiry;
  responding?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  const isPending = app.status === "pending";
  const photo = app.photo_urls?.[0];
  const STATUS: Record<string, string> = {
    pending:   "bg-amber-100 text-amber-700",
    accepted:  "bg-green-100 text-green-700",
    declined:  "bg-[#F5F3F0] text-[#9A9A9A]",
    cancelled: "bg-[#F5F3F0] text-[#9A9A9A]",
  };
  const LABEL: Record<string, string> = {
    pending: "Applied", accepted: "Accepted", declined: "Declined", cancelled: "Withdrawn"
  };

  return (
    <div className={`rounded-2xl bg-white shadow-sm overflow-hidden ${isPending ? "border-2 border-amber-200" : "border border-[#F0EDEA]"}`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0C0C0C] shrink-0 flex items-center justify-center">
            {photo
              ? <img src={photo} alt="" className="w-full h-full object-cover" />
              : <span className="text-[#FFD200] font-bold text-xs">{app.talent_name?.slice(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="font-semibold text-sm text-[#1A1A1A]">{app.talent_name}</span>
              {app.ig_handle && <span className="text-xs text-[#9A9A9A]">@{app.ig_handle}</span>}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS[app.status] || ""}`}>
                {LABEL[app.status] || app.status}
              </span>
            </div>
            {app.brief_text && (
              <p className="text-xs text-[#6A6A6A] leading-relaxed line-clamp-3 mt-1">{app.brief_text}</p>
            )}
          </div>
        </div>
        {isPending && onAccept && onDecline && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full flex-1"
              disabled={responding}
              onClick={onAccept}
            >
              {responding ? "Accepting..." : "Accept"}
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
      </div>
    </div>
  );
}

function EditCriteriaDialog({ project, onClose, onSaved }: {
  project: BrandProject;
  onClose: () => void;
  onSaved: (updated: Partial<BrandProject>) => void;
}) {
  const [criteria, setCriteria] = useState({
    target_content_types: project.target_content_types ?? [],
    target_languages: project.target_languages ?? [],
    target_gender: project.target_gender ?? "",
    target_age_min: project.target_age_min ? String(project.target_age_min) : "",
    target_age_max: project.target_age_max ? String(project.target_age_max) : "",
    target_vibe_tags: project.target_vibe_tags ?? [],
    target_min_followers: project.target_min_followers ? String(project.target_min_followers) : "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true); setError("");
    try {
      const token = getSessionToken() || "";
      const payload: Record<string, unknown> = {
        target_content_types: criteria.target_content_types.length ? criteria.target_content_types : [],
        target_languages: criteria.target_languages.length ? criteria.target_languages : [],
        target_gender: (criteria.target_gender && criteria.target_gender !== "Any") ? criteria.target_gender : null,
        target_age_min: criteria.target_age_min ? Number(criteria.target_age_min) : null,
        target_age_max: criteria.target_age_max ? Number(criteria.target_age_max) : null,
        target_vibe_tags: criteria.target_vibe_tags.length ? criteria.target_vibe_tags : [],
        target_min_followers: criteria.target_min_followers ? Number(criteria.target_min_followers) : null,
      };
      const updated = await api.updateProject(project.id, payload, token);
      onSaved(updated);
    } catch (e: any) {
      setError(e.message || "Failed to save criteria");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Talent criteria</DialogTitle>
          <p className="text-xs text-[#9A9A9A] mt-1">
            CASTD uses these to score and rank Superstars specifically for this campaign.
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2">
          <MultiToggle
            label="Content type"
            options={CONTENT_TYPES}
            selected={criteria.target_content_types}
            onChange={v => setCriteria(c => ({ ...c, target_content_types: v }))}
          />
          <MultiToggle
            label="Languages"
            options={LANGUAGES}
            selected={criteria.target_languages}
            onChange={v => setCriteria(c => ({ ...c, target_languages: v }))}
          />
          <div className="grid gap-1.5">
            <Label className="text-sm">Gender preference</Label>
            <div className="flex flex-wrap gap-2">
              {GENDERS.map(g => (
                <button key={g} type="button"
                  onClick={() => setCriteria(c => ({ ...c, target_gender: c.target_gender === g ? "" : g }))}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full border font-medium transition-all",
                    criteria.target_gender === g
                      ? "bg-[#0C0C0C] text-white border-[#0C0C0C]"
                      : "border-[#E0DDD9] text-[#6A6A6A] hover:border-[#0C0C0C] hover:text-[#1A1A1A]",
                  )}
                >{g}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label className="text-sm">Age min</Label>
              <Input type="number" placeholder="e.g. 18" value={criteria.target_age_min}
                onChange={e => setCriteria(c => ({ ...c, target_age_min: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label className="text-sm">Age max</Label>
              <Input type="number" placeholder="e.g. 35" value={criteria.target_age_max}
                onChange={e => setCriteria(c => ({ ...c, target_age_max: e.target.value }))} />
            </div>
          </div>
          <MultiToggle
            label="Vibe / aesthetic"
            options={VIBE_TAGS}
            selected={criteria.target_vibe_tags}
            onChange={v => setCriteria(c => ({ ...c, target_vibe_tags: v }))}
          />
          <div className="grid gap-1.5">
            <Label className="text-sm">Minimum IG followers</Label>
            <Select value={criteria.target_min_followers}
              onValueChange={v => setCriteria(c => ({ ...c, target_min_followers: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="No minimum" /></SelectTrigger>
              <SelectContent>
                {FOLLOWER_OPTIONS.map(o => (
                  <SelectItem key={o.label} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading} className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">
            {loading ? "Saving..." : "Save criteria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
