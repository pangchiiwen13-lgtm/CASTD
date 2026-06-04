"use client";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getSessionToken } from "@/lib/get-token";

const INDUSTRIES = ["Beauty", "Skincare", "Fashion", "Wellness", "Food & Beverage", "Lifestyle", "Tech", "Finance", "Other"];
const CAMPAIGN_TYPES = ["Brand awareness", "Product launch", "Social media content", "Event coverage", "Tutorial", "Testimonial"];
const AESTHETIC_OPTIONS = ["Clean & minimal", "Bold & vibrant", "Soft & feminine", "Natural & earthy", "Luxury", "Playful", "Edgy", "Professional"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ company_name: "", industry: "", campaign_type: "", aesthetic_tags: [] as string[], brand_values: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleTag(list: "aesthetic_tags" | "brand_values", tag: string) {
    setForm(f => ({ ...f, [list]: f[list].includes(tag) ? f[list].filter(t => t !== tag) : [...f[list], tag] }));
  }

  async function finish() {
    if (!form.company_name.trim()) { setError("Company name required"); return; }
    setLoading(true);
    try {
      await api.createBrand(form, getSessionToken() || "");
    } catch (e: any) {
      // 409 = brand already exists — just proceed to catalog
      if (!e.message?.includes("already exists")) {
        setError(e.message || "Something went wrong");
        setLoading(false);
        return;
      }
    }
    router.push("/catalog");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="text-2xl font-bold mb-1">CASTD</div>
          <p className="text-muted-foreground text-sm">Tell us about your brand to get AI-matched talent recommendations.</p>
          <div className="flex gap-1 mt-4">
            {[1,2].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />)}
          </div>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Your brand</h2>
            <div className="grid gap-1">
              <Label>Company / brand name *</Label>
              <Input placeholder="e.g. Glow Republic" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label>Typical campaign type</Label>
              <Select value={form.campaign_type} onValueChange={v => setForm(f => ({ ...f, campaign_type: v ?? "" }))}>
                <SelectTrigger><SelectValue placeholder="What campaigns do you run?" /></SelectTrigger>
                <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={() => { setError(""); setStep(2); }} disabled={!form.company_name.trim()}>Next →</Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Brand aesthetic</h2>
            <div>
              <Label className="mb-2 block">Aesthetic (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {AESTHETIC_OPTIONS.map(tag => (
                  <Badge key={tag} variant={form.aesthetic_tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => toggleTag("aesthetic_tags", tag)}>{tag}</Badge>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={finish} disabled={loading}>{loading ? "Setting up..." : "Go to catalog →"}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
