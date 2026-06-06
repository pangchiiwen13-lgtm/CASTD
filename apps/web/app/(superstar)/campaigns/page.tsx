"use client";

/**
 * Superstar Campaigns feed — browse open brand campaigns and apply.
 * The campaigns system (DB + API) is built in Priority 2.
 * This is a placeholder that shows the intended UI.
 */
export default function SuperstarCampaignsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Open Campaigns</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse campaigns from brands looking for Superstars. Apply to campaigns that fit your style.
        </p>
      </div>

      {/* Coming soon state */}
      <div className="rounded-2xl border-2 border-dashed border-[#EBEBEB] py-20 px-8 text-center">
        <p className="text-5xl mb-4">🎬</p>
        <h2 className="text-xl font-semibold mb-2">Campaigns launching soon</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          Brands will post campaigns here. You'll be able to browse, filter by content type and budget,
          and apply with a short note about why you're a great fit.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <p>What you'll be able to do:</p>
          <ul className="text-left space-y-1 mt-2">
            <li>✅ Browse open brand campaigns</li>
            <li>✅ Filter by content type, budget, remuneration</li>
            <li>✅ Apply with a short note</li>
            <li>✅ Track your application status</li>
            <li>✅ Get notified when you're shortlisted or selected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
