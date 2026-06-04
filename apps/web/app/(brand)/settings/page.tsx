"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Brand } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";

const INDUSTRIES = ["Beauty", "Skincare", "Fashion", "Wellness", "Food & Beverage", "Lifestyle", "Tech", "Finance", "Other"];
const CAMPAIGN_TYPES = ["Brand awareness", "Product launch", "Social media content", "Event coverage", "Tutorial", "Testimonial"];
const AESTHETIC_OPTIONS = ["Clean & minimal", "Bold & vibrant", "Soft & feminine", "Natural & earthy", "Luxury", "Playful", "Edgy", "Professional"];

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ company_name: "", industry: "", campaign_type: "", aesthetic_tags: [] as string[] });

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session) return;
    (async () => {
      try {
        const b = await api.getMyBrand(getSessionToken() || "");
        setBrand(b);
        setForm({ company_name: b.company_name, industry: b.industry || "", campaign_type: b.campaign_type || "", aesthetic_tags: b.aesthetic_tags || [] });
      } catch {}
      setLoading(false);
    })();
  }, [session, isPending]);

  function toggleAesthetic(tag: string) {
    setForm(f => ({ ...f, aesthetic_tags: f.aesthetic_tags.includes(tag) ? f.aesthetic_tags.filter(t => t !== tag) : [...f.aesthetic_tags, tag] }));
  }

  async function save() {
    setSaving(true);
    try {
      const token = getSessionToken() || "";
      if (brand) await api.updateBrand(form, token);
      else await api.createBrand(form, token);
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-4">
      <Skeleton className="h-8 w-48" /><Skeleton className="h-32 rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Brand Profile</h1>
      <Card>
        <CardHeader><CardTitle>Your brand information</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-1">
            <Label>Company / brand name</Label>
            <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
          </div>
          <div className="grid gap-1">
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <Label>Typical campaign type</Label>
            <Select value={form.campaign_type} onValueChange={v => setForm(f => ({ ...f, campaign_type: v ?? "" }))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 block">Brand aesthetic</Label>
            <div className="flex flex-wrap gap-2">
              {AESTHETIC_OPTIONS.map(tag => (
                <Badge key={tag} variant={form.aesthetic_tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer select-none" onClick={() => toggleAesthetic(tag)}>{tag}</Badge>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Saving your profile triggers AI brand-fit scoring so the catalog shows your best matches first.</p>
          <Button onClick={save} disabled={saving} className="self-start">
            {saving ? "Saving..." : saved ? "Saved!" : "Save profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
