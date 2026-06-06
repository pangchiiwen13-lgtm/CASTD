"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Brand Campaigns - create and manage campaign briefs.
 * Superstars can discover and apply to open campaigns.
 * Full bidirectional flow lands in Priority 2 (campaigns system build).
 */
export default function BrandCampaignsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create campaign briefs. Superstars can discover and apply to your open campaigns.
          </p>
        </div>
        <Button className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]" disabled>
          + New campaign
        </Button>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border-2 border-dashed border-[#EBEBEB] p-8 mb-8">
        <h2 className="font-semibold text-base mb-4">How campaigns work</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              step: "1",
              title: "Post your brief",
              desc: "Describe your campaign - content type, deliverables, budget, and timeline.",
            },
            {
              step: "2",
              title: "Superstars apply",
              desc: "Matching Superstars discover your brief and apply with a short note.",
            },
            {
              step: "3",
              title: "You shortlist & select",
              desc: "Review applicants alongside your own catalog searches. Pick who you want.",
            },
            {
              step: "4",
              title: "Platform handles the rest",
              desc: "CASTD manages confirmation, remuneration, deliverables, and ratings.",
            },
          ].map((s) => (
            <div key={s.step} className="flex gap-3 p-4 rounded-xl bg-muted/40">
              <span className="text-2xl font-bold text-primary leading-none">{s.step}</span>
              <div>
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="rounded-2xl border-2 border-dashed border-[#EBEBEB] py-16 px-8 text-center">
        <p className="text-5xl mb-4">🎬</p>
        <h2 className="text-xl font-semibold mb-2">Campaign briefs launching soon</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
          In the meantime, browse the catalog and submit inquiries directly to Superstars
          you want for your campaign.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/catalog">
            <Button className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]">Browse catalog</Button>
          </Link>
          <Link href="/inquiries">
            <Button variant="outline">View my inquiries</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
