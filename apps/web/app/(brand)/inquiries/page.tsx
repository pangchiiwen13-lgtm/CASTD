"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type Inquiry } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionToken } from "@/lib/get-token";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

export default function InquiriesPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (!session) return;
    (async () => {
      setInquiries(await api.getInquiries(getSessionToken() || ""));
      setLoading(false);
    })();
  }, [session, isPending]);

  async function handleConfirm(inquiryId: string) {
    const result = await api.createCheckout(inquiryId, getSessionToken() || "");
    if (result.checkout_url) { window.location.href = result.checkout_url; }
    else if (result.confirmed) {
      setInquiries(list => list.map(i => i.id === inquiryId ? { ...i, status: "confirmed" } : i));
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">My Inquiries</h1>
      <p className="text-sm text-muted-foreground mb-6">Track your campaign submissions. Confirm a talent when you're ready to proceed.</p>
      {loading ? (
        <div className="flex flex-col gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">No inquiries yet. Browse the catalog and send one.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {inquiries.map(inquiry => (
            <Card key={inquiry.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{inquiry.campaign_name}</div>
                  <div className="text-sm text-muted-foreground">{inquiry.campaign_type}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inquiry.status] || ""}`}>{inquiry.status}</span>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {inquiry.brief_text && <p className="text-sm text-muted-foreground line-clamp-2">{inquiry.brief_text}</p>}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {inquiry.budget_range && <span>Budget: {inquiry.budget_range}</span>}
                  {inquiry.preferred_dates && <span>Dates: {inquiry.preferred_dates}</span>}
                </div>
                {inquiry.status === "reviewing" && (
                  <Button size="sm" className="mt-2 self-start" onClick={() => handleConfirm(inquiry.id)}>Confirm this talent →</Button>
                )}
                {inquiry.status === "confirmed" && (
                  <p className="text-sm text-green-700 font-medium mt-1">Talent confirmed — we'll be in touch shortly.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
