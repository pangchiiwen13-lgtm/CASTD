"use client";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Talent } from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  talent: Talent;
  onShortlist?: (id: string, saved: boolean) => void;
  isSaved?: boolean;
}

export function TalentCard({ talent, onShortlist, isSaved }: Props) {
  const photo = talent.photo_urls?.[0];
  const followers = talent.ig_followers
    ? talent.ig_followers >= 1000
      ? `${(talent.ig_followers / 1000).toFixed(1)}K`
      : String(talent.ig_followers)
    : null;

  return (
    <div className="group overflow-hidden rounded-xl border border-[#EBEBEB] bg-white transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5">
      {/* Photo area */}
      <div className="aspect-[2/3] relative bg-[#F8F7F4] overflow-hidden">
        {photo ? (
          <img src={photo} alt={talent.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-xl font-semibold text-[#7A7A7A]">
                {talent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Fit score badge - CASTD Yellow, brand format: "94 Match" */}
        {talent.fit_score !== undefined && talent.fit_score !== null && (
          <div className="absolute top-2 right-2 bg-[#FFD200] text-[#0C0C0C] text-xs px-2 py-0.5 rounded font-semibold">
            {talent.fit_score} Match
          </div>
        )}

        {/* Shortlist star - appears on hover */}
        {onShortlist && (
          <button
            className={cn(
              "absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all",
              isSaved
                ? "bg-[#FFD200] text-[#0C0C0C] opacity-100"
                : "bg-white/80 text-[#7A7A7A] opacity-0 group-hover:opacity-100"
            )}
            onClick={() => onShortlist(talent.id, !isSaved)}
            aria-label={isSaved ? "Remove from shortlist" : "Add to shortlist"}
          >
            {isSaved ? "★" : "☆"}
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2">
        <div>
          <div className="font-semibold text-sm text-[#0C0C0C] leading-tight">{talent.name}</div>
          {talent.ig_handle && (
            <div className="text-xs text-[#7A7A7A]">@{talent.ig_handle}</div>
          )}
        </div>

        {/* Tags */}
        {talent.vibe_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {talent.vibe_tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] bg-[#EBEBEB] text-[#2A2A2A] px-2 py-0.5 rounded-full font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2 text-[11px] text-[#7A7A7A]">
          {followers && <span>📷 {followers}</span>}
          {talent.languages?.[0] && <span>🌐 {talent.languages[0]}</span>}
          {talent.age && <span>· {talent.age}y</span>}
        </div>

        <Link
          href={`/catalog/${talent.id}`}
          className={cn(buttonVariants({ size: "sm" }), "w-full text-center text-xs mt-0.5")}
        >
          View profile
        </Link>
      </div>
    </div>
  );
}
