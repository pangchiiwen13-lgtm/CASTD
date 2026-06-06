"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getSessionToken } from "@/lib/get-token";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AdminBrand {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  campaign_type?: string;
  aesthetic_tags: string[];
  plan_tier: string;
  email?: string;
  created_at: string;
  inquiry_count: number;
  confirmed_count: number;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  monthly: "bg-green-100 text-green-700",
  enterprise: "bg-purple-100 text-purple-700",
};

export default function AdminBrandsPage() {
  const { data: session } = useSession();
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/brands/admin/all`, {
      headers: { Authorization: `Bearer ${getSessionToken()}` },
    })
      .then(r => r.json())
      .then(data => setBrands(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [session]);

  const filtered = brands.filter(b =>
    !search ||
    b.company_name.toLowerCase().includes(search.toLowerCase()) ||
    b.industry?.toLowerCase().includes(search.toLowerCase()) ||
    b.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            All registered brand accounts.
            {!loading && <span className="font-medium text-foreground ml-1">{brands.length} total.</span>}
          </p>
        </div>
        <div className="w-56">
          <Input
            placeholder="Search brands…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          {search ? `No brands matching "${search}"` : "No brands registered yet."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(brand => (
            <div key={brand.id} className="rounded-xl border overflow-hidden">
              {/* Row */}
              <button
                className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors"
                onClick={() => setExpanded(expanded === brand.id ? null : brand.id)}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#0C0C0C] flex items-center justify-center shrink-0">
                  <span className="text-[#FFD200] text-sm font-bold">
                    {brand.company_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{brand.company_name}</span>
                    {brand.industry && (
                      <span className="text-xs text-muted-foreground">{brand.industry}</span>
                    )}
                    <Badge variant="outline" className={`text-xs ${PLAN_COLORS[brand.plan_tier] || PLAN_COLORS.free}`}>
                      {brand.plan_tier || "free"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-3">
                    {brand.email && <span>✉️ {brand.email}</span>}
                    <span>📋 {brand.inquiry_count} inquir{brand.inquiry_count === 1 ? "y" : "ies"}</span>
                    {brand.confirmed_count > 0 && (
                      <span className="text-green-600">✅ {brand.confirmed_count} confirmed</span>
                    )}
                    <span>Joined {new Date(brand.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Expand toggle */}
                <span className="text-muted-foreground text-xs shrink-0">
                  {expanded === brand.id ? "▲" : "▼"}
                </span>
              </button>

              {/* Expanded details */}
              {expanded === brand.id && (
                <div className="px-5 pb-5 pt-2 border-t bg-muted/20">
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <DetailItem label="Brand ID" value={brand.id} mono />
                    <DetailItem label="User ID" value={brand.user_id} mono />
                    <DetailItem label="Campaign type" value={brand.campaign_type || "—"} />
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Aesthetic tags</p>
                      <div className="flex flex-wrap gap-1">
                        {brand.aesthetic_tags?.length > 0
                          ? brand.aesthetic_tags.map(t => (
                              <span key={t} className="text-xs px-2 py-0.5 bg-[#EBEBEB] rounded-full">{t}</span>
                            ))
                          : <span className="text-xs text-muted-foreground">None set</span>
                        }
                      </div>
                    </div>
                    <DetailItem label="Total inquiries" value={String(brand.inquiry_count)} />
                    <DetailItem label="Confirmed bookings" value={String(brand.confirmed_count)} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
