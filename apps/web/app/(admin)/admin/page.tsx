"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";
import { cn } from "@/lib/utils";

interface Stats {
  talents: { total: number; published: number; draft: number };
  brands: { total: number };
  inquiries: { total: number; open: number; confirmed: number };
  superstars_pending_approval: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${getSessionToken()}` },
    })
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, [session]);

  const hasPendingActions = stats && (
    stats.superstars_pending_approval > 0 || stats.inquiries.open > 0
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
              value={stats?.inquiries.total ?? 0}
              label="Inquiries"
              sub={`${stats?.inquiries.open ?? 0} open · ${stats?.inquiries.confirmed ?? 0} confirmed`}
            />
          </>
        )}
      </div>

      {/* Action required */}
      {hasPendingActions && (
        <div className="rounded-xl border border-[#FFD200]/40 bg-[#FFFBEB] p-5 mb-8">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span>⚡</span> Action required
          </h2>
          <div className="space-y-2">
            {stats && stats.superstars_pending_approval > 0 && (
              <ActionItem
                icon="⭐"
                message={`${stats.superstars_pending_approval} Superstar${stats.superstars_pending_approval > 1 ? "s" : ""} waiting for profile approval`}
                href="/admin/talents"
                cta="Review now"
              />
            )}
            {stats && stats.inquiries.open > 0 && (
              <ActionItem
                icon="📋"
                message={`${stats.inquiries.open} open inquiry${stats.inquiries.open > 1 ? "ies" : "y"} need to be reviewed`}
                href="/admin/inquiries"
                cta="View inquiries"
              />
            )}
          </div>
        </div>
      )}

      {/* Management sections */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ManageCard
          title="Superstars"
          icon="⭐"
          description={`${stats?.talents.published ?? "—"} live profiles. Add, edit, approve, or unpublish.`}
          href="/admin/talents"
          cta="Manage Superstars"
        />
        <ManageCard
          title="Brands"
          icon="🏢"
          description={`${stats?.brands.total ?? "—"} registered brands. View profiles and activity.`}
          href="/admin/brands"
          cta="View Brands"
        />
        <ManageCard
          title="Inquiries"
          icon="📋"
          description={`${stats?.inquiries.total ?? "—"} total. Move inquiries through the pipeline.`}
          href="/admin/inquiries"
          cta="Manage Inquiries"
        />
        <ManageCard
          title="Platform Settings"
          icon="⚙️"
          description="Configure email (Resend API key) and other platform settings."
          href="/admin/settings"
          cta="Open Settings"
        />
      </div>

      {/* Portal preview links */}
      <div className="mt-8 rounded-xl border p-5">
        <h2 className="font-semibold text-sm mb-3">Preview portals</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Navigate directly to the brand or superstar portal to see the experience as your users do.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/catalog" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            🏢 Brand portal
          </Link>
          <Link href="/superstar/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            ⭐ Superstar portal
          </Link>
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

function ActionItem({ icon, message, href, cta }: {
  icon: string; message: string; href: string; cta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-lg px-4 py-3 border">
      <p className="text-sm flex items-center gap-2">
        <span>{icon}</span> {message}
      </p>
      <Link href={href} className={cn(buttonVariants({ size: "sm" }), "shrink-0 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] border-0")}>
        {cta} →
      </Link>
    </div>
  );
}

function ManageCard({ title, icon, description, href, cta }: {
  title: string; icon: string; description: string; href: string; cta: string;
}) {
  return (
    <div className="rounded-xl border p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground flex-1">{description}</p>
      <Link href={href} className={cn(buttonVariants({ size: "sm" }), "self-start")}>
        {cta}
      </Link>
    </div>
  );
}
