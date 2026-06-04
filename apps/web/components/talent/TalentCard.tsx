"use client";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-[3/4] relative bg-muted overflow-hidden">
        {photo ? (
          <img src={photo} alt={talent.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="text-2xl">
                {talent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        {talent.fit_score !== undefined && talent.fit_score !== null && (
          <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full font-medium">
            {talent.fit_score}% match
          </div>
        )}
      </div>
      <CardContent className="p-4 flex flex-col gap-3">
        <div>
          <div className="font-semibold">{talent.name}</div>
          {talent.ig_handle && (
            <div className="text-sm text-muted-foreground">@{talent.ig_handle}</div>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {talent.vibe_tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {followers && <span>📷 {followers}</span>}
          {talent.languages?.[0] && <span>🌐 {talent.languages[0]}</span>}
          {talent.age && <span>· {talent.age}y</span>}
        </div>
        <div className="flex gap-2 mt-1">
          <Link href={`/catalog/${talent.id}`} className={cn(buttonVariants({ size: "sm" }), "flex-1 text-center")}>View profile</Link>
          {onShortlist && (
            <Button
              size="sm"
              variant={isSaved ? "default" : "outline"}
              onClick={() => onShortlist(talent.id, !isSaved)}
            >
              {isSaved ? "★" : "☆"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
