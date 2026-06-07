"use client";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getSessionToken } from "@/lib/get-token";

const LANGUAGES = ["English", "Mandarin", "Malay", "Tamil", "Cantonese", "Korean", "Japanese", "Other"];
const CONTENT_TYPES = ["UGC / Unboxing", "Product Demo", "Lifestyle & Vlog", "Beauty Tutorial", "Skincare Routine", "GRWM", "Brand Story", "Testimonial", "Food & Beverage", "Fashion & OOTD", "Fitness & Wellness"];
const VIBE_TAGS = ["Clean & Minimal", "Bold & Vibrant", "Soft & Feminine", "Natural & Earthy", "Luxury", "Playful & Fun", "Edgy & Alternative", "Professional", "Relatable & Candid", "Aesthetic & Curated"];
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const REMUNERATION_OPTIONS = [
  { value: "cash", label: "Cash only" },
  { value: "product", label: "Product / service exchange" },
  { value: "both", label: "Open to both" },
];

type Form = {
  name: string;
  age: string;
  gender: string;
  languages: string[];
  content_types: string[];
  vibe_tags: string[];
  ig_handle: string;
  ig_followers: string;
  tiktok_handle: string;
  tiktok_followers: string;
  bio: string;
  experience_summary: string;
  rate_card_text: string;
  photo_urls: string;
  intro_video_url: string;
  remuneration_preference: string;
  min_rate_sgd: string;
};

const TOTAL_STEPS = 5;

