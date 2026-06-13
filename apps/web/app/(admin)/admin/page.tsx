"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { buttonVariants, Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { enterPreviewMode } from "@/components/AdminPreviewBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";
import { cn } from "@/lib/utils";

interface Stats {
  talents: { total: number; published: number; draft: number };
  brands: { total: number };
  inquiries: { total: number; open: number; confirmed: number };
  superstars_pending_approval: number;
  campaigns_payment_held?: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${getSessionToken()}` },
    })
      .then(r => {
        if (!r.ok) throw new Error(`Stats fetch failed: ${r.status}`);
        return r.json();
      })
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  const hasPendingActions = stats && (
    stats.superstars_pending_approval > 0 || (stats.inquiries?.open ?? 0) > 0 || (stats.campaigns_payment_held ?? 0) > 0
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">CASTD platform overview.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <StatCard
              value={stats?.talents.published ?? 0}
              label="Live Superstars"
              sub={`${stats?.talents.draft ?? 0} unpublished`}
              color="text-green-600"
            />
            <StatCard
              value={stats?.superstars_pending_approval ?? 0}
              label="Pending approval"
              sub="Superstars awaiting review"
              color={stats?.superstars_pending_approval ? "text-yellow-600" : undefined}
              urgent={!!stats?.superstars_pending_approval}
            />
            <StatCard
              value={stats?.brands.total ?? 0}
              label="Brands"
              sub="registered"
            />
            <StatCard
              value={stats?.inquiries?.total ?? 0}
              label="Inquiries"
              sub={`${stats?.inquiries?.open ?? 0} open · ${stats?.inquiries?.confirmed ?? 0} confirmed`}
            />
          </>
        )}
      </div>

      {/* Action required */}
      {hasPendingActions && (
        <div className="rounded-xl border border-[#FFD200]/40 bg-[#FFFBEB] p-5 mb-8">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" /> Action required
          </h2>
          <div className="space-y-2">
            {stats && stats.superstars_pending_approval > 0 && (
              <ActionItem
                message={`${stats.superstars_pending_approval} Superstar${stats.superstars_pending_approval > 1 ? "s" : ""} waiting for profile approval`}
                href="/admin/talents"
                cta="Review now"
              />
            )}
            {stats && (stats.inquiries?.open ?? 0) > 0 && (
              <ActionItem
                message={`${stats.inquiries?.open} open inquiry${(stats.inquiries?.open ?? 0) > 1 ? "ies" : "y"} need to be reviewed`}
                href="/admin/inquiries"
                cta="View inquiries"
              />
            )}
            {stats && (stats.campaigns_payment_held ?? 0) > 0 && (
              <ActionItem
                message={`${stats.campaigns_payment_held} campaign payment${(stats.campaigns_payment_held ?? 0) > 1 ? "s" : ""} held in escrow - ready to release`}
                href="/admin/campaigns"
                cta="Release payments"
              />
            )}
          </div>
        </div>
      )}

      {/* Management sections */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ManageCard
          title="Superstars"
          description={`${stats?.talents.published ?? "-"} live profiles. Add, edit, approve, or unpublish.`}
          href="/admin/talents"
          cta="Manage Superstars"
        />
        <ManageCard
          title="Brands"
          description={`${stats?.brands.total ?? "-"} registered brands. View profiles and activity.`}
          href="/admin/brands"
          cta="View Brands"
        />
        <ManageCard
          title="Inquiries"
          description={`${stats?.inquiries?.total ?? "-"} total. Move inquiries through the pipeline.`}
          href="/admin/inquiries"
          cta="Manage Inquiries"
        />
        <ManageCard
          title="Campaign Payments"
          description={`Escrow payments held on behalf of brands. Release to talent after delivery confirmed.${stats?.campaigns_payment_held ? ` ${stats.campaigns_payment_held} held.` : ""}`}
          href="/admin/campaigns"
          cta="Manage Payments"
        />
        <ManageCard
          title="Platform Settings"
          description="Configure email (Resend API key) and other platform settings."
          href="/admin/settings"
          cta="Open Settings"
        />
      </div>

      {/* Portal preview */}
      <div className="mt-8 rounded-xl border-2 border-[#FFD200]/60 bg-[#FFFBEB] p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#FFD200] inline-block" />
          <h2 className="font-semibold text-sm">Preview portals</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Enter either portal as an admin. A yellow bar will appear so you always know you're in preview mode - click it to switch or exit back here.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            className="bg-[#0C0C0C] text-[#FFD200] hover:bg-[#2A2A2A]"
            size="sm"
            onClick={() => { enterPreviewMode("brand"); router.push("/dashboard"); }}
          >
            Preview Brand Portal
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-[#0C0C0C] text-[#0C0C0C] hover:bg-[#0C0C0C] hover:text-[#FFD200]"
            onClick={() => { enterPreviewMode("superstar"); router.push("/superstar/dashboard"); }}
          >
            Preview Superstar Portal
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, sub, color, urgent }: {
  value: number; label: string; sub?: string; color?: string; urgent?: boolean;
}) {
  return (
    <div className={`rounded-xl border px-4 py-4 ${urgent ? "border-yellow-300 bg-yellow-50" : ""}`}>
      <div className={`text-3xl font-bold ${color || ""}`}>{value}</div>
      <div className="text-xs font-medium text-foreground mt-0.5">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function ActionItem({ message, href, cta }: {
  message: string; href: string; cta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-lg px-4 py-3 border">
      <p className="text-sm flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" /> {message}
      </p>
      <Link href={href} className={cn(buttonVariants({ size: "sm" }), "shrink-0 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] border-0")}>
        {cta} →
      </Link>
    </div>
  );
}

function ManageCard({ title, description, href, cta }: {
  title: string; description: string; href: string; cta: string;
}) {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground flex-1">{description}</p>
      <Link href={href} className={cn(buttonVariants({ size: "sm" }), "self-start")}>
        {cta}
      </Link>
    </div>
  );
}
