"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, type Talent, type BrandProject } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CAMPAIGN_TYPES = ["Brand video", "Social media ad", "Product launch", "Event coverage", "Tutorial / How-to", "Testimonial", "Other"];
const BUDGETS = ["< SGD 500", "SGD 500 - 1,000", "SGD 1,000 - 3,000", "SGD 3,000 - 5,000", "> SGD 5,000"];

type RemunerationType = "product" | "cash";

interface Props { talent: Talent; onClose: () => void; }

export function InquiryDialog({ talent, onClose }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("new");
  const [form, setForm] = useState({
    campaign_name: "",
    campaign_type: "",
    brief_text: "",
    budget_range: "",
    preferred_dates: "",
    remuneration_type: "product" as RemunerationType,
    product_description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the brand's existing campaigns for the picker
  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    api.getBrandProjects(token)
      .then(p => setProjects(p.filter(proj => proj.status === "active")))
      .catch(() => null);
  }, []);

  // When a project is selected, pre-fill campaign name + type from it
  useEffect(() => {
    if (selectedProjectId === "new") return;
    const p = projects.find(x => x.id === selectedProjectId);
    if (!p) return;
    setForm(f => ({
      ...f,
      campaign_name: p.name,
      campaign_type: p.campaign_type || f.campaign_type,
      brief_text: f.brief_text || p.brief_text || "",
      preferred_dates: f.preferred_dates || p.shoot_date || "",
      budget_range: f.budget_range || p.budget_range || "",
    }));
  }, [selectedProjectId, projects]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.campaign_name.trim()) { setError("Campaign name is required"); return; }
    if (form.remuneration_type === "product" && !form.product_description.trim()) {
      setError("Please describe the product or service you are offering"); return;
    }
    setLoading(true); setError("");
    try {
      const token = getSessionToken() || "";
      await api.createInquiry({
        talent_id: talent.id,
        ...form,
        project_id: selectedProjectId !== "new" ? selectedProjectId : undefined,
      }, token);
      onClose();
      router.push("/inquiries");
    } catch (e: any) {
      setError(e.message || "Failed to submit inquiry");
    } finally { setLoading(false); }
  }

  const isCash = form.remuneration_type === "cash";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Hire: {talent.name}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 py-2">

          {/* Campaign picker */}
          {projects.length > 0 && (
            <div className="grid gap-2">
              <Label>Link to campaign</Label>
              <Select value={selectedProjectId} onValueChange={v => v && setSelectedProjectId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">One-off inquiry (no campaign)</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProjectId !== "new" && (
                <p className="text-xs text-[#9A9A9A]">This hire will be tracked under the selected campaign.</p>
              )}
            </div>
          )}

          {/* Remuneration type */}
          <div className="grid gap-2">
            <Label>How will you compensate this Superstar? *</Label>
            <div className="grid grid-cols-2 gap-2">
              <RemunerationCard
                active={!isCash}
                title="Product / Service"
                desc="Gifting, barter, collab"
                onClick={() => setForm(f => ({ ...f, remuneration_type: "product" }))}
              />
              <RemunerationCard
                active={isCash}
                title="Cash Budget"
                desc="Paid engagement"
                onClick={() => setForm(f => ({ ...f, remuneration_type: "cash" }))}
              />
            </div>
          </div>

          {/* Conditional remuneration fields */}
          {!isCash ? (
            <div className="grid gap-1">
              <Label>What are you offering? *</Label>
              <Textarea
                value={form.product_description}
                onChange={set("product_description")}
                placeholder="e.g. Full-size skincare set (worth SGD 120), 1-year supply of supplements..."
                rows={3}
              />
            </div>
          ) : (
            <div className="grid gap-1">
              <Label>Budget range *</Label>
              <Select value={form.budget_range} onValueChange={v => v && setForm(f => ({ ...f, budget_range: v }))}>
                <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                <SelectContent>{BUDGETS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-1">
            <Label>Campaign name *</Label>
            <Input placeholder="e.g. Summer Glow Campaign 2025" value={form.campaign_name} onChange={set("campaign_name")} />
          </div>

          <div className="grid gap-1">
            <Label>Campaign type</Label>
            <Select value={form.campaign_type} onValueChange={v => v && setForm(f => ({ ...f, campaign_type: v }))}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="grid gap-1">
            <Label>Campaign brief</Label>
            <Textarea
              placeholder="Tell the talent about the brand, concept, and what you need..."
              value={form.brief_text}
              onChange={set("brief_text")}
              rows={4}
            />
          </div>

          <div className="grid gap-1">
            <Label>Preferred dates</Label>
            <Input placeholder="e.g. July 2025" value={form.preferred_dates} onChange={set("preferred_dates")} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Submitting an inquiry is free. A Northstar team member will review and confirm the booking.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Sending..." : "Send inquiry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemunerationCard({ active, title, desc, onClick }: {
  active: boolean; title: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all",
        active
          ? "border-[#FFD200] bg-[#FFFBEB]"
          : "border-[#EBEBEB] hover:border-[#FFD200]/50",
      )}
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center mb-0.5 transition-colors",
        active ? "bg-[#FFD200]" : "bg-[#F5F3F0]",
      )}>
        <span className={cn("w-2.5 h-2.5 rounded-full inline-block", active ? "bg-[#0C0C0C]" : "bg-[#CCCCCC]")} />
      </div>
      <div>
        <div className="text-xs font-semibold text-[#0C0C0C]">{title}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </button>
  );
}
