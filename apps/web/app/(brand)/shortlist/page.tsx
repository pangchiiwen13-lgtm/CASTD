"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TalentCard } from "@/components/talent/TalentCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";

export default function ShortlistPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [talents, setTalents] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session) return;
    (async () => {
      const token = getSessionToken() || "";
      const list = await api.getShortlist(token);
      setTalents(list);
      setSavedIds(new Set(list.map((t: any) => t.id)));
      setLoading(false);
    })();
  }, [session, isPending]);

  async function handleRemove(talentId: string) {
    await api.removeShortlist(talentId, getSessionToken() || "");
    setTalents(t => t.filter(x => x.id !== talentId));
    setSavedIds(s => { const n = new Set(s); n.delete(talentId); return n; });
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1 text-[#1A1A1A]">My Shortlist</h1>
      <p className="text-sm text-[#9A9A9A] mb-6">Talents you've saved for your campaign.</p>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
        </div>
      ) : talents.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">No saved talents yet. Browse the catalog and star talents to save them here.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {talents.map(t => <TalentCard key={t.id} talent={t} onShortlist={handleRemove} isSaved />)}
        </div>
      )}
    </div>
  );
}
