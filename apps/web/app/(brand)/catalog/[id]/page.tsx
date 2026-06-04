"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useParams, useRouter } from "next/navigation";
import { api, type Talent } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { InquiryDialog } from "@/components/talent/InquiryDialog";
import { getSessionToken } from "@/lib/get-token";

export default function TalentProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInquiry, setShowInquiry] = useState(false);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      try { setTalent(await api.getTalent(id, getSessionToken() || "")); }
      finally { setLoading(false); }
    })();
  }, [session, isPending, id]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-6 py-10 grid md:grid-cols-[320px_1fr] gap-8">
      <Skeleton className="aspect-[3/4] rounded-xl" />
      <div className="flex flex-col gap-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full" /></div>
    </div>
  );
  if (!talent) return <div className="text-center py-24">Talent not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-[320px_1fr] gap-8">
        <div className="flex flex-col gap-3">
          {talent.photo_urls?.[0] ? (
            <img src={talent.photo_urls[0]} alt={talent.name} className="w-full rounded-xl object-cover aspect-[3/4]" />
          ) : (
            <div className="aspect-[3/4] rounded-xl bg-muted flex items-center justify-center text-4xl text-muted-foreground">{talent.name.slice(0,1)}</div>
          )}
          {talent.photo_urls?.length > 1 && (
            <div className="grid grid-cols-3 gap-1">
              {talent.photo_urls.slice(1,4).map((url, i) => (
                <img key={i} src={url} alt="" className="aspect-square object-cover rounded-md" />
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{talent.name}</h1>
              {talent.ig_handle && <p className="text-muted-foreground">@{talent.ig_handle}</p>}
            </div>
            {talent.fit_score != null && <Badge className="text-sm px-3 py-1">{talent.fit_score}% match</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {talent.age && <Stat label="Age" value={`${talent.age}`} />}
            {talent.gender && <Stat label="Gender" value={talent.gender} />}
            {talent.ig_followers > 0 && <Stat label="IG followers" value={fmtNum(talent.ig_followers)} />}
            {talent.tiktok_followers > 0 && <Stat label="TikTok followers" value={fmtNum(talent.tiktok_followers)} />}
          </div>
          <Separator />
          {talent.bio && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Bio</p>
              <p className="text-sm leading-relaxed">{talent.bio}</p>
            </div>
          )}
          {talent.languages?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Languages</p>
              <div className="flex flex-wrap gap-1">{talent.languages.map(l => <Badge key={l} variant="outline">{l}</Badge>)}</div>
            </div>
          )}
          {talent.content_types?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Content types</p>
              <div className="flex flex-wrap gap-1">{talent.content_types.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
            </div>
          )}
          {talent.vibe_tags?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Vibe</p>
              <div className="flex flex-wrap gap-1">{talent.vibe_tags.map(v => <Badge key={v} variant="outline" className="text-xs">{v}</Badge>)}</div>
            </div>
          )}
          {talent.experience_summary && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Experience</p>
              <p className="text-sm leading-relaxed">{talent.experience_summary}</p>
            </div>
          )}
          {talent.intro_video_url && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Intro video</p>
              <video src={talent.intro_video_url} controls className="w-full rounded-lg max-h-64" />
            </div>
          )}
          <Separator />
          <Button size="lg" onClick={() => setShowInquiry(true)}>Send inquiry</Button>
        </div>
      </div>
      {showInquiry && <InquiryDialog talent={talent} onClose={() => setShowInquiry(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-lg px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-sm">{value}</div>
    </div>
  );
}
function fmtNum(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n); }
