"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { api, type Brand, type Inquiry } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  open:      { label: "Submitted",  color: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-400"   },
  reviewing: { label: "Reviewing",  color: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-400"  },
  confirmed: { label: "Confirmed",  color: "bg-green-50 text-green-700 border-green-200",     dot: "bg-green-500"  },
  closed:    { label: "Closed",     color: "bg-[#F5F3F0] text-[#9A9A9A] border-[#E8E4E0]",   dot: "bg-[#CCCCCC]"  },
};

export default function BrandDashboardPage() {
  const { data: session, isPending } = useSession();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
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
      <p className="text-[#9A9A9A] text-sm">Loading...</p>
    </div>
  );

  const activeInquiries   = inquiries.filter(i => ["open", "reviewing"].includes(i.status));
  const confirmedInquiries = inquiries.filter(i => i.status === "confirmed");
  const pendingConfirm    = inquiries.filter(i => i.status === "reviewing");
  const recentInquiries   = inquiries.slice(0, 5);
  const companyName = brand?.company_name || session?.user?.name || "there";

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Hey, {companyName}</h1>
        <p className="text-[#9A9A9A] text-sm mt-1">Here's a snapshot of your activity on CASTD.</p>
      </div>

      {/* No brand profile banner */}
      {!brand && (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-[#FFD200]/60 bg-white p-5 flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-[#FFD200] flex items-center justify-center shrink-0">
            <span className="text-[#0C0C0C] text-sm font-bold">+</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-[#1A1A1A]">Complete your brand profile</p>
            <p className="text-sm text-[#9A9A9A] mt-0.5">
              Tell us about your brand to unlock AI-matched talent recommendations.
            </p>
            <Link href="/settings">
              <Button size="sm" className="mt-3 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full">
                Set up profile
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
        <div className="rounded-2xl border border-[#FFD200]/40 bg-white p-5 mb-6">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2 text-[#1A1A1A]">
            <span className="w-2 h-2 rounded-full bg-[#FFD200] inline-block animate-pulse" />
            Action required
          </h2>
          <div className="space-y-2">
            {pendingConfirm.map(inq => (
              <div key={inq.id} className="flex items-center justify-between gap-4 bg-[#FFFBEB] rounded-xl px-4 py-3 border border-[#FFD200]/20">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-[#1A1A1A]">{inq.campaign_name}</p>
                  <p className="text-xs text-[#9A9A9A]">Ready to confirm - move forward when you're ready</p>
                </div>
                <Link href="/inquiries">
                  <Button size="sm" className="shrink-0 h-8 text-xs bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full">
                    Review
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
        <div className="rounded-2xl bg-white border border-[#F0EDEA] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-[#1A1A1A]">Recent inquiries</h2>
            <Link href="/inquiries" className="text-xs text-[#FFD200] font-semibold hover:text-[#e6bd00]">View all</Link>
          </div>
          {recentInquiries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#9A9A9A]">No inquiries yet.</p>
              <Link href="/catalog">
                <Button size="sm" variant="outline" className="mt-3 h-8 text-xs rounded-full">Browse catalog</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map(inq => {
                const meta = STATUS_META[inq.status] || STATUS_META.open;
                return (
                  <div key={inq.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-[#1A1A1A]">{inq.campaign_name}</p>
                      <p className="text-xs text-[#9A9A9A]">
                        {new Date(inq.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border font-medium inline-flex items-center gap-1 ${meta.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-2xl bg-white border border-[#F0EDEA] p-5 shadow-sm flex flex-col gap-2">
          <h2 className="font-semibold text-sm mb-1 text-[#1A1A1A]">Quick actions</h2>
          <QuickAction href="/catalog"    title="Browse catalog"   desc="Discover Superstars for your next campaign" />
          <QuickAction href="/shortlist"  title="My shortlist"     desc={`${shortlistCount} Superstar${shortlistCount !== 1 ? "s" : ""} saved`} />
          <QuickAction href="/campaigns"  title="Campaigns"        desc="Create and manage your campaign briefs" />
          <QuickAction href="/settings"   title="Brand profile"    desc="Update your preferences for better AI matching" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white border border-[#F0EDEA] p-4 text-center shadow-sm">
      <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
      <p className="text-xs text-[#9A9A9A] mt-1">{label}</p>
    </div>
  );
}

function QuickAction({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-[#FFF8EC] transition-colors group">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#1A1A1A]">{title}</p>
        <p className="text-xs text-[#9A9A9A] truncate">{desc}</p>
      </div>
      <span className="text-[#CCCCCC] text-xs shrink-0 group-hover:text-[#FFD200] transition-colors">&#8594;</span>
    </Link>
  );
}
