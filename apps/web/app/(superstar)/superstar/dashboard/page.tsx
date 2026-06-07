"use client";
import { useEffect, useState } from "react";
import { api, Talent, SuperstarBooking } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { getPreviewMode } from "@/components/AdminPreviewBanner";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  open:       { label: "Submitted",  color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400"   },
  reviewing:  { label: "Reviewing",  color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400"  },
  confirmed:  { label: "Confirmed",  color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500"  },
  closed:     { label: "Closed",     color: "bg-[#F5F3F0] text-[#9A9A9A] border-[#E8E4E0]", dot: "bg-[#CCCCCC]"  },
};

function ProfileStatusBanner({ profile }: { profile: Talent }) {
  if (profile.is_published) return null;
  return (
    <div className="bg-white border border-[#FFD200]/40 rounded-2xl p-4 flex items-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-xl bg-[#FFFBEB] flex items-center justify-center shrink-0">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
      </div>
      <div>
        <p className="font-semibold text-sm text-[#1A1A1A]">Your profile is under review</p>
        <p className="text-sm text-[#9A9A9A] mt-0.5">
          The CASTD team will review your profile and approve it within 1-2 business days.
          You'll receive an email once you're live.
        </p>
        <Link href="/superstar/profile">
          <Button size="sm" variant="outline" className="mt-3 h-8 text-xs rounded-full">Complete your profile</Button>
        </Link>
      </div>
    </div>
  );
}

function ProfileCompleteness({ profile }: { profile: Talent }) {
  const checks = [
    { done: !!profile.bio, label: "Bio" },
    { done: (profile.photo_urls?.length || 0) >= 1, label: "Portfolio photo" },
    { done: !!profile.ig_handle, label: "Instagram handle" },
    { done: (profile.content_types?.length || 0) > 0, label: "Content types" },
    { done: (profile.vibe_tags?.length || 0) > 0, label: "Vibe tags" },
    { done: (profile.languages?.length || 0) > 0, label: "Languages" },
    { done: !!profile.experience_summary, label: "Experience" },
  ];
  const done = checks.filter(c => c.done).length;
  const pct = Math.round((done / checks.length) * 100);

  return (
    <div className="rounded-2xl bg-white border border-[#F0EDEA] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-[#1A1A1A]">Profile completeness</h3>
        <span className="text-sm font-bold text-[#1A1A1A]">{pct}%</span>
      </div>
      <div className="w-full bg-[#F0EDEA] rounded-full h-2 mb-3">
        <div className="bg-[#FFD200] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1.5">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            <span className={cn(
              "w-3 h-3 rounded-full inline-block border-2 flex-shrink-0",
              c.done ? "bg-green-500 border-green-500" : "bg-transparent border-[#DDDDDD]",
            )} />
            <span className={c.done ? "text-[#9A9A9A] line-through" : "text-[#1A1A1A]"}>{c.label}</span>
          </div>
        ))}
      </div>
      {pct < 100 && (
        <Link href="/superstar/profile">
          <Button size="sm" variant="outline" className="w-full mt-4 h-8 text-xs rounded-full">Complete profile</Button>
        </Link>
      )}
    </div>
  );
}

export default function SuperstarDashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Talent | null>(null);
  const [bookings, setBookings] = useState<SuperstarBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session) { setLoading(false); return; }
    const token = getSessionToken();
    if (!token) { setLoading(false); return; }

    Promise.all([
      api.getMySuperstarsProfile(token),
      api.getMyBookings(token),
    ])
      .then(([p, b]) => {
        setProfile(p);
        setBookings(b);
      })
      .catch((err) => {
        if (err.message?.includes("No superstar profile")) {
          if (getPreviewMode() === "superstar") {
            // Admin preview: show empty state
          } else {
            router.push("/onboarding/superstar");
          }
        }
      })
      .finally(() => setLoading(false));
  }, [session, isPending, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#9A9A9A] text-sm">Loading...</p>
      </div>
    );
  }

  if (!profile) return null;

  const activeBookings = bookings.filter(b => ["open", "reviewing", "confirmed"].includes(b.status));
  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">
          Hey, {profile.name?.split(" ")[0] || "Superstar"}
        </h1>
        <p className="text-[#9A9A9A] text-sm mt-1">
          {profile.is_published
            ? "Your profile is live. Brands can discover and book you."
            : "Your profile is pending admin approval."}
        </p>
      </div>

      <ProfileStatusBanner profile={profile} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Active bookings" value={activeBookings.length} />
        <StatCard label="IG followers" value={profile.ig_followers?.toLocaleString() || "-"} />
        <StatCard label="Rating" value={profile.rating_count ? `${profile.rating_avg}` : "-"} />
      </div>

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <div className="rounded-2xl bg-white border border-[#F0EDEA] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-[#1A1A1A]">Recent bookings</h3>
            <Link href="/superstar/bookings" className="text-xs text-[#FFD200] font-semibold hover:text-[#e6bd00]">View all</Link>
          </div>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#9A9A9A]">No bookings yet.</p>
              <Link href="/superstar/campaigns">
                <Button size="sm" variant="outline" className="mt-3 h-8 text-xs rounded-full">Browse campaigns</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map(b => {
                const meta = STATUS_META[b.status] || STATUS_META.open;
                return (
                  <div key={b.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-[#1A1A1A]">{b.campaign_name}</p>
                      <p className="text-xs text-[#9A9A9A] truncate">{b.brand_name}</p>
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

        {/* Profile completeness */}
        <ProfileCompleteness profile={profile} />
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex gap-3 flex-wrap">
        <Link href="/superstar/campaigns">
          <Button className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] rounded-full">Browse campaigns</Button>
        </Link>
        <Link href="/superstar/profile">
          <Button variant="outline" className="rounded-full">Edit profile</Button>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white border border-[#F0EDEA] p-4 text-center shadow-sm">
      <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
      <p className="text-xs text-[#9A9A9A] mt-1">{label}</p>
    </div>
  );
}
