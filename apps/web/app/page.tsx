"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TICKER_ITEMS = [
  "Beauty", "Skincare", "Lifestyle", "Fashion",
  "Food & Beverage", "Wellness", "GRWM", "UGC",
  "Product Demo", "Brand Story", "Testimonial", "OOTD",
];

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function LandingPage() {
  useScrollReveal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#EBEBEB] shadow-sm"
            : "bg-transparent"
        )}
      >
        <span
          className={cn(
            "font-display text-xl font-extrabold tracking-tight transition-colors duration-300",
            scrolled ? "text-[#0C0C0C]" : "text-white"
          )}
        >
          CASTD
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200",
              scrolled
                ? "text-[#0C0C0C] hover:bg-[#F8F7F4]"
                : "text-white/70 hover:text-white"
            )}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold px-5 py-2.5 rounded-full bg-[#FFD200] text-[#0C0C0C] hover:bg-white transition-colors duration-200"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-[#0C0C0C] flex flex-col items-center justify-center px-6 text-center overflow-hidden">

        {/* Grain texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
          }}
        />
        {/* Yellow ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FFD200] opacity-[0.05] rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Eyebrow badge */}
          <div
            className="inline-flex items-center gap-2.5 mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/40 text-xs tracking-widest uppercase"
            style={{ animation: "fadeUp 0.9s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200] shrink-0" />
            Beauty &amp; Lifestyle · Singapore
          </div>

          {/* Headline */}
          <h1
            className="font-display text-6xl sm:text-7xl md:text-8xl font-extrabold text-white tracking-tight leading-[0.92] mb-8"
            style={{ animation: "fadeUp 0.9s 0.08s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            Cast exactly
            <br />
            <span className="text-[#FFD200]">who you need.</span>
          </h1>

          {/* Sub */}
          <p
            className="text-white/45 text-lg md:text-xl max-w-lg mx-auto leading-relaxed mb-10"
            style={{ animation: "fadeUp 0.9s 0.16s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            Singapore's marketplace connecting beauty and lifestyle brands with
            vetted on-screen talent - free to browse, pay only at confirmation.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-wrap gap-4 justify-center"
            style={{ animation: "fadeUp 0.9s 0.24s cubic-bezier(0.16,1,0.3,1) both" }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FFD200] text-[#0C0C0C] font-semibold text-sm hover:bg-white transition-colors duration-200"
            >
              Browse talent free →
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-white/60 text-sm hover:border-white/25 hover:text-white transition-all duration-200"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Scroll cue */}
        <div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ animation: "fadeIn 1.2s 1.2s both" }}
        >
          <div className="w-px h-14 bg-gradient-to-b from-transparent via-white/20 to-white/10" />
          <span className="text-white/20 text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        </div>
      </section>

      {/* ── MARQUEE TICKER ──────────────────────────────────────────────── */}
      <div className="bg-[#FFD200] py-3.5 overflow-hidden select-none border-y border-[#0C0C0C]/8">
        <div
          className="flex whitespace-nowrap"
          style={{ animation: "marqueeLeft 28s linear infinite" }}
        >
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {TICKER_ITEMS.map((item, i) => (
                <span
                  key={`${copy}-${i}`}
                  className="inline-flex items-center gap-5 px-8 font-display font-bold text-[#0C0C0C] text-sm uppercase tracking-widest"
                >
                  {item}
                  <span className="text-[#0C0C0C]/25 text-[10px]">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EBEBEB] border border-[#EBEBEB]">
            {[
              { value: "27+", label: "Vetted Superstars", sub: "beauty & lifestyle creators" },
              { value: "SGD 0", label: "Cost to browse", sub: "pay only when you confirm" },
              { value: "100%", label: "Singapore-focused", sub: "brands, agencies, creators" },
            ].map((s, i) => (
              <div
                key={i}
                className="reveal bg-white px-10 py-12 group hover:bg-[#F8F7F4] transition-colors duration-300"
                data-reveal="true"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="font-display text-5xl md:text-6xl font-extrabold text-[#0C0C0C] tracking-tight">
                  {s.value}
                </div>
                <div className="font-semibold text-[#0C0C0C] mt-4 mb-1 text-base">{s.label}</div>
                <div className="text-sm text-[#7A7A7A]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="bg-[#F8F7F4] border-y border-[#EBEBEB] px-6 py-24">
        <div className="max-w-5xl mx-auto">

          <div className="mb-16 reveal" data-reveal="true">
            <span className="text-[10px] text-[#7A7A7A] tracking-[0.2em] uppercase font-semibold">
              Process
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#0C0C0C] mt-4 leading-[0.95] tracking-tight">
              Three steps.<br />Zero guesswork.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                n: "01",
                title: "Browse free",
                desc: "Filter 27+ profiles by content type, language, vibe, and follower count. Every profile is visible - no paywalls, no credits.",
              },
              {
                n: "02",
                title: "Shortlist & inquire",
                desc: "Save your picks to a casting board. Submit a campaign brief with dates, deliverables, and budget. Still completely free.",
              },
              {
                n: "03",
                title: "Confirm & go",
                desc: "Found the right fit? Confirm the talent and pay the one-time contact fee. Platform handles everything after.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className="reveal"
                data-reveal="true"
                style={{ transitionDelay: `${0.1 + i * 0.12}s` }}
              >
                <div className="font-display text-7xl font-extrabold text-[#E0E0E0] leading-none mb-6 select-none">
                  {s.n}
                </div>
                <div className="font-display text-xl font-bold text-[#0C0C0C] mb-3">{s.title}</div>
                <div className="text-[#7A7A7A] text-sm leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR BRANDS / FOR SUPERSTARS ─────────────────────────────────── */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16 reveal" data-reveal="true">
            <span className="text-[10px] text-[#7A7A7A] tracking-[0.2em] uppercase font-semibold">
              Who it's for
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#0C0C0C] mt-4 leading-[0.95] tracking-tight">
              One platform.<br />Both sides.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">

            {/* Brands */}
            <div
              className="reveal bg-[#0C0C0C] rounded-2xl p-10 flex flex-col"
              data-reveal="true"
            >
              <span className="inline-block text-[#FFD200] text-[10px] tracking-[0.2em] uppercase font-semibold mb-8">
                For Brands &amp; Agencies
              </span>
              <h3 className="font-display text-3xl font-extrabold text-white mb-6 leading-tight">
                Find the right talent.<br />Faster.
              </h3>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Search 27+ vetted creator profiles",
                  "Filter by language, vibe, content type",
                  "Submit unlimited free inquiries",
                  "AI-matched fit score per talent",
                  "Confirm & secure - pay only here",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/55">
                    <span className="mt-0.5 text-[#FFD200] shrink-0 text-[10px]">✦</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="self-start inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFD200] text-[#0C0C0C] font-semibold text-sm hover:bg-white transition-colors"
              >
                Browse catalog →
              </Link>
            </div>

            {/* Superstars */}
            <div
              className="reveal bg-[#F8F7F4] border border-[#EBEBEB] rounded-2xl p-10 flex flex-col"
              data-reveal="true"
              style={{ transitionDelay: "0.12s" }}
            >
              <span className="inline-block text-[#7A7A7A] text-[10px] tracking-[0.2em] uppercase font-semibold mb-8">
                For Superstars
              </span>
              <h3 className="font-display text-3xl font-extrabold text-[#0C0C0C] mb-6 leading-tight">
                Get discovered.<br />Get booked.
              </h3>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Build your free Superstar profile",
                  "Get discovered by Singapore brands",
                  "Set cash, product, or hybrid rates",
                  "Manage bookings in one dashboard",
                  "Build your collab portfolio",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[#7A7A7A]">
                    <span className="mt-0.5 text-[#0C0C0C] shrink-0 text-[10px]">✦</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="self-start inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0C0C0C] text-white font-semibold text-sm hover:bg-[#2A2A2A] transition-colors"
              >
                Join as Superstar →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="bg-[#FFD200] px-6 py-28">
        <div
          className="max-w-3xl mx-auto text-center reveal"
          data-reveal="true"
        >
          <h2 className="font-display text-5xl md:text-6xl font-extrabold text-[#0C0C0C] tracking-tight leading-[0.93] mb-6">
            Your next campaign<br />starts here.
          </h2>
          <p className="text-[#0C0C0C]/55 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Browse free. Inquire free. Pay only when you've found exactly who you need.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#0C0C0C] text-[#FFD200] font-semibold text-sm hover:bg-[#2A2A2A] transition-colors duration-200"
          >
            Get started - it's free →
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#0C0C0C] px-6 md:px-10 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <span className="font-display text-lg font-extrabold text-white tracking-tight">CASTD</span>
        <div className="flex gap-8 text-sm text-white/25">
          <Link href="/login" className="hover:text-white/60 transition-colors">Log in</Link>
          <Link href="/signup" className="hover:text-white/60 transition-colors">Get started</Link>
        </div>
        <p className="text-white/20 text-xs tracking-wide">
          © {new Date().getFullYear()} CASTD. Singapore.
        </p>
      </footer>
    </div>
  );
}
