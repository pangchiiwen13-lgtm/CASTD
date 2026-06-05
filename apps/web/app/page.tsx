import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-[#EBEBEB] px-6 py-4 flex items-center justify-between">
        <span className="font-display text-xl font-extrabold tracking-tight text-[#0C0C0C]">CASTD</span>
        <div className="flex gap-3">
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "text-[#0C0C0C]")}>Log in</Link>
          <Link href="/signup" className={cn(buttonVariants(), "bg-[#FFD200] text-[#0C0C0C] hover:bg-[#FFD200]/90 font-semibold")}>
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center gap-6">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[#7A7A7A] border border-[#EBEBEB] px-4 py-1.5 rounded-full">
          Beauty &amp; Lifestyle · Singapore
        </span>
        <h1 className="font-display text-5xl md:text-6xl font-extrabold tracking-tight text-[#0C0C0C] max-w-2xl leading-[1.05]">
          Find the perfect on-screen talent for your brand video.
        </h1>
        <p className="text-[#7A7A7A] text-lg max-w-xl leading-relaxed">
          CASTD connects Singapore brands and marketing agencies with vetted beauty and lifestyle
          talents. Ready for your next campaign.
        </p>
        <div className="flex flex-wrap gap-4 mt-2 justify-center">
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "bg-[#FFD200] text-[#0C0C0C] hover:bg-[#FFD200]/90 font-semibold h-12 px-8")}>
            Browse talent. It&apos;s free.
          </Link>
          <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-12 px-8 border-[#EBEBEB]")}>
            Sign in
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 flex gap-12 text-sm text-[#7A7A7A]">
          {[
            { value: "27+", label: "Vetted talents" },
            { value: "SGD 0", label: "Cost to browse" },
            { value: "SG", label: "Market focused" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-4xl font-extrabold text-[#0C0C0C] tracking-tight">{s.value}</div>
              <div className="mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* How it works — off-white panel */}
      <section className="border-t border-[#EBEBEB] bg-[#F8F7F4] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-10 text-[#0C0C0C]">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Browse", desc: "Filter talents by content type, language, vibe, and more. All profiles are free to view." },
              { step: "2", title: "Shortlist & Inquire", desc: "Save your favourites and submit a campaign brief. Free, no commitment." },
              { step: "3", title: "Confirm & Go", desc: "Found the right talent? Confirm to secure the contact. Pay only at this step." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFD200] text-[#0C0C0C] flex items-center justify-center font-bold text-sm font-display">
                  {item.step}
                </div>
                <div className="font-semibold text-[#0C0C0C]">{item.title}</div>
                <div className="text-sm text-[#7A7A7A] leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#EBEBEB] px-6 py-6 text-center text-sm text-[#7A7A7A]">
        © {new Date().getFullYear()} CASTD. Built for Singapore brands.
      </footer>
    </div>
  );
}
