"use client";
import { useEffect, useState } from "react";
import { api, Talent } from "@/lib/api";
import { AvailabilityCalendar } from "@/components/calendar/AvailabilityCalendar";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PhotoUpload, MultiPhotoUpload } from "@/components/ui/photo-upload";

const LANGUAGES = ["English", "Mandarin", "Malay", "Tamil", "Cantonese", "Korean", "Japanese", "Other"];
const CONTENT_TYPES = ["UGC / Unboxing", "Product Demo", "Lifestyle & Vlog", "Beauty Tutorial", "Skincare Routine", "GRWM", "Brand Story", "Testimonial", "Food & Beverage", "Fashion & OOTD", "Fitness & Wellness"];
const VIBE_TAGS = ["Clean & Minimal", "Bold & Vibrant", "Soft & Feminine", "Natural & Earthy", "Luxury", "Playful & Fun", "Edgy & Alternative", "Professional", "Relatable & Candid", "Aesthetic & Curated"];
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say"];
const REMUNERATION_OPTIONS = [
  { value: "cash", label: "Cash only" },
  { value: "product", label: "Product / service exchange" },
  { value: "both", label: "Open to both" },
];

export default function SuperstarProfilePage() {
  const [profile, setProfile] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Form state - mirrors editable fields
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    languages: [] as string[],
    content_types: [] as string[],
    vibe_tags: [] as string[],
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
    email: "",
  });

  useEffect(() => {
    const token = getSessionToken();
    if (!token) return;
    api.getMySuperstarsProfile(token)
      .then(p => {
        setProfile(p);
        setForm({
          name: p.name || "",
          age: p.age?.toString() || "",
          gender: p.gender || "",
          languages: p.languages || [],
          content_types: p.content_types || [],
          vibe_tags: p.vibe_tags || [],
          ig_handle: p.ig_handle || "",
          ig_followers: p.ig_followers?.toString() || "",
          tiktok_handle: p.tiktok_handle || "",
          tiktok_followers: p.tiktok_followers?.toString() || "",
          bio: p.bio || "",
          experience_summary: p.experience_summary || "",
          rate_card_text: p.rate_card_text || "",
          photo_urls: (p.photo_urls || []).join("\n"),
          intro_video_url: p.intro_video_url || "",
          remuneration_preference: (p as any).remuneration_preference || "both",
          min_rate_sgd: (p as any).min_rate_sgd?.toString() || "",
          email: p.email || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleMulti(key: "languages" | "content_types" | "vibe_tags", val: string) {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const token = getSessionToken();
      const updated = await api.updateMySuperstarsProfile({
        name: form.name || undefined,
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
        email: form.email || undefined,
      }, token || "");
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground text-sm">Loading…</p></div>;
  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.is_published
              ? "✅ Your profile is live"
              : "⏳ Pending admin approval"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          <Button onClick={handleSave} disabled={saving} className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-destructive mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}

      <div className="space-y-8">
        {/* Basic info */}
        <Section title="Basic info">
          <div className="grid gap-4">
            <Field label="Full name">
              <Input value={form.name} onChange={e => set("name", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Age">
                <Input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="24" />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={v => v && set("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Contact email (for booking notifications)">
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@email.com" />
            </Field>
          </div>
        </Section>

        {/* Social */}
        <Section title="Social media">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Instagram handle">
                <Input value={form.ig_handle} onChange={e => set("ig_handle", e.target.value)} placeholder="@yourhandle" />
              </Field>
              <Field label="IG followers">
                <Input type="number" value={form.ig_followers} onChange={e => set("ig_followers", e.target.value)} placeholder="12000" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="TikTok handle">
                <Input value={form.tiktok_handle} onChange={e => set("tiktok_handle", e.target.value)} placeholder="@yourhandle" />
              </Field>
              <Field label="TikTok followers">
                <Input type="number" value={form.tiktok_followers} onChange={e => set("tiktok_followers", e.target.value)} placeholder="5000" />
              </Field>
            </div>
          </div>
        </Section>

        {/* Content */}
        <Section title="Content & vibe">
          <div className="space-y-4">
            <Field label="Languages">
              <div className="flex flex-wrap gap-2 mt-1">
                {LANGUAGES.map(l => (
                  <Badge key={l} variant={form.languages.includes(l) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => toggleMulti("languages", l)}>{l}</Badge>
                ))}
              </div>
            </Field>
            <Field label="Content types">
              <div className="flex flex-wrap gap-2 mt-1">
                {CONTENT_TYPES.map(c => (
                  <Badge key={c} variant={form.content_types.includes(c) ? "default" : "outline"}
                    className="cursor-pointer" onClick={() => toggleMulti("content_types", c)}>{c}</Badge>
                ))}
              </div>
            </Field>
            <Field label="Vibe tags (up to 3)">
              <div className="flex flex-wrap gap-2 mt-1">
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
            </Field>
          </div>
        </Section>

        {/* Bio */}
        <Section title="Bio & experience">
          <div className="space-y-4">
            <Field label="Bio (shown to brands)">
              <Textarea value={form.bio} onChange={e => set("bio", e.target.value)}
                placeholder="Tell brands who you are, your style, and what makes you stand out…"
                className="resize-none min-h-[100px]" />
            </Field>
            <Field label="Previous experience">
              <Textarea value={form.experience_summary} onChange={e => set("experience_summary", e.target.value)}
                placeholder="Brands you've worked with, campaigns done, notable projects…"
                className="resize-none min-h-[80px]" />
            </Field>
          </div>
        </Section>

        {/* Portfolio */}
        <Section title="Portfolio">
          <div className="space-y-6">
            <Field label="Profile photo">
              <PhotoUpload
                value={form.photo_urls.split("\n").filter(Boolean)[0] || ""}
                onChange={url => {
                  const rest = form.photo_urls.split("\n").filter(Boolean).slice(1);
                  set("photo_urls", [url, ...rest].join("\n"));
                }}
                label="Upload profile photo"
                aspectRatio="portrait"
                className="max-w-[180px]"
              />
            </Field>
            <Field label="Portfolio photos (up to 5)">
              <MultiPhotoUpload
                values={form.photo_urls.split("\n").filter(Boolean).slice(1, 6)}
                onChange={urls => {
                  const main = form.photo_urls.split("\n").filter(Boolean)[0] || "";
                  set("photo_urls", [main, ...urls].join("\n"));
                }}
                maxPhotos={5}
              />
            </Field>
            <Field label="Intro video URL (YouTube / Vimeo)">
              <Input value={form.intro_video_url} onChange={e => set("intro_video_url", e.target.value)}
                placeholder="https://youtube.com/watch?v=..." />
            </Field>
          </div>
        </Section>

        {/* Rates */}
        <Section title="Rates & remuneration">
          <div className="space-y-4">
            <Field label="Remuneration preference">
              <div className="flex flex-col gap-2 mt-1">
                {REMUNERATION_OPTIONS.map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${form.remuneration_preference === opt.value ? "border-primary bg-[#FFFBEB]" : "border-[#EBEBEB]"}`}>
                    <input type="radio" name="remuneration" value={opt.value}
                      checked={form.remuneration_preference === opt.value}
                      onChange={() => set("remuneration_preference", opt.value)}
                      className="accent-[#FFD200]" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </Field>
            {(form.remuneration_preference === "cash" || form.remuneration_preference === "both") && (
              <Field label="Minimum rate (SGD) - private">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">SGD</span>
                  <Input type="number" value={form.min_rate_sgd} onChange={e => set("min_rate_sgd", e.target.value)}
                    placeholder="300" className="pl-12" />
                </div>
              </Field>
            )}
            <Field label="Rate card details">
              <Textarea value={form.rate_card_text} onChange={e => set("rate_card_text", e.target.value)}
                placeholder="e.g. 1 Reel: SGD 400, 3 Reels: SGD 1000…"
                className="resize-none min-h-[80px]" />
            </Field>
          </div>
        </Section>
      </div>

      {/* Availability calendar */}
      {profile && (
        <div className="mt-8">
          <Section title="Availability Calendar">
            <p className="text-xs text-muted-foreground mb-4">
              Mark dates you are NOT available. Brands can see this before booking.
              Red = unavailable, white = available.
            </p>
            <AvailabilityCalendar
              talentId={profile.id}
              blockedDates={[]}
              editable={true}
              token={getSessionToken() || ""}
            />
          </Section>
        </div>
      )}

      {/* Save button at bottom */}
      <div className="mt-10 flex items-center justify-between pt-6 border-t">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && <span className="text-sm text-green-600 font-medium">Changes saved ✓</span>}
        <Button onClick={handleSave} disabled={saving} className="ml-auto bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-4 pb-2 border-b">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
