"use client";
import { motion } from "framer-motion";
import type { Talent } from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  talent: Talent;
  onShortlist?: (id: string, saved: boolean) => void;
  isSaved?: boolean;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function TalentCard({ talent, onShortlist, isSaved }: Props) {
  const photo = talent.photo_urls?.[0];
  const igFollowers = talent.ig_followers && talent.ig_followers > 0 ? fmtNum(talent.ig_followers) : null;
  const ttFollowers = talent.tiktok_followers && talent.tiktok_followers > 0 ? fmtNum(talent.tiktok_followers) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-2xl overflow-hidden bg-[#0C0C0C] border border-white/8 hover:border-white/16 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.4)] hover:-translate-y-1"
    >
      {/* Photo */}
      <div className="aspect-[3/4] relative overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={talent.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <span className="text-4xl font-bold text-white/20">{talent.name.slice(0, 1)}</span>
          </div>
        )}

        {/* Gradient overlay - always present, darkens on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C0C] via-[#0C0C0C]/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />

        {/* Fit score badge */}
        {talent.fit_score != null && (
          <div className="absolute top-3 right-3 bg-[#FFD200] text-[#0C0C0C] text-[10px] px-2 py-0.5 rounded font-bold tracking-wide">
            {talent.fit_score}% fit
          </div>
        )}

        {/* Save/shortlist button */}
        {onShortlist && (
          <button
            onClick={e => { e.preventDefault(); onShortlist(talent.id, !isSaved); }}
            className={cn(
              "absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-200",
              isSaved
                ? "bg-[#FFD200] text-[#0C0C0C] opacity-100 scale-100"
                : "bg-black/50 backdrop-blur-sm text-white/60 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
            )}
            aria-label={isSaved ? "Remove from shortlist" : "Save to shortlist"}
          >
            {isSaved ? "★" : "☆"}
          </button>
        )}

        {/* Name + info overlay at bottom */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          <p className="font-bold text-white text-sm leading-tight mb-0.5">{talent.name}</p>
          {talent.ig_handle && (
            <p className="text-white/45 text-xs">@{talent.ig_handle}</p>
          )}

          {/* Social stats - fade up on hover */}
          <div className="flex items-center gap-3 mt-2 overflow-hidden max-h-0 group-hover:max-h-10 transition-all duration-300 opacity-0 group-hover:opacity-100">
            {igFollowers && (
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                {igFollowers}
              </span>
            )}
            {ttFollowers && (
              <span className="flex items-center gap-1 text-[10px] text-white/50">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.77 1.52V6.73a4.85 4.85 0 01-1-.04z"/></svg>
                {ttFollowers}
              </span>
            )}
            {talent.age && <span className="text-[10px] text-white/35">{talent.age}y</span>}
          </div>

          {/* Vibe tags */}
          {talent.vibe_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {talent.vibe_tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA bar */}
      <Link
        href={`/catalog/${talent.id}`}
        className="flex items-center justify-between px-4 py-3 bg-[#0C0C0C] group-hover:bg-[#FFD200] transition-colors duration-300"
      >
        <span className="text-xs font-semibold text-white/50 group-hover:text-[#0C0C0C] transition-colors duration-300">
          View profile
        </span>
        <span className="text-white/30 group-hover:text-[#0C0C0C] text-xs transition-colors duration-300">→</span>
      </Link>
    </motion.div>
  );
}
