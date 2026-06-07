"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { api, type BrandProject } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type OpenProject = BrandProject & { company_name: string; active_hires: number };

export default function SuperstarDiscoverPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<OpenProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<OpenProject | null>(null);

  useEffect(() => {
    if (!isPending && !session) { router.push("/login"); return; }
    if (session) {
      const token = getSessionToken() || "";
      api.getOpenProjects(token)
        .then(p => setProjects(p as OpenProject[]))
        .catch(() => null)
        .finally(() => setLoading(false));
    }
  }, [session, isPending]);

  function onApplied(projectId: string) {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setApplying(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Discover Campaigns</h1>
        <p className="text-sm text-[#9A9A9A] mt-1">Brands looking for Superstars. Apply to campaigns that fit your vibe.</p>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F0EDEA] py-16 px-8 text-center shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F3F0] mx-auto mb-3 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full border-2 border-[#CCCCCC]" />
          </div>
          <p className="text-sm text-[#9A9A9A]">No open campaigns right now. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="rounded-2xl bg-white border border-[#F0EDEA] px-5 py-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-[#1A1A1A]">{p.name}</h3>
                    {p.campaign_type && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5F3F0] text-[#6A6A6A] font-medium">{p.campaign_type}</span>
                    )}
                  </div>
                  <p className="text-xs text-[#9A9A9A] mb-2">
                    by <span className="font-medium text-[#6A6A6A]">{p.company_name}</span>
                    {p.shoot_date && <span> - Shoot: {p.shoot_date}</span>}
                    {p.budget_range && <span> - Budget: {p.budget_range}</span>}
                  </p>
                  {p.brief_text && <p className="text-xs text-[#6A6A6A] leading-relaxed line-clamp-3">{p.brief_text}</p>}
                  {p.deliverables && (
                    <p className="text-xs text-[#9A9A9A] mt-1.5">
                      <span className="font-medium text-[#6A6A6A]">Deliverables:</span> {p.deliverables}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] shrink-0 rounded-full font-semibold"
                  onClick={() => setApplying(p)}
                >
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {applying && (
        <ApplyDialog
          project={applying}
          onClose={() => setApplying(null)}
          onApplied={() => onApplied(applying.id)}
        />
      )}
    </div>
  );
}

function ApplyDialog({ project, onClose, onApplied }: {
  project: OpenProject;
  onClose: () => void;
  onApplied: () => void;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setLoading(true); setError("");
    try {
      const token = getSessionToken() || "";
      await api.applyToProject(project.id, note.trim() || undefined, token);
      onApplied();
    } catch (e: any) {
      setError(e.message || "Failed to apply");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply to {project.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            by {project.company_name}
            {project.brief_text && <span className="block mt-1 text-xs">{project.brief_text}</span>}
          </p>
          <div className="grid gap-1">
            <label className="text-sm font-medium">Message to brand (optional)</label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Introduce yourself and explain why you are a great fit..."
              rows={4}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            The brand will review your profile and application. You will be notified when they respond.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
          >
            {loading ? "Sending..." : "Send application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
