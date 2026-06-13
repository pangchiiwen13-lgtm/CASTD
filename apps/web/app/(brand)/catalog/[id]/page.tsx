"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api, type Talent } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToCampaignDialog } from "@/components/talent/AddToCampaignDialog";
import { AvailabilityCalendar } from "@/components/calendar/AvailabilityCalendar";
import { getSessionToken } from "@/lib/get-token";
import type { AvailabilityRule } from "@/lib/api";
import Link from "next/link";

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-white/5 border border-white/8">
      <div className="text-[#FFD200]">{icon}</div>
      <span className="text-white font-bold text-base">{value}</span>
      <span className="text-white/40 text-[10px] uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function TalentProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTo, setShowAddTo] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session || !id) return;
    (async () => {
      setLoading(true);
      const token = getSessionToken() || "";
      try {
        const t = await api.getTalent(id, token);
        setTalent(t);
        // Load availability calendar
        api.getCalendar(id, token)
          .then(r => { setBlockedDates(r.blocked_dates); setAvailabilityRules(r.availability_rules); })
          .catch(() => null);
      }
      finally { setLoading(false); }
    })();
  }, [session, isPending, id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0C0C0C] px-6 py-10">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[400px_1fr] gap-8">
        <Skeleton className="aspect-[3/4] rounded-2xl bg-white/5" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-48 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
          <Skeleton className="h-24 w-full bg-white/5 mt-4" />
        </div>
      </div>
    </div>
  );

  if (!talent) return (
    <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/40 mb-4">Talent not found.</p>
        <Link href="/catalog" className="text-[#FFD200] text-sm hover:underline">Back to catalog</Link>
      </div>
    </div>
  );

  const photos = talent.photo_urls || [];

  return (
    <div className="min-h-screen bg-[#0C0C0C]">
      {/* Back nav */}
      <div className="px-6 pt-6 pb-0">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-white/30 hover:text-white/70 text-sm transition-colors">
          <span>←</span> Back to catalog
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-[380px_1fr] gap-10 items-start">

          {/* LEFT - Photo gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-3 sticky top-24"
          >
            {/* Main photo */}
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-white/5 border border-white/8">
              {photos[activePhoto] ? (
                <img src={photos[activePhoto]} alt={talent.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-white/10">{talent.name.slice(0, 1)}</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activePhoto ? "border-[#FFD200]" : "border-white/10 hover:border-white/30"}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Send inquiry - sticky on desktop */}
            <Button
              size="lg"
              className="w-full bg-[#FFD200] text-[#0C0C0C] hover:bg-white font-bold rounded-xl h-12 text-sm"
              onClick={() => setShowAddTo(true)}
            >
              Add to campaign
            </Button>
          </motion.div>

          {/* RIGHT - Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-7"
          >
            {/* Name + handle */}
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                {talent.fit_score != null && (
                  <span className="text-[10px] bg-[#FFD200] text-[#0C0C0C] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    {talent.fit_score}% match
                  </span>
                )}
                {talent.gender && (
                  <span className="text-[10px] border border-white/10 text-white/40 px-2 py-0.5 rounded uppercase tracking-wide">
                    {talent.gender}
                  </span>
                )}
                {talent.age && (
                  <span className="text-[10px] border border-white/10 text-white/40 px-2 py-0.5 rounded uppercase tracking-wide">
                    {talent.age} yrs
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{talent.name}</h1>
              {talent.ig_handle && (
                <p className="text-white/35 text-sm mt-1">@{talent.ig_handle}</p>
              )}
            </div>

            {/* Social stats */}
            {(talent.ig_followers > 0 || talent.tiktok_followers > 0) && (
              <div className="flex gap-3 flex-wrap">
                {talent.ig_followers > 0 && (
                  <StatPill
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                    value={fmtNum(talent.ig_followers)}
                    label="Instagram"
                  />
                )}
                {talent.tiktok_followers > 0 && (
                  <StatPill
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.77 1.52V6.73a4.85 4.85 0 01-1-.04z"/></svg>}
                    value={fmtNum(talent.tiktok_followers)}
                    label="TikTok"
                  />
                )}
              </div>
            )}

            {/* Bio */}
            {talent.bio && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-3">About</p>
                <p className="text-white/70 text-sm leading-relaxed">{talent.bio}</p>
              </div>
            )}

            {/* Languages */}
            {talent.languages?.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-2">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {talent.languages.map(l => (
                    <span key={l} className="text-xs border border-white/10 text-white/60 px-3 py-1 rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Content types */}
            {talent.content_types?.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-2">Content types</p>
                <div className="flex flex-wrap gap-2">
                  {talent.content_types.map(t => (
                    <span key={t} className="text-xs bg-white/5 border border-white/8 text-white/55 px-3 py-1 rounded-full hover:border-[#FFD200]/30 transition-colors">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Vibe tags */}
            {talent.vibe_tags?.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-2">Vibe</p>
                <div className="flex flex-wrap gap-2">
                  {talent.vibe_tags.map(v => (
                    <span key={v} className="text-xs bg-[#FFD200]/8 border border-[#FFD200]/20 text-[#FFD200]/70 px-3 py-1 rounded-full font-medium">{v}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {talent.experience_summary && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-3">Experience</p>
                <p className="text-white/60 text-sm leading-relaxed">{talent.experience_summary}</p>
              </div>
            )}

            {/* Rate card */}
            {talent.rate_card_text && (
              <div className="rounded-xl bg-white/4 border border-white/8 p-5">
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-2">Rate card</p>
                <p className="text-white/60 text-sm leading-relaxed whitespace-pre-line">{talent.rate_card_text}</p>
              </div>
            )}

            {/* Intro video */}
            {talent.intro_video_url && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-3">Intro video</p>
                <video src={talent.intro_video_url} controls className="w-full rounded-xl max-h-72 bg-black" />
              </div>
            )}

            {/* Availability calendar */}
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-semibold mb-3">Availability</p>
              <div className="rounded-xl bg-white p-4">
                <AvailabilityCalendar
                  talentId={talent.id}
                  blockedDates={blockedDates}
                  availabilityRules={availabilityRules}
                  editable={false}
                />
              </div>
            </div>

            {/* Mobile CTA */}
            <Button
              size="lg"
              className="md:hidden w-full bg-[#FFD200] text-[#0C0C0C] hover:bg-white font-bold rounded-xl h-12"
              onClick={() => setShowAddTo(true)}
            >
              Add to campaign
            </Button>
          </motion.div>
        </div>
      </div>

      {showAddTo && <AddToCampaignDialog talent={talent} onClose={() => setShowAddTo(false)} />}
    </div>
  );
}
