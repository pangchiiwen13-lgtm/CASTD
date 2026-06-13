"use client";
import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getSessionToken } from "@/lib/get-token";
import { cn } from "@/lib/utils";

const INDUSTRIES = ["Beauty", "Skincare", "Fashion", "Wellness", "Food & Beverage", "Lifestyle", "Tech", "Finance", "Other"];
const CAMPAIGN_TYPES = ["Brand awareness", "Product launch", "Social media content", "Event coverage", "Tutorial", "Testimonial"];
const AESTHETIC_OPTIONS = ["Clean & minimal", "Bold & vibrant", "Soft & feminine", "Natural & earthy", "Luxury", "Playful", "Edgy", "Professional"];

type Role = "brand" | "superstar" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [role, setRole] = useState<Role>(null);
  // 0 = role selection, 1+ = brand steps
  const [step, setStep] = useState(0);

  // If ?role=brand is passed (from signup page), skip role selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("role") === "brand") {
        setRole("brand");
        setStep(1);
      }
    }
  }, []);
  const [form, setForm] = useState({ company_name: "", uen: "", industry: "", campaign_type: "", aesthetic_tags: [] as string[], brand_values: [] as string[] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleTag(list: "aesthetic_tags" | "brand_values", tag: string) {
    setForm(f => ({ ...f, [list]: f[list].includes(tag) ? f[list].filter(t => t !== tag) : [...f[list], tag] }));
  }

  function selectRole(r: Role) {
    setRole(r);
    if (r === "superstar") {
      router.push("/onboarding/superstar");
    } else {
      setStep(1);
    }
  }

  async function finish() {
    if (!form.company_name.trim()) { setError("Company name required"); return; }
    setLoading(true);
    try {
      await api.createBrand(form, getSessionToken() || "");
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        setError(e.message || "Something went wrong");
        setLoading(false);
        return;
      }
    }
    router.push("/catalog");
  }

  const totalBrandSteps = 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-[#FFF8EC]">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <div className="text-2xl font-bold mb-1">CASTD</div>
          {step === 0 ? (
            <p className="text-muted-foreground text-sm">How do you want to use CASTD?</p>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">Tell us about your brand to get AI-matched talent recommendations.</p>
              <div className="flex gap-1 mt-4">
                {Array.from({ length: totalBrandSteps }).map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${step > i ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Step 0 - Role selection */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <RoleCard
              title="I'm a Brand / Agency"
              description="Discover and book on-screen video talent for your campaigns."
              selected={role === "brand"}
              onClick={() => selectRole("brand")}
            />
            <RoleCard
              title="I'm a Superstar"
              description="Showcase your talent and get booked for beauty and lifestyle campaigns."
              selected={role === "superstar"}
              onClick={() => selectRole("superstar")}
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              Already have an account?{" "}
              <button className="underline" onClick={() => router.push("/portal")}>Go to your portal</button>
            </p>
          </div>
        )}

        {/* Step 1 - Brand basics */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Your brand</h2>
            <div className="grid gap-1">
              <Label>Company / brand name *</Label>
              <Input placeholder="e.g. Glow Republic" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div className="grid gap-1">
              <Label>Singapore UEN *</Label>
              <Input
                placeholder="e.g. 202312345A"
                value={form.uen}
                onChange={e => setForm(f => ({ ...f, uen: e.target.value.toUpperCase() }))}
                maxLength={15}
              />
              <p className="text-[11px] text-muted-foreground">
                Your Unique Entity Number from ACRA. Required for all brand accounts.
                We verify this against IRAS - non-GST-registered entities will be manually reviewed.
              </p>
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
            <button className="text-sm text-muted-foreground underline text-center" onClick={() => setStep(0)}>← Back</button>
          </div>
        )}

        {/* Step 2 - Aesthetic */}
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

function RoleCard({ title, description, selected, onClick }: {
  title: string; description: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4",
        selected
          ? "border-[#FFD200] bg-white shadow-md"
          : "border-[#E8E4E0] bg-white hover:border-[#FFD200]/60 hover:shadow-sm",
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
        selected ? "bg-[#FFD200]" : "bg-[#F5F3F0]",
      )}>
        <span className={cn("w-4 h-4 rounded-full inline-block", selected ? "bg-[#0C0C0C]" : "bg-[#CCCCCC]")} />
      </div>
      <div>
        <div className="font-semibold text-[15px] text-[#1A1A1A]">{title}</div>
        <div className="text-sm text-[#9A9A9A] mt-0.5">{description}</div>
      </div>
    </button>
  );
}