export default function SuperstarOnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Form>({
    name: session?.user?.name || "",
    age: "",
    gender: "",
    languages: [],
    content_types: [],
    vibe_tags: [],
    ig_handle: "",
    ig_followers: "",
    tiktok_handle: "",
    tiktok_followers: "",
    bio: "",
    experience_summary: "",
    rate_card_text: "",
    photo_urls: "",
    intro_video_url: "",
    remuneration_preference: "both",
    min_rate_sgd: "",
  });

  function set(key: keyof Form, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleMulti(key: "languages" | "content_types" | "vibe_tags", val: string) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  }

  function next() { setError(""); setStep(s => s + 1); }
  function back() { setError(""); setStep(s => s - 1); }

  async function submit() {
    setLoading(true);
    setError("");
    // Pull token from session object directly - this page has no portal layout
    // so the localStorage cache may not be populated yet. Better Auth exposes the
    // raw session token via session.session.token.
    const token = (session as any)?.session?.token || getSessionToken() || "";
    if (!token) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      return;
    }
    try {
      await api.registerSuperstar({
        name: form.name,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        languages: form.languages,
        content_types: form.content_types,
        vibe_tags: form.vibe_tags,
        ig_handle: form.ig_handle || undefined,
        ig_followers: parseInt(form.ig_followers || "0"),
        tiktok_handle: form.tiktok_handle || undefined,
        tiktok_followers: parseInt(form.tiktok_followers || "0"),
        bio: form.bio || undefined,
        experience_summary: form.experience_summary || undefined,
        rate_card_text: form.rate_card_text || undefined,
        photo_urls: form.photo_urls ? form.photo_urls.split("\n").map(u => u.trim()).filter(Boolean) : [],
        intro_video_url: form.intro_video_url || undefined,
        remuneration_preference: form.remuneration_preference,
        min_rate_sgd: form.min_rate_sgd ? parseInt(form.min_rate_sgd) : undefined,
        email: session?.user?.email || undefined,
      }, token);
      router.push("/superstar/dashboard");
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="text-2xl font-bold mb-1">CASTD</div>
          <p className="text-muted-foreground text-sm">Set up your Superstar profile. Brands will use this to discover and book you.</p>
          <div className="flex gap-1 mt-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step > i ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Step {step} of {TOTAL_STEPS}</p>
        </div>

        {/* Step 1 - About you */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">About you</h2>
            <div className="grid gap-1">
              <Label>Full name *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label>Age</Label>
                <Input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 24" min={16} max={60} />
              </div>
              <div className="grid gap-1">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={v => v && set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Languages spoken</Label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <Badge key={l} variant={form.languages.includes(l) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => toggleMulti("languages", l)}>{l}</Badge>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={() => { if (!form.name.trim()) { setError("Name required"); return; } next(); }}
              disabled={!form.name.trim()}>Next →</Button>
          </div>
        )}

        {/* Step 2 - Content & Vibe */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Content & vibe</h2>
            <div className="grid gap-2">
              <Label>Content types you create <span className="text-muted-foreground text-xs">(select all that apply)</span></Label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map(c => (
                  <Badge key={c} variant={form.content_types.includes(c) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => toggleMulti("content_types", c)}>{c}</Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Your vibe <span className="text-muted-foreground text-xs">(select up to 3)</span></Label>
              <div className="flex flex-wrap gap-2">
                {VIBE_TAGS.map(v => (
                  <Badge key={v}
                    variant={form.vibe_tags.includes(v) ? "default" : "outline"}
                    className={`cursor-pointer ${!form.vibe_tags.includes(v) && form.vibe_tags.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}
                    onClick={() => {
                      if (!form.vibe_tags.includes(v) && form.vibe_tags.length >= 3) return;
                      toggleMulti("vibe_tags", v);
                    }}>{v}</Badge>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button className="flex-1" onClick={next}>Next →</Button>
            </div>
          </div>
        )}

        {/* Step 3 - Social media */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Social media</h2>
            <p className="text-sm text-muted-foreground">Enter your main social handles. These help brands evaluate your reach.</p>
            <div className="grid gap-4">
              <div className="grid gap-1">
                <Label>Instagram handle</Label>
                <Input value={form.ig_handle} onChange={e => set("ig_handle", e.target.value)} placeholder="@yourhandle" />
              </div>
              <div className="grid gap-1">
                <Label>Instagram followers</Label>
                <Input type="number" value={form.ig_followers} onChange={e => set("ig_followers", e.target.value)} placeholder="e.g. 12000" />
              </div>
              <div className="grid gap-1">
                <Label>TikTok handle <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input value={form.tiktok_handle} onChange={e => set("tiktok_handle", e.target.value)} placeholder="@yourhandle" />
              </div>
              <div className="grid gap-1">
                <Label>TikTok followers</Label>
                <Input type="number" value={form.tiktok_followers} onChange={e => set("tiktok_followers", e.target.value)} placeholder="e.g. 5000" />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button className="flex-1" onClick={next}>Next →</Button>
            </div>
          </div>
        )}

        {/* Step 4 - Bio & Experience */}
        {step === 4 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Bio & experience</h2>
            <div className="grid gap-1">
              <Label>Your bio <span className="text-muted-foreground text-xs">(shown to brands)</span></Label>
              <Textarea
                value={form.bio}
                onChange={e => set("bio", e.target.value)}
                placeholder="Tell brands who you are, your style, and what makes you stand out…"
                className="resize-none min-h-[100px]"
              />
            </div>
            <div className="grid gap-1">
              <Label>Previous experience <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={form.experience_summary}
                onChange={e => set("experience_summary", e.target.value)}
                placeholder="Brands you've worked with, campaigns you've done, notable projects…"
                className="resize-none min-h-[80px]"
              />
            </div>
            <div className="grid gap-1">
              <Label>Portfolio photo URLs <span className="text-muted-foreground text-xs">(one per line, optional - add later in profile)</span></Label>
              <Textarea
                value={form.photo_urls}
                onChange={e => set("photo_urls", e.target.value)}
                placeholder={"https://...\nhttps://..."}
                className="resize-none min-h-[80px] font-mono text-xs"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button className="flex-1" onClick={next}>Next →</Button>
            </div>
          </div>
        )}

        {/* Step 5 - Rates & Preferences */}
        {step === 5 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-semibold">Rates & preferences</h2>
            <div className="grid gap-2">
              <Label>Remuneration preference</Label>
              <div className="flex flex-col gap-2">
                {REMUNERATION_OPTIONS.map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.remuneration_preference === opt.value ? "border-primary bg-[#FFFBEB]" : "border-[#EBEBEB] hover:border-primary/40"}`}>
                    <input type="radio" name="remuneration" value={opt.value} checked={form.remuneration_preference === opt.value}
                      onChange={() => set("remuneration_preference", opt.value)} className="accent-[#FFD200]" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {(form.remuneration_preference === "cash" || form.remuneration_preference === "both") && (
              <div className="grid gap-1">
                <Label>Minimum rate (SGD) <span className="text-muted-foreground text-xs">- private, only shared with matched brands</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">SGD</span>
                  <Input type="number" value={form.min_rate_sgd} onChange={e => set("min_rate_sgd", e.target.value)}
                    placeholder="300" className="pl-12" />
                </div>
              </div>
            )}
            <div className="grid gap-1">
              <Label>Rate card details <span className="text-muted-foreground text-xs">(optional - describe your packages)</span></Label>
              <Textarea
                value={form.rate_card_text}
                onChange={e => set("rate_card_text", e.target.value)}
                placeholder="e.g. 1 Reel: SGD 400, 3 Reels: SGD 1000, Product exchange considered for min SGD 200 value…"
                className="resize-none min-h-[80px]"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={back}>Back</Button>
              <Button className="flex-1" onClick={submit} disabled={loading}>
                {loading ? "Creating your profile…" : "Submit for review →"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your profile will be reviewed by the CASTD team before going live. You'll receive an email when approved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
