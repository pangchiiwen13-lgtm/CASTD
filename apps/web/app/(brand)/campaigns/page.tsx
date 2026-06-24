"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type BrandProject } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CAMPAIGN_TYPES = ["Brand video", "Social media ad", "Product launch", "Event coverage", "Tutorial / How-to", "Testimonial", "Other"];
const BUDGETS = ["< SGD 500", "SGD 500 - 1,000", "SGD 1,000 - 3,000", "SGD 3,000 - 5,000", "> SGD 5,000"];
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

function fmtDate(s?: string) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function MultiToggle({ label, options, selected, onChange }: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(v: string) {
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  }
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => toggle(o)}
            className={cn(
              "text-xs px-3 py-1 rounded-full border font-medium transition-all",
              selected.includes(o)
                ? "bg-[#0C0C0C] text-white border-[#0C0C0C]"
                : "border-[#E0DDD9] text-[#6A6A6A] hover:border-[#0C0C0C] hover:text-[#1A1A1A]",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BrandCampaignsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) {
      const token = getSessionToken() || "";
      api.getBrandProjects(token)
        .then(setProjects)
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [session, isPending]);

  function onProjectCreated(p: BrandProject) {
    setProjects(prev => [p, ...prev]);
    setShowCreate(false);
    router.push(`/campaigns/${p.id}`);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Campaigns</h1>
          <p className="text-sm text-[#9A9A9A] mt-1">Create a campaign, define your talent criteria, then hire Superstars.</p>
        </div>
        <Button
          className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full font-semibold"
          onClick={() => setShowCreate(true)}
        >
          + New campaign
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F0EDEA] py-16 px-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F3F0] mx-auto mb-4 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-[#CCCCCC]" />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-[#1A1A1A]">No campaigns yet</h2>
          <p className="text-[#9A9A9A] text-sm max-w-sm mx-auto mb-6">
            Create your first campaign to start hiring Superstars for your video projects.
          </p>
          <Button
            className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full"
            onClick={() => setShowCreate(true)}
          >
            Create campaign
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}

      {showCreate && (
        <CreateCampaignDialog
          onClose={() => setShowCreate(false)}
          onCreated={onProjectCreated}
        />
      )}
    </div>
  );
}

