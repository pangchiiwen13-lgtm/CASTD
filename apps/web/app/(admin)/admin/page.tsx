"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";
import { cn } from "@/lib/utils";

interface Stats {
  talents: { total: number; published: number; draft: number };
  brands: { total: number };
  inquiries: { total: number; open: number; confirmed: number };
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const token = getSessionToken() || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    })();
  }, [session]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-8">CASTD platform overview.</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Talents", value: stats?.talents.total, sub: `${stats?.talents.published ?? 0} published` },
          { label: "Drafts", value: stats?.talents.draft, sub: "unpublished" },
          { label: "Brands", value: stats?.brands.total, sub: "signed up" },
          { label: "Inquiries", value: stats?.inquiries.total, sub: `${stats?.inquiries.open ?? 0} open` },
        ].map((s) => (
          <div key={s.label} className="border rounded-lg px-4 py-3">
            {stats ? (
              <>
                <div className="text-3xl font-bold">{s.value ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                <div className="text-xs text-muted-foreground">{s.sub}</div>
              </>
            ) : (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Talents</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Add, edit, and publish talent profiles.</p>
            <div className="flex gap-2">
              <Link href="/admin/talents" className={cn(buttonVariants({ size: "sm" }))}>Manage talents</Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Inquiries</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Review inquiries and move them through the pipeline.
              {stats?.inquiries.open ? (
                <span className="ml-1 font-medium text-foreground">{stats.inquiries.open} open.</span>
              ) : null}
            </p>
            <Link href="/admin/inquiries" className={cn(buttonVariants({ size: "sm" }))}>View inquiries</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
