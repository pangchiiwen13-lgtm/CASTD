import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">CASTD</span>
        <div className="flex gap-3">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>Log in</Link>
          <Link href="/signup" className={cn(buttonVariants())}>Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center gap-6">
        <Badge variant="secondary">Beauty & Lifestyle · Singapore</Badge>
        <h1 className="text-5xl font-bold tracking-tight max-w-2xl leading-tight">
          Find the perfect on-screen talent for your brand video.
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          CASTD connects Singapore brands and marketing agencies with vetted beauty and lifestyle
          talents — ready for your next campaign.
        </p>
        <div className="flex gap-4 mt-2">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>Browse talent — it&apos;s free</Link>
          <Link href="/catalog" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>View catalog</Link>
        </div>

        <div className="mt-16 flex gap-8 text-sm text-muted-foreground">
          {[
            { value: "27+", label: "Vetted talents" },
            { value: "SGD 0", label: "Cost to browse" },
            { value: "SG", label: "Market focused" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-foreground">{s.value}</div>
              <div>{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* How it works */}
      <section className="border-t px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Browse", desc: "Filter talents by content type, language, vibe, and more. All profiles are free to view." },
              { step: "2", title: "Shortlist & Inquire", desc: "Save your favourites and submit a campaign brief — completely free, no commitment." },
              { step: "3", title: "Confirm & Go", desc: "Found the right talent? Confirm to secure the contact. Pay only at this step." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {item.step}
                </div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} CASTD. Built for Singapore brands.
      </footer>
    </div>
  );
}
