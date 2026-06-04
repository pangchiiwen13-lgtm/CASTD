"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getSessionToken } from "@/lib/get-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-600",
};

const STATUSES = ["open", "reviewing", "confirmed", "closed"];

interface AdminInquiry {
  id: string;
  campaign_name: string;
  campaign_type?: string;
  brief_text?: string;
  budget_range?: string;
  preferred_dates?: string;
  status: string;
  created_at: string;
  company_name: string;
  talent_name: string;
  ig_handle?: string;
}

export default function AdminInquiriesPage() {
  const { data: session } = useSession();
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchAll();
  }, [session]);

  async function fetchAll() {
    const token = getSessionToken() || "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setInquiries(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function updateStatus(inquiryId: string, status: string) {
    setUpdating(inquiryId);
    const token = getSessionToken() || "";
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries/${inquiryId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setInquiries((list) =>
      list.map((i) => (i.id === inquiryId ? { ...i, status } : i))
    );
    setUpdating(null);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All brand inquiries — update status to move them through the pipeline.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>Refresh</Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">No inquiries yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="border rounded-lg px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{inq.campaign_name}</span>
                  {inq.campaign_type && (
                    <span className="text-xs text-muted-foreground">· {inq.campaign_type}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-medium text-foreground">{inq.company_name}</span>
                  {" → "}
                  <span>{inq.talent_name}</span>
                  {inq.ig_handle && <span className="text-muted-foreground"> (@{inq.ig_handle})</span>}
                </div>
                {inq.brief_text && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inq.brief_text}</p>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                  {inq.budget_range && <span>Budget: {inq.budget_range}</span>}
                  {inq.preferred_dates && <span>Dates: {inq.preferred_dates}</span>}
                  <span>{new Date(inq.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[inq.status] || ""}`}>
                  {inq.status}
                </span>
                <Select
                  value={inq.status}
                  onValueChange={(v) => updateStatus(inq.id, v)}
                  disabled={updating === inq.id}
                >
                  <SelectTrigger className="h-7 w-28 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
