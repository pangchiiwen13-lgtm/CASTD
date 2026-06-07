"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Talent, type Brand } from "@/lib/api";
import { TalentCard } from "@/components/talent/TalentCard";
import { FilterPanel, type Filters } from "@/components/catalog/FilterPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { getSessionToken } from "@/lib/get-token";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ content_type: "", language: "", gender: "", sort_by: "name", search: "" });
  const [brandProfile, setBrandProfile] = useState<Brand | null | "loading">("loading");

  // Redirect if not logged in; fetch shortlist + check brand profile once on login
  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) { fetchShortlist(); checkBrandProfile(); }
  }, [session, isPending]);

  // Re-fetch talents whenever session or filters change
  useEffect(() => {
    if (session) fetchTalents();
  }, [session, isPending, filters]);

  async function getToken() {
    return getSessionToken() || "";
  }

  async function checkBrandProfile() {
    try {
      const token = await getToken();
      const brand = await api.getMyBrand(token);
      setBrandProfile(brand);
    } catch {
      setBrandProfile(null); // 404 = no profile yet
    }
  }

  async function fetchTalents() {
    setLoading(true);
    try {
      const token = await getToken();
      const params: Record<string, string> = {};
      if (filters.content_type) params.content_type = filters.content_type;
      if (filters.language) params.language = filters.language;
      if (filters.gender) params.gender = filters.gender;
      if (filters.sort_by) params.sort_by = filters.sort_by;
      if (filters.search) params.search = filters.search;
      setTalents(await api.getTalents(params, token));
    } finally { setLoading(false); }
  }

  async function fetchShortlist() {
    try {
      const token = await getToken();
      const list = await api.getShortlist(token);
      setSavedIds(new Set(list.map((t: any) => t.id)));
    } catch {}
  }

  async function handleShortlist(talentId: string, save: boolean) {
    const token = await getToken();
    if (save) { await api.addShortlist(talentId, token); setSavedIds(s => new Set([...s, talentId])); }
    else { await api.removeShortlist(talentId, token); setSavedIds(s => { const n = new Set(s); n.delete(talentId); return n; }); }
  }

  const showProfileBanner = brandProfile === null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Brand profile prompt */}
      {showProfileBanner && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-[#FFD200]/60 px-4 py-3 bg-white shadow-sm">
          <div>
            <p className="text-sm font-medium">Set up your brand profile for AI-matched talent scores</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tell us about your brand and we&apos;ll rank talents by how well they fit your campaigns.</p>
          </div>
          <Link href="/settings" className={cn(buttonVariants({ size: "sm" }), "shrink-0 rounded-full bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]")}>
            Set up
          </Link>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Talent Catalog</h1>
        <p className="text-sm text-muted-foreground">Browse and shortlist talents for your campaign. Profiles are free to view.</p>
      </div>
      <div className="mb-6"><FilterPanel filters={filters} onChange={setFilters} /></div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[3/4] rounded-xl" />
              <Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : talents.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">No talents found for those filters.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {talents.map(talent => (
            <TalentCard key={talent.id} talent={talent} onShortlist={handleShortlist} isSaved={savedIds.has(talent.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
