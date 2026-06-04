"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, type Talent } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const CAMPAIGN_TYPES = ["Brand video", "Social media ad", "Product launch", "Event coverage", "Tutorial / How-to", "Testimonial", "Other"];
const BUDGETS = ["< SGD 500", "SGD 500–1,000", "SGD 1,000–3,000", "SGD 3,000–5,000", "> SGD 5,000"];

interface Props { talent: Talent; onClose: () => void; }

export function InquiryDialog({ talent, onClose }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({ campaign_name: "", campaign_type: "", brief_text: "", budget_range: "", preferred_dates: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.campaign_name.trim()) { setError("Campaign name is required"); return; }
    setLoading(true); setError("");
    try {
      const token = getSessionToken() || "";
      await api.createInquiry({ talent_id: talent.id, ...form }, token);
      onClose();
      router.push("/inquiries");
    } catch (e: any) {
      setError(e.message || "Failed to submit inquiry");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Inquiry: {talent.name}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="grid gap-1">
            <Label>Campaign name *</Label>
            <Input placeholder="e.g. Summer Glow Campaign 2025" value={form.campaign_name} onChange={set("campaign_name")} />
          </div>
          <div className="grid gap-1">
            <Label>Campaign type</Label>
            <Select value={form.campaign_type} onValueChange={v => setForm(f => ({ ...f, campaign_type: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Campaign brief</Label>
            <Textarea placeholder="Tell the talent about the brand, concept, and what you need..." value={form.brief_text} onChange={set("brief_text")} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Budget range</Label>
              <Select value={form.budget_range} onValueChange={v => setForm(f => ({ ...f, budget_range: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{BUDGETS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Preferred dates</Label>
              <Input placeholder="e.g. July 2025" value={form.preferred_dates} onChange={set("preferred_dates")} />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">Submitting an inquiry is free. You only pay when you confirm a talent for your project.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>{loading ? "Sending..." : "Send inquiry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
