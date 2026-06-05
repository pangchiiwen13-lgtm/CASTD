"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getSessionToken } from "@/lib/get-token";
import { type Talent } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminTalentsPage() {
  const { data: session } = useSession();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Talent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Talent | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchAll();
  }, [session]);

  async function fetchAll() {
    const token = getSessionToken() || "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/talents/admin/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setTalents(data);
    setLoading(false);
  }

  async function togglePublish(talent: Talent) {
    const token = getSessionToken() || "";
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/talents/${talent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_published: !talent.is_published }),
    });
    setTalents((list) =>
      list.map((t) => t.id === talent.id ? { ...t, is_published: !t.is_published } : t)
    );
  }

  async function deleteTalent(talent: Talent) {
    setDeleting(true);
    const token = getSessionToken() || "";
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/talents/${talent.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setTalents((list) => list.filter((t) => t.id !== talent.id));
    setConfirmDelete(null);
    setDeleting(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Talents</h1>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>+ Add talent</Button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded" />)}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {talents.map((t) => (
            <div key={t.id} className="flex items-center gap-4 border rounded-lg px-4 py-3">
              {t.photo_urls?.[0] ? (
                <img src={t.photo_urls[0]} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm">{t.name.slice(0, 1)}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">@{t.ig_username}</div>
              </div>
              <div className="flex flex-wrap gap-1 max-w-48">
                {t.content_types?.slice(0, 2).map((c) => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
              </div>
              <Badge variant={t.is_published ? "default" : "secondary"} className="shrink-0">
                {t.is_published ? "Published" : "Draft"}
              </Badge>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => { setEditing(t); setShowForm(true); }}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => togglePublish(t)}>
                  {t.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmDelete(t)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TalentForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchAll(); }}
          getToken={() => Promise.resolve(getSessionToken() || "")}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <Dialog open onOpenChange={() => setConfirmDelete(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Delete talent?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground py-2">
              This will permanently delete <span className="font-semibold text-foreground">{confirmDelete.name}</span> and cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteTalent(confirmDelete)} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TalentForm({ initial, onClose, onSaved, getToken }: {
  initial: Talent | null;
  onClose: () => void;
  onSaved: () => void;
  getToken: () => Promise<string>;
}) {
  const [form, setForm] = useState({
    ig_username: initial?.ig_username || "",
    name: initial?.name || "",
    email: initial?.email || "",
    age: initial?.age?.toString() || "",
    gender: initial?.gender || "",
    languages: initial?.languages?.join(", ") || "",
    content_types: initial?.content_types?.join(", ") || "",
    vibe_tags: initial?.vibe_tags?.join(", ") || "",
    ig_handle: initial?.ig_handle || "",
    tiktok_handle: initial?.tiktok_handle || "",
    ig_followers: initial?.ig_followers?.toString() || "0",
    tiktok_followers: initial?.tiktok_followers?.toString() || "0",
    bio: initial?.bio || "",
    experience_summary: initial?.experience_summary || "",
    photo_urls: initial?.photo_urls?.join("\n") || "",
    intro_video_url: initial?.intro_video_url || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!form.ig_username || !form.name) { setError("Username and name are required"); return; }
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const body = {
        ig_username: form.ig_username,
        name: form.name,
        email: form.email || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        content_types: form.content_types.split(",").map((s) => s.trim()).filter(Boolean),
        vibe_tags: form.vibe_tags.split(",").map((s) => s.trim()).filter(Boolean),
        ig_handle: form.ig_handle || undefined,
        tiktok_handle: form.tiktok_handle || undefined,
        ig_followers: parseInt(form.ig_followers) || 0,
        tiktok_followers: parseInt(form.tiktok_followers) || 0,
        bio: form.bio || undefined,
        experience_summary: form.experience_summary || undefined,
        photo_urls: form.photo_urls.split("\n").map((s) => s.trim()).filter(Boolean),
        intro_video_url: form.intro_video_url || undefined,
      };

      const url = `${process.env.NEXT_PUBLIC_API_URL}/talents${initial ? `/${initial.id}` : ""}`;
      await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      onSaved();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit talent" : "Add talent"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="grid gap-1">
            <Label>IG username *</Label>
            <Input value={form.ig_username} onChange={set("ig_username")} placeholder="handle" />
          </div>
          <div className="grid gap-1">
            <Label>Full name *</Label>
            <Input value={form.name} onChange={set("name")} placeholder="Name" />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Email <span className="text-muted-foreground font-normal">(for booking notifications)</span></Label>
            <Input type="email" value={form.email} onChange={set("email")} placeholder="talent@email.com" />
          </div>
          <div className="grid gap-1">
            <Label>Age</Label>
            <Input type="number" value={form.age} onChange={set("age")} />
          </div>
          <div className="grid gap-1">
            <Label>Gender</Label>
            <Input value={form.gender} onChange={set("gender")} placeholder="Female / Male / ..." />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Languages (comma-separated)</Label>
            <Input value={form.languages} onChange={set("languages")} placeholder="English, Mandarin" />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Content types (comma-separated)</Label>
            <Input value={form.content_types} onChange={set("content_types")} placeholder="Beauty, Lifestyle" />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Vibe tags (comma-separated)</Label>
            <Input value={form.vibe_tags} onChange={set("vibe_tags")} placeholder="Soft, Minimal, Natural" />
          </div>
          <div className="grid gap-1">
            <Label>IG handle</Label>
            <Input value={form.ig_handle} onChange={set("ig_handle")} placeholder="@handle" />
          </div>
          <div className="grid gap-1">
            <Label>TikTok handle</Label>
            <Input value={form.tiktok_handle} onChange={set("tiktok_handle")} placeholder="@handle" />
          </div>
          <div className="grid gap-1">
            <Label>IG followers</Label>
            <Input type="number" value={form.ig_followers} onChange={set("ig_followers")} />
          </div>
          <div className="grid gap-1">
            <Label>TikTok followers</Label>
            <Input type="number" value={form.tiktok_followers} onChange={set("tiktok_followers")} />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={set("bio")} rows={2} />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Experience summary</Label>
            <Textarea value={form.experience_summary} onChange={set("experience_summary")} rows={2} />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Photo URLs (one per line)</Label>
            <Textarea value={form.photo_urls} onChange={set("photo_urls")} rows={3} placeholder="https://..." />
          </div>
          <div className="grid gap-1 col-span-2">
            <Label>Intro video URL</Label>
            <Input value={form.intro_video_url} onChange={set("intro_video_url")} placeholder="https://..." />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
