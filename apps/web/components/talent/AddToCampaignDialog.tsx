"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type Talent, type BrandProject } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Remuneration options
type RemuType = "product" | "cash" | "cash_hourly";

const REMU: { value: RemuType; label: string; desc: string }[] = [
  { value: "product",      label: "Product / Gifting", desc: "Send product or service as compensation" },
  { value: "cash",         label: "One-off Fee",        desc: "Fixed payment for the project"           },
  { value: "cash_hourly",  label: "Hourly Rate",        desc: "Pay per hour of shoot / creation time"   },
];

interface Props { talent: Talent; onClose: () => void; }

export function AddToCampaignDialog({ talent, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 - campaign selection
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("none");
  const [newName, setNewName] = useState("");

  // Step 2 - offer details
  const [remuType, setRemuType] = useState<RemuType>("product");
  const [productDesc, setProductDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [brief, setBrief] = useState("");
  const [dates, setDates] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getSessionToken();
    if (!token) { setLoadingProjects(false); return; }
    api.getBrandProjects(token)
      .then(p => { setProjects(p.filter(x => x.status === "active")); })
      .catch(() => null)
      .finally(() => setLoadingProjects(false));
  }, []);

  // Pre-fill brief/dates from selected project
  useEffect(() => {
    if (selectedId === "none" || selectedId === "new") return;
    const p = projects.find(x => x.id === selectedId);
    if (!p) return;
    if (p.brief_text) setBrief(prev => prev || p.brief_text || "");
    if (p.shoot_date) setDates(prev => prev || p.shoot_date || "");
    if (p.deliverables) setDeliverables(prev => prev || p.deliverables || "");
  }, [selectedId, projects]);

  function canProceed() {
    if (selectedId === "none") return false;
    if (selectedId === "new" && !newName.trim()) return false;
    return true;
  }

  async function submit() {
    setError("");
    if (remuType === "product" && !productDesc.trim()) {
      setError("Please describe the product or service you are offering"); return;
    }
    if ((remuType === "cash" || remuType === "cash_hourly") && !amount.trim()) {
      setError("Please enter an amount"); return;
    }
    setSubmitting(true);
    try {
      const token = getSessionToken() || "";
      let projectId: string | undefined;

      if (selectedId === "new" && newName.trim()) {
        const proj = await api.createProject({ name: newName.trim() }, token);
        projectId = proj.id;
      } else if (selectedId !== "none" && selectedId !== "new") {
        projectId = selectedId;
      }

      const proj = projects.find(p => p.id === projectId);
      const campaignName = proj?.name || newName.trim() || `${talent.name} - Campaign`;

      const budgetRange = remuType === "cash"
        ? `SGD ${amount} (one-off)`
        : remuType === "cash_hourly"
          ? `SGD ${amount}/hr`
          : undefined;

      await api.createInquiry({
        talent_id: talent.id,
        campaign_name: campaignName,
        remuneration_type: remuType,
        product_description: remuType === "product" ? productDesc : undefined,
        budget_range: budgetRange || undefined,
        // Prepend deliverables to brief so it flows into campaign
        brief_text: [deliverables ? `Deliverables: ${deliverables}` : "", brief]
          .filter(Boolean).join("\n\n") || undefined,
        preferred_dates: dates || undefined,
        project_id: projectId,
      }, token);

      onClose();
      if (projectId) {
        router.push(`/campaigns/${projectId}`);
      } else {
        router.push("/inquiries");
      }
    } catch (e: any) {
      setError(e.message || "Failed to send offer");
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? `Add ${talent.name} to campaign` : "Set your offer"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1 - Campaign picker */}
        {step === 1 && (
          <div className="flex flex-col gap-4 py-2">
            {loadingProjects ? (
              <p className="text-sm text-muted-foreground">Loading campaigns...</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Which campaign is this hire for?
                </p>

                {/* No-campaign option */}
                <CampaignOption
                  active={selectedId === "none"}
                  title="No campaign"
                  desc="Submit as a standalone inquiry"
                  onClick={() => setSelectedId("none")}
                />

                {/* Existing campaigns */}
                {projects.map(p => (
                  <CampaignOption
                    key={p.id}
                    active={selectedId === p.id}
                    title={p.name}
                    desc={[p.campaign_type, p.shoot_date].filter(Boolean).join(" - ") || "Active campaign"}
                    onClick={() => setSelectedId(p.id)}
                  />
                ))}

                {/* Create new */}
                <CampaignOption
                  active={selectedId === "new"}
                  title="+ Start a new campaign"
                  desc="Create a campaign for this hire"
                  onClick={() => setSelectedId("new")}
                />
                {selectedId === "new" && (
                  <Input
                    autoFocus
                    placeholder="Campaign name (e.g. Summer Glow 2026)"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="mt-1"
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 2 - Offer details */}
        {step === 2 && (
          <div className="flex flex-col gap-4 py-2">
            {/* Compensation type */}
            <div className="grid gap-2">
              <Label>How will you compensate {talent.name}? *</Label>
              <div className="grid gap-2">
                {REMU.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRemuType(r.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                      remuType === r.value
                        ? "border-[#FFD200] bg-[#FFFBEB]"
                        : "border-[#EBEBEB] hover:border-[#FFD200]/40",
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                      remuType === r.value ? "border-[#FFD200] bg-[#FFD200]" : "border-[#CCCCCC]",
                    )}>
                      {remuType === r.value && <span className="w-2 h-2 rounded-full bg-[#0C0C0C] inline-block" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#0C0C0C]">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional amount/desc fields */}
            {remuType === "product" && (
              <div className="grid gap-1">
                <Label>What are you gifting? *</Label>
                <Textarea
                  value={productDesc}
                  onChange={e => setProductDesc(e.target.value)}
                  placeholder="e.g. Full skincare set (worth SGD 120), 3-month supplement supply..."
                  rows={3}
                />
              </div>
            )}
            {remuType === "cash" && (
              <div className="grid gap-1">
                <Label>One-off fee (SGD) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">SGD</span>
                  <Input
                    className="pl-12"
                    type="number"
                    min="0"
                    placeholder="500"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                </div>
              </div>
            )}
            {remuType === "cash_hourly" && (
              <div className="grid gap-1">
                <Label>Hourly rate (SGD/hr) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">SGD</span>
                  <Input
                    className="pl-12 pr-10"
                    type="number"
                    min="0"
                    placeholder="80"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/hr</span>
                </div>
              </div>
            )}

            {/* Deliverables */}
            <div className="grid gap-1">
              <Label>Deliverables</Label>
              <Input
                placeholder="e.g. 2x Reels, 1x TikTok, 3x Stories"
                value={deliverables}
                onChange={e => setDeliverables(e.target.value)}
              />
            </div>

            {/* Brief */}
            <div className="grid gap-1">
              <Label>Campaign brief</Label>
              <Textarea
                placeholder="Tell them about the brand, concept, what you need..."
                value={brief}
                onChange={e => setBrief(e.target.value)}
                rows={3}
              />
            </div>

            {/* Dates */}
            <div className="grid gap-1">
              <Label>Preferred shoot / delivery dates</Label>
              <Input
                placeholder="e.g. July 2026 or W/C 14 Jul"
                value={dates}
                onChange={e => setDates(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Offers are reviewed by the CASTD team before the Superstar is notified. Chat unlocks once confirmed.
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
              disabled={!canProceed()}
              onClick={() => setStep(2)}
            >
              Next: Set offer
            </Button>
          ) : (
            <Button
              className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? "Sending..." : "Send offer"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CampaignOption({ active, title, desc, onClick }: {
  active: boolean; title: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all",
        active ? "border-[#FFD200] bg-[#FFFBEB]" : "border-[#F0EDEA] hover:border-[#FFD200]/40 bg-white",
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors",
        active ? "border-[#FFD200] bg-[#FFD200]" : "border-[#CCCCCC]",
      )} />
      <div className="min-w-0">
        <div className="text-sm font-medium text-[#0C0C0C] truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}
