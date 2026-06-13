"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { api, type Talent, type Brand, type BrandProject } from "@/lib/api";
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
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign");

  const [talents, setTalents] = useState<Talent[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<BrandProject | null>(null);
  const [filters, setFilters] = useState<Filters>({
    content_type: "", language: "", gender: "",
    sort_by: campaignId ? "fit_score" : "name",
    search: "",
  });
  const [brandProfile, setBrandProfile] = useState<Brand | null | "loading">("loading");

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) { fetchShortlist(); checkBrandProfile(); }
  }, [session, isPending]);

  // Load campaign context if ?campaign= is set
  useEffect(() => {
    if (!campaignId || !session) return;
    const token = getSessionToken() || "";
    api.getProject(campaignId, token)
      .then(p => setCampaign(p))
      .catch(() => null);
  }, [campaignId, session]);

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
      setBrandProfile(null);
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
      // Pass campaign context so scores are campaign-specific
      if (campaignId && filters.sort_by === "fit_score") params.project_id = campaignId;
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

  const showProfileBanner = !campaignId && brandProfile === null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* Campaign context banner */}
      {campaignId && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-[#FFD200]/40 px-4 py-3 bg-[#FFFBEB] shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD200] inline-block" />
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {campaign ? `Matching for: ${campaign.name}` : "Loading campaign..."}
              </p>
            </div>
            {campaign && (
              <p className="text-xs text-[#9A9A9A] mt-0.5">
                Talents are ranked by fit score for this specific campaign.
                {campaign.target_content_types?.length
                  ? ` Criteria: ${[
                      ...(campaign.target_content_types ?? []),
                      campaign.target_gender && campaign.target_gender !== "Any" ? campaign.target_gender : null,
                      ...(campaign.target_languages ?? []),
                    ].filter(Boolean).join(", ")}`
                  : " No criteria set - scores use general brand profile."}
              </p>
            )}
          </div>
          <Link
            href={`/campaigns/${campaignId}`}
            className="shrink-0 text-xs text-[#9A9A9A] hover:text-[#1A1A1A] underline underline-offset-2"
          >
            Back to campaign
          </Link>
        </div>
      )}

      {/* Brand profile prompt (only when not in campaign context) */}
      {showProfileBanner && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-dashed border-[#FFD200]/60 px-4 py-3 bg-white shadow-sm">
          <div>
            <p className="text-sm font-medium">Set up your brand profile for AI-matched talent scores</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tell us about your brand and we&apos;ll rank talents by how well they fit your campaigns.
            </p>
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
