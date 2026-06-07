"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getSessionToken } from "@/lib/get-token";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const API = process.env.NEXT_PUBLIC_API_URL;

const INDUSTRIES = ["Beauty", "Skincare", "Fashion", "Wellness", "Food & Beverage", "Lifestyle", "Tech", "Finance", "Other"];
const CAMPAIGN_TYPES = ["Brand awareness", "Product launch", "Social media content", "Event coverage", "Tutorial", "Testimonial"];

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

const emptyForm = { company_name: "", industry: "", campaign_type: "", email: "" };

export default function AdminBrandsPage() {
  const { data: session } = useSession();
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Add / Edit dialog
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminBrand | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<AdminBrand | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchAll();
  }, [session]);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/brands/admin/all`, {
        headers: { Authorization: `Bearer ${getSessionToken()}` },
      });
      const data = await res.json();
      setBrands(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(brand: AdminBrand) {
    setEditing(brand);
    setForm({
      company_name: brand.company_name,
      industry: brand.industry || "",
      campaign_type: brand.campaign_type || "",
      email: brand.email || "",
    });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.company_name.trim()) { setFormError("Company name is required"); return; }
    setSaving(true);
    setFormError("");
    const token = getSessionToken() || "";
    try {
      if (editing) {
        const res = await fetch(`${API}/brands/admin/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            company_name: form.company_name,
            ...(form.industry && { industry: form.industry }),
            ...(form.campaign_type && { campaign_type: form.campaign_type }),
          }),
        });
        if (!res.ok) throw new Error("Update failed");
        setBrands(list => list.map(b => b.id === editing.id
          ? { ...b, company_name: form.company_name, industry: form.industry || undefined, campaign_type: form.campaign_type || undefined }
          : b
        ));
      } else {
        const res = await fetch(`${API}/brands/admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            company_name: form.company_name,
            ...(form.industry && { industry: form.industry }),
            ...(form.campaign_type && { campaign_type: form.campaign_type }),
            ...(form.email && { email: form.email }),
          }),
        });
        if (!res.ok) throw new Error("Create failed");
        await fetchAll();
      }
      setShowForm(false);
    } catch (e: any) {
      setFormError(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    const token = getSessionToken() || "";
    try {
      await fetch(`${API}/brands/admin/${confirmDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setBrands(list => list.filter(b => b.id !== confirmDelete.id));
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

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
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 text-sm w-48"
          />
          <Button size="sm" onClick={openAdd}>+ Add brand</Button>
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
              <div className="px-5 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#0C0C0C] flex items-center justify-center shrink-0">
                  <span className="text-[#FFD200] text-sm font-bold">
                    {brand.company_name.slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => setExpanded(expanded === brand.id ? null : brand.id)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{brand.company_name}</span>
                    {brand.industry && <span className="text-xs text-muted-foreground">{brand.industry}</span>}
                    <Badge variant="outline" className={`text-xs ${PLAN_COLORS[brand.plan_tier] || PLAN_COLORS.free}`}>
                      {brand.plan_tier || "free"}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-3">
                    {brand.email && <span>{brand.email}</span>}
                    <span>{brand.inquiry_count} inquir{brand.inquiry_count === 1 ? "y" : "ies"}</span>
                    {brand.confirmed_count > 0 && <span className="text-green-600">{brand.confirmed_count} confirmed</span>}
                    <span>Joined {new Date(brand.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(brand)} className="h-7 px-2 text-xs">Edit</Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setConfirmDelete(brand)}
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === brand.id && (
                <div className="px-5 pb-5 pt-2 border-t bg-muted/20">
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <DetailItem label="Brand ID" value={brand.id} mono />
                    <DetailItem label="User ID" value={brand.user_id} mono />
                    <DetailItem label="Campaign type" value={brand.campaign_type || "-"} />
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

      {/* Add / Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit brand" : "Add brand"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Company name *</Label>
              <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="e.g. Glow Republic" />
            </div>
            {!editing && (
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@brand.com" />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={v => v && setForm(f => ({ ...f, industry: v }))}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Campaign type</Label>
              <Select value={form.campaign_type} onValueChange={v => v && setForm(f => ({ ...f, campaign_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Select campaign type" /></SelectTrigger>
                <SelectContent>{CAMPAIGN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Create brand"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete brand?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently delete <strong>{confirmDelete?.company_name}</strong> and all their data. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
