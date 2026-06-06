"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { api, type Brand, type Inquiry } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  open:      { label: "Submitted",  color: "bg-blue-50 text-blue-700 border-blue-200",      icon: "📋" },
  reviewing: { label: "Reviewing",  color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "🔍" },
  confirmed: { label: "Confirmed",  color: "bg-green-50 text-green-700 border-green-200",    icon: "✅" },
  closed:    { label: "Closed",     color: "bg-gray-50 text-gray-500 border-gray-200",        icon: "🚫" },
};

export default function BrandDashboardPage() {
  const { data: session, isPending } = useSession();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for session to resolve before deciding what to do
    if (isPending) return;
    // If no session after resolving, stop loading (layout will redirect)
    if (!session) { setLoading(false); return; }

    const token = getSessionToken();
    if (!token) { setLoading(false); return; }

    Promise.all([
      api.getMyBrand(token).catch(() => null),
      api.getInquiries(token).catch(() => []),
      api.getShortlist(token).catch(() => []),
    ]).then(([b, inqs, shortlist]) => {
      setBrand(b);
      setInquiries(inqs);
      setShortlistCount(shortlist.length);
    }).finally(() => setLoading(false));
  }, [session, isPending]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-muted-foreground text-sm">Loading…</p>
    </div>
  );

  const activeInquiries = inquiries.filter(i => ["open", "reviewing"].includes(i.status));
  const confirmedInquiries = inquiries.filter(i => i.status === "confirmed");
  const pendingConfirm = inquiries.filter(i => i.status === "reviewing");
  const recentInquiries = inquiries.slice(0, 5);

  const companyName = brand?.company_name || session?.user?.name || "there";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Hey, {companyName} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's a snapshot of your activity on CASTD.
        </p>
      </div>

      {/* No brand profile banner */}
      {!brand && (
        <div className="mb-6 rounded-xl border-2 border-dashed border-[#FFD200]/60 bg-[#FFFBEB] p-5 flex items-start gap-4">
          <span className="text-2xl">✨</span>
          <div>
            <p className="font-semibold text-sm">Complete your brand profile</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tell us about your brand to unlock AI-matched talent recommendations.
            </p>
            <Link href="/settings">
              <Button size="sm" className="mt-3 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">
                Set up profile →
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard value={activeInquiries.length} label="Active inquiries" />
        <StatCard value={confirmedInquiries.length} label="Confirmed bookings" />
        <StatCard value={shortlistCount} label="Shortlisted" />
      </div>

      {/* Pending actions */}
      {pendingConfirm.length > 0 && (
        <div className="rounded-xl border border-[#FFD200]/40 bg-[#FFFBEB] p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <span>⚡</span> Action required
          </h2>
          <div className="space-y-2">
            {pendingConfirm.map(inq => (
              <div key={inq.id} className="flex items-center justify-between gap-4 bg-white rounded-lg px-4 py-3 border">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inq.campaign_name}</p>
                  <p className="text-xs text-muted-foreground">Ready to confirm - move forward when you're ready</p>
                </div>
                <Link href="/inquiries">
                  <Button size="sm" className="shrink-0 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">
                    Review →
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent inquiries */}
        <div className="rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent inquiries</h2>
            <Link href="/inquiries" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No inquiries yet.</p>
              <Link href="/catalog">
                <Button size="sm" variant="outline" className="mt-3 h-8 text-xs">Browse catalog →</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map(inq => {
                const meta = STATUS_META[inq.status] || STATUS_META.open;
                return (
                  <div key={inq.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{inq.campaign_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inq.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium ${meta.color}`}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-sm mb-1">Quick actions</h2>
          <QuickAction href="/catalog" icon="🔍" title="Browse catalog" desc="Discover Superstars for your next campaign" />
          <QuickAction href="/shortlist" icon="❤️" title="My shortlist" desc={`${shortlistCount} Superstar${shortlistCount !== 1 ? "s" : ""} saved`} />
          <QuickAction href="/campaigns" icon="🎬" title="Campaigns" desc="Create and manage your campaign briefs" />
          <QuickAction href="/settings" icon="⚙️" title="Brand profile" desc="Update your preferences for better AI matching" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border p-4 text-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group">
      <span className="text-xl">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-medium group-hover:text-primary transition-colors">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>
      <span className="ml-auto text-muted-foreground text-xs">→</span>
    </Link>
  );
}
