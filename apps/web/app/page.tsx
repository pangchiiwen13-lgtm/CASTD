"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { api, type PublicReview } from "@/lib/api";
import { BentoGrid, BentoCard } from "@/components/bento-grid";

const TICKER_ITEMS = [
  "Beauty", "Skincare", "Lifestyle", "Fashion",
  "Food & Beverage", "Wellness", "GRWM", "UGC",
  "Product Demo", "Brand Story", "Testimonial", "OOTD",
];

// Animated number counter using framer-motion
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  useEffect(() => {
    return spring.on("change", (v) => {
      setDisplay(Math.round(v).toString());
    });
  }, [spring]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function Stars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= score ? "text-[#FFD200]" : "text-[#EBEBEB]"} style={{ fontSize: 14 }}>
          ★
        </span>
      ))}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState<{ superstars: number; brands: number; completed_matches: number } | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    api.getPublicStats().then(setStats).catch(() => null);
    api.getPublicReviews().then(setReviews).catch(() => null);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">

      {/* NAV */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#EBEBEB] shadow-sm"
            : "bg-transparent"
        )}
      >
        <span className={cn(
          "font-display text-xl font-extrabold tracking-tight transition-colors duration-300",
          scrolled ? "text-[#0C0C0C]" : "text-white"
        )}>
          CASTD
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-full transition-colors duration-200",
              scrolled ? "text-[#0C0C0C] hover:bg-[#F8F7F4]" : "text-white/70 hover:text-white"
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

      {/* HERO */}
      <section className="relative min-h-screen bg-[#0C0C0C] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
          }}
        />
        {/* Yellow glow blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FFD200] opacity-[0.05] rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="inline-flex items-center gap-2.5 mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/40 text-xs tracking-widest uppercase"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200] shrink-0 animate-pulse" />
            Beauty &amp; Lifestyle · Singapore
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease: "easeOut" }}
            className="font-display text-6xl sm:text-7xl md:text-8xl font-extrabold text-white tracking-tight leading-[0.92] mb-8"
          >
            Cast exactly
            <br />
            <span className="text-[#FFD200]">who you need.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.16, ease: "easeOut" }}
            className="text-white/45 text-lg md:text-xl max-w-lg mx-auto leading-relaxed mb-10"
          >
            Singapore's marketplace connecting beauty and lifestyle brands with
            vetted on-screen talent. Free to browse, pay only at confirmation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.24, ease: "easeOut" }}
            className="flex flex-wrap gap-4 justify-center"
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
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <div className="w-px h-14 bg-gradient-to-b from-transparent via-white/20 to-white/10" />
          <span className="text-white/20 text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        </motion.div>
      </section>

      {/* MARQUEE TICKER */}
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

      {/* LIVE STATS - animated counters */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="mb-10"
          >
            <span className="text-[10px] text-[#7A7A7A] tracking-[0.2em] uppercase font-semibold">
              Live platform metrics
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#0C0C0C] mt-3 tracking-tight">
              Growing every week.
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#EBEBEB] border border-[#EBEBEB]">
            {[
              { value: stats?.superstars ?? 0, suffix: "+", label: "Vetted Superstars", sub: "beauty & lifestyle creators" },
              { value: stats?.brands ?? 0, suffix: "", label: "Brands & Agencies", sub: "registered on CASTD" },
              { value: stats?.completed_matches ?? 0, suffix: "", label: "Completed Matches", sub: "confirmed campaigns" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1 } } }}
                className="bg-white px-10 py-12 hover:bg-[#F8F7F4] transition-colors duration-300"
              >
                <div className="font-display text-5xl md:text-6xl font-extrabold text-[#0C0C0C] tracking-tight">
                  {stats ? <AnimatedNumber value={s.value} suffix={s.suffix} /> : "..."}
                </div>
                <div className="font-semibold text-[#0C0C0C] mt-4 mb-1 text-base">{s.label}</div>
                <div className="text-sm text-[#7A7A7A]">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Bento grid */}
      <section className="bg-[#0C0C0C] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="mb-12"
          >
            <span className="text-[10px] text-[#FFD200]/60 tracking-[0.2em] uppercase font-semibold">Process</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mt-4 leading-[0.95] tracking-tight">
              Three steps.<br />Zero guesswork.
            </h2>
          </motion.div>

          <BentoGrid className="border-white/8 bg-white/3">
            {/* Step 01 - spans 4 cols */}
            <BentoCard className="col-span-1 md:col-span-4 border-b border-r-0 md:border-r border-white/8 p-8 md:p-10">
              <div className="font-display text-6xl font-extrabold text-[#FFD200]/20 leading-none mb-6 select-none">01</div>
              <h3 className="text-xl font-bold text-white mb-3">Browse free</h3>
              <p className="text-white/45 text-sm leading-relaxed max-w-xs">
                Filter 27+ profiles by content type, language, vibe, and follower count. Every profile is visible. No paywalls, no credits.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["Beauty Tutorial", "Lifestyle", "UGC", "GRWM", "Product Demo"].map(tag => (
                  <span key={tag} className="text-[10px] bg-white/5 border border-white/10 text-white/40 px-2.5 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </BentoCard>

            {/* Step 02 - spans 2 cols */}
            <BentoCard className="col-span-1 md:col-span-2 border-b border-white/8 p-8 md:p-10">
              <div className="font-display text-6xl font-extrabold text-[#FFD200]/20 leading-none mb-6 select-none">02</div>
              <h3 className="text-xl font-bold text-white mb-3">Shortlist &amp; inquire</h3>
              <p className="text-white/45 text-sm leading-relaxed">
                Save picks to a casting board. Submit a campaign brief with dates, deliverables, budget. Still free.
              </p>
            </BentoCard>

            {/* Step 03 - spans 3 cols */}
            <BentoCard className="col-span-1 md:col-span-3 border-r-0 md:border-r border-white/8 p-8 md:p-10">
              <div className="font-display text-6xl font-extrabold text-[#FFD200]/20 leading-none mb-6 select-none">03</div>
              <h3 className="text-xl font-bold text-white mb-3">Confirm &amp; go</h3>
              <p className="text-white/45 text-sm leading-relaxed">
                Found the right fit? Confirm the talent and pay the one-time contact fee. Platform handles everything after.
              </p>
            </BentoCard>

            {/* CTA card - spans 3 cols */}
            <BentoCard className="col-span-1 md:col-span-3 p-8 md:p-10 flex items-center justify-between gap-4 flex-wrap bg-[#FFD200]/5">
              <div>
                <p className="font-bold text-white text-lg">Free to browse.</p>
                <p className="text-white/40 text-sm">Pay only at confirmation.</p>
              </div>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFD200] text-[#0C0C0C] font-semibold text-sm hover:bg-white transition-colors shrink-0">
                Get started →
              </Link>
            </BentoCard>
          </BentoGrid>
        </div>
      </section>

      {/* FOR BRANDS / FOR SUPERSTARS */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="mb-16"
          >
            <span className="text-[10px] text-[#7A7A7A] tracking-[0.2em] uppercase font-semibold">Who it's for</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-[#0C0C0C] mt-4 leading-[0.95] tracking-tight">
              One platform.<br />Both sides.
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
              className="bg-[#0C0C0C] rounded-2xl p-10 flex flex-col"
            >
              <span className="inline-block text-[#FFD200] text-[10px] tracking-[0.2em] uppercase font-semibold mb-8">
                For Brands &amp; Agencies
              </span>
              <h3 className="font-display text-3xl font-extrabold text-white mb-6 leading-tight">
                Find the right talent.<br />Faster.
              </h3>
              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "Search vetted creator profiles",
                  "Filter by language, vibe, content type",
                  "Submit unlimited free inquiries",
                  "AI-matched fit score per talent",
                  "Confirm and secure. Pay only here.",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/55">
                    <span className="mt-0.5 text-[#FFD200] shrink-0 text-[10px]">✦</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="self-start inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFD200] text-[#0C0C0C] font-semibold text-sm hover:bg-white transition-colors">
                Browse catalog →
              </Link>
            </motion.div>

            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.1 } } }}
              className="bg-[#F8F7F4] border border-[#EBEBEB] rounded-2xl p-10 flex flex-col"
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
                    <span className="mt-0.5 text-[#0C0C0C] shrink-0 text-[10px]">✦</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="self-start inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0C0C0C] text-white font-semibold text-sm hover:bg-[#2A2A2A] transition-colors">
                Join as Superstar →
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-[#0C0C0C] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="mb-16"
          >
            <span className="text-[10px] text-[#FFD200]/60 tracking-[0.2em] uppercase font-semibold">Reviews</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mt-4 leading-[0.95] tracking-tight">
              What they're saying.
            </h2>
          </motion.div>

          {reviews.length === 0 ? (
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={fadeUp}
              className="border border-white/8 rounded-2xl p-12 text-center"
            >
              <div className="flex justify-center gap-1 mb-4">
                {[1,2,3,4,5].map(n => (
                  <span key={n} className="text-[#FFD200]" style={{ fontSize: 24 }}>★</span>
                ))}
              </div>
              <p className="text-white/40 text-sm max-w-sm mx-auto">
                Reviews from real campaigns will appear here as brands and Superstars complete their first collaborations.
              </p>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {reviews.map((r, i) => (
                <motion.div
                  key={i}
                  initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.07 } } }}
                  className="border border-white/8 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/16 transition-colors"
                >
                  <Stars score={r.score} />
                  <p className="text-white/70 text-sm leading-relaxed flex-1">"{r.comment}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-semibold">{r.ratee_name}</p>
                      <p className="text-white/30 text-xs capitalize">{r.ratee_type}</p>
                    </div>
                    <span className="text-white/20 text-xs">
                      {new Date(r.created_at).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#FFD200] px-6 py-28">
        <motion.div
          initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          className="max-w-3xl mx-auto text-center"
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
        </motion.div>
      </section>

      {/* FOOTER */}
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