function ProjectCard({ project: p }: { project: BrandProject }) {
  const activeCount = Number(p.active_hires ?? 0);
  const doneCount = Number(p.done_hires ?? 0);
  const hasCriteria = (p.target_content_types?.length ?? 0) > 0
    || (p.target_languages?.length ?? 0) > 0
    || !!p.target_gender;

  return (
    <Link href={`/campaigns/${p.id}`}>
      <div className="rounded-2xl bg-white border border-[#F0EDEA] px-5 py-5 hover:shadow-md transition-shadow shadow-sm cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-[#1A1A1A]">{p.name}</h3>
              {p.campaign_type && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">
                  {p.campaign_type}
                </span>
              )}
              {hasCriteria && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF8EC] text-[#B8860B] font-medium border border-[#FFD200]/30">
                  AI matching on
                </span>
              )}
            </div>
            <p className="text-xs text-[#9A9A9A]">
              Created {fmtDate(p.created_at)}
              {p.shoot_date && <span> - Shoot: {p.shoot_date}</span>}
            </p>
            {p.brief_text && (
              <p className="text-xs text-[#9A9A9A] mt-1.5 line-clamp-2">{p.brief_text}</p>
            )}
            {hasCriteria && (
              <div className="flex flex-wrap gap-1 mt-2">
                {p.target_content_types?.slice(0, 3).map(t => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A]">{t}</span>
                ))}
                {p.target_gender && p.target_gender !== "Any" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A]">{p.target_gender}</span>
                )}
                {p.target_languages?.slice(0, 2).map(l => (
                  <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A]">{l}</span>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 flex flex-col items-end gap-1.5">
            {activeCount === 0 && doneCount === 0 ? (
              <span className="text-xs text-[#CCCCCC] italic">No hires yet</span>
            ) : (
              <>
                {activeCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {activeCount} active
                  </span>
                )}
                {doneCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">
                    {doneCount} completed
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function CreateCampaignDialog({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (p: BrandProject) => void;
}) {
  const [step, setStep] = useState<"brief" | "criteria">("brief");
  const [form, setForm] = useState({
    name: "",
    campaign_type: "",
    brief_text: "",
    deliverables: "",
    shoot_date: "",
    budget_range: "",
  });
  const [criteria, setCriteria] = useState({
    target_content_types: [] as string[],
    target_languages: [] as string[],
    target_gender: "",
    target_age_min: "",
    target_age_max: "",
    target_vibe_tags: [] as string[],
    target_min_followers: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim()) { setError("Campaign name is required"); return; }
    setLoading(true); setError("");
    try {
      const token = getSessionToken() || "";
      const payload: Record<string, unknown> = {
        name: form.name,
        campaign_type: form.campaign_type || undefined,
        brief_text: form.brief_text || undefined,
        deliverables: form.deliverables || undefined,
        shoot_date: form.shoot_date || undefined,
        budget_range: form.budget_range || undefined,
        target_content_types: criteria.target_content_types.length ? criteria.target_content_types : undefined,
        target_languages: criteria.target_languages.length ? criteria.target_languages : undefined,
        target_gender: (criteria.target_gender && criteria.target_gender !== "Any") ? criteria.target_gender : undefined,
        target_age_min: criteria.target_age_min ? Number(criteria.target_age_min) : undefined,
        target_age_max: criteria.target_age_max ? Number(criteria.target_age_max) : undefined,
        target_vibe_tags: criteria.target_vibe_tags.length ? criteria.target_vibe_tags : undefined,
        target_min_followers: criteria.target_min_followers ? Number(criteria.target_min_followers) : undefined,
      };
      const created = await api.createProject(payload, token);
      onCreated(created);
    } catch (e: any) {
      setError(e.message || "Failed to create campaign");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Campaign</DialogTitle>
          {/* Step indicator */}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => setStep("brief")}
              className={cn(
                "text-xs px-3 py-1 rounded-full font-medium transition-all",
                step === "brief" ? "bg-[#0C0C0C] text-white" : "text-[#9A9A9A] hover:text-[#1A1A1A]",
              )}
            >
              1. Campaign brief
            </button>
            <button
              type="button"
              onClick={() => { if (form.name.trim()) setStep("criteria"); }}
              className={cn(
                "text-xs px-3 py-1 rounded-full font-medium transition-all",
                step === "criteria" ? "bg-[#0C0C0C] text-white" : "text-[#9A9A9A] hover:text-[#1A1A1A]",
              )}
            >
              2. Talent criteria
            </button>
          </div>
        </DialogHeader>

        {step === "brief" ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-1">
              <Label>Campaign name *</Label>
              <Input placeholder="e.g. Summer Glow 2026" value={form.name} onChange={set("name")} />
            </div>
            <div className="grid gap-1">
              <Label>Campaign type</Label>
              <Select value={form.campaign_type} onValueChange={v => v && setForm(f => ({ ...f, campaign_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Brief</Label>
              <Textarea
                placeholder="Describe the campaign concept, brand, and what you need..."
                value={form.brief_text}
                onChange={set("brief_text")}
                rows={3}
              />
            </div>
            <div className="grid gap-1">
              <Label>Deliverables</Label>
              <Input placeholder="e.g. 2x Reels, 1x TikTok" value={form.deliverables} onChange={set("deliverables")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Shoot date</Label>
                <Input placeholder="e.g. July 2026" value={form.shoot_date} onChange={set("shoot_date")} />
              </div>
              <div className="grid gap-1">
                <Label>Budget</Label>
                <Select value={form.budget_range} onValueChange={v => v && setForm(f => ({ ...f, budget_range: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{BUDGETS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-5 py-2">
            <p className="text-xs text-[#9A9A9A]">
              Tell us who you're looking for. Northstar uses this to score and rank Superstars in your catalog.
            </p>
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
                  <button
                    key={g}
                    type="button"
                    onClick={() => setCriteria(c => ({ ...c, target_gender: c.target_gender === g ? "" : g }))}
                    className={cn(
                      "text-xs px-3 py-1 rounded-full border font-medium transition-all",
                      criteria.target_gender === g
                        ? "bg-[#0C0C0C] text-white border-[#0C0C0C]"
                        : "border-[#E0DDD9] text-[#6A6A6A] hover:border-[#0C0C0C] hover:text-[#1A1A1A]",
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="text-sm">Age min</Label>
                <Input
                  type="number"
                  placeholder="e.g. 18"
                  value={criteria.target_age_min}
                  onChange={e => setCriteria(c => ({ ...c, target_age_min: e.target.value }))}
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-sm">Age max</Label>
                <Input
                  type="number"
                  placeholder="e.g. 35"
                  value={criteria.target_age_max}
                  onChange={e => setCriteria(c => ({ ...c, target_age_max: e.target.value }))}
                />
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
              <Select
                value={criteria.target_min_followers}
                onValueChange={v => setCriteria(c => ({ ...c, target_min_followers: v ?? "" }))}
              >
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
        )}

        <DialogFooter>
          {step === "brief" ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => {
                  if (!form.name.trim()) { setError("Campaign name is required"); return; }
                  setError("");
                  setStep("criteria");
                }}
                className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
              >
                Next: Talent criteria
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("brief")}>Back</Button>
              <Button
                onClick={submit}
                disabled={loading}
                className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
              >
                {loading ? "Creating..." : "Create campaign"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
