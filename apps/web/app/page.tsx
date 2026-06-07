"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { api, type PublicReview } from "@/lib/api";

// AI-generated images (Higgsfield)
const IMG_HERO = "https://d8j0ntlcm91z4.cloudfront.net/user_32n2a4gtmOz5g8tXtyqO6QX7OgX/hf_20260607_095342_91b706fa-8370-486e-a09e-0cc26b00b2c1.png";
const IMG_TALENT = "https://d8j0ntlcm91z4.cloudfront.net/user_32n2a4gtmOz5g8tXtyqO6QX7OgX/hf_20260607_095344_2be01a69-1522-4ac3-acb3-1fed6bd7d278.png";
const IMG_BRAND = "https://d8j0ntlcm91z4.cloudfront.net/user_32n2a4gtmOz5g8tXtyqO6QX7OgX/hf_20260607_095346_0d5d8219-6fe6-42fc-915d-a560158532a6.png";

const TICKER_ITEMS = [
  "Beauty", "Skincare", "Lifestyle", "Fashion",
  "Food & Beverage", "Wellness", "GRWM", "UGC",
  "Product Demo", "Brand Story", "Testimonial", "OOTD",
];

const STEPS = [
  {
    num: "01",
    title: "Browse free",
    body: "Search 27+ vetted creator profiles. Filter by content type, language, vibe, and audience size. No paywall, no credits.",
    tags: ["Beauty Tutorial", "Lifestyle", "UGC", "GRWM"],
  },
  {
    num: "02",
    title: "Shortlist and inquire",
    body: "Save picks to your casting board. Submit a campaign brief with dates, deliverables, and budget - still completely free.",
    tags: ["Product launch", "Social media ad", "Brand video"],
  },
  {
    num: "03",
    title: "Confirm and go",
    body: "Found the perfect fit? Confirm the Superstar. Our team handles everything after - campaign coordination included.",
    tags: ["Managed process", "14-day delivery", "Chat included"],
  },
];

const TALENT_BUBBLES = [
  { initials: "AM", bg: "#FFD200", text: "#1A1A1A" },
  { initials: "JW", bg: "#1A1A1A", text: "#FFD200" },
  { initials: "TL", bg: "#F0E8D8", text: "#1A1A1A" },
];

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState("0");

  useEffect(() => { if (inView) motionVal.set(value); }, [inView, value, motionVal]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v).toString())), [spring]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: n <= score ? "#FFD200" : "#E8E0D0" }}
        />
      ))}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65 } },
};

export default function LandingPage() {
  const [stats, setStats] = useState<{ superstars: number; brands: number; completed_matches: number } | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    api.getPublicStats().then(setStats).catch(() => null);
    api.getPublicReviews().then(setReviews).catch(() => null);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#FFF8EC] overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#F0E8D8]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-xl font-black tracking-tight text-[#1A1A1A]">
            CASTD
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login"
              className="text-sm font-semibold px-4 py-2 text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
              Log in
            </Link>
            <Link href="/signup"
              className="text-sm font-bold px-5 py-2.5 rounded-full bg-[#FFD200] text-[#1A1A1A] hover:bg-[#FFC000] transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#FFF8EC] min-h-[92vh] flex items-center px-6 md:px-10 py-20 md:py-10">
        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left - text */}
          <div className="order-2 md:order-1">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center gap-2.5 bg-white border border-[#F0E8D8] rounded-full px-4 py-2 mb-8 shadow-sm"
            >
              <span className="w-2 h-2 bg-[#FFD200] rounded-full animate-pulse shrink-0" />
              <span className="text-xs font-semibold text-[#6B6B6B]">Singapore's beauty talent marketplace</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.06 }}
              className="font-display text-5xl sm:text-6xl md:text-5xl lg:text-7xl font-black text-[#1A1A1A] leading-[0.88] tracking-tight mb-7"
            >
              Cast your
              <br />
              <span style={{
                backgroundImage: "linear-gradient(135deg, #FFD200 0%, #FFA800 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                perfect
              </span>
              <br />
              Superstar.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.12 }}
              className="text-[#6B6B6B] text-lg leading-relaxed mb-10 max-w-md"
            >
              Connect with vetted beauty and lifestyle creators in Singapore.
              Browse free, shortlist your favourites, and book with confidence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link href="/signup"
                className="inline-flex items-center px-7 py-3.5 rounded-full bg-[#FFD200] text-[#1A1A1A] font-bold text-sm hover:bg-[#FFC000] transition-colors shadow-md shadow-[#FFD200]/30">
                I'm a Brand
              </Link>
              <Link href="/signup"
                className="inline-flex items-center px-7 py-3.5 rounded-full bg-[#1A1A1A] text-white font-bold text-sm hover:bg-[#333] transition-colors">
                I'm a Superstar
              </Link>
            </motion.div>

            {/* Proof chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.3 }}
              className="flex flex-wrap gap-2"
            >
              {[
                `${stats?.superstars ?? "27"}+ vetted Superstars`,
                "Free to browse",
                "Pay at confirmation",
              ].map((chip) => (
                <span key={chip}
                  className="bg-white border border-[#F0E8D8] rounded-full px-4 py-1.5 text-xs font-semibold text-[#6B6B6B] flex items-center gap-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200] shrink-0" />
                  {chip}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right - photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="order-1 md:order-2 relative"
          >
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-[#1A1A1A]/15 aspect-[4/5]">
              <img src={IMG_HERO} alt="Singapore lifestyle talent creators" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/30 via-transparent to-transparent" />
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-4 border border-[#F0E8D8]">
              <div className="flex -space-x-2.5">
                {TALENT_BUBBLES.map((b) => (
                  <div key={b.initials}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-white"
                    style={{ backgroundColor: b.bg, color: b.text }}>
                    {b.initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#1A1A1A]">
                  {stats?.superstars ?? "27"}+ Superstars
                </p>
                <p className="text-[11px] text-[#6B6B6B]">ready to collab</p>
              </div>
            </div>

            {/* Floating vibe tag */}
            <div className="absolute -top-4 -right-4 bg-[#FFD200] rounded-2xl shadow-lg px-5 py-3">
              <p className="text-[12px] font-black text-[#1A1A1A]">Beauty</p>
              <p className="text-[10px] text-[#1A1A1A]/60">Content creators</p>
            </div>

            <div className="absolute -z-10 -bottom-8 -right-8 w-40 h-40 rounded-full bg-[#FFD200]/20 blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* MARQUEE TICKER */}
      <div className="bg-[#FFD200] py-3.5 overflow-hidden select-none border-y border-[#1A1A1A]/8">
        <div className="flex whitespace-nowrap" style={{ animation: "marqueeLeft 28s linear infinite" }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {TICKER_ITEMS.map((item, i) => (
                <span key={`${copy}-${i}`}
                  className="inline-flex items-center gap-5 px-8 font-display font-black text-[#1A1A1A] text-sm uppercase tracking-widest">
                  {item}
                  <span className="w-1 h-1 rounded-full bg-[#1A1A1A]/30 inline-block" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold text-[#FFD200] uppercase tracking-[0.25em] mb-3">Live platform metrics</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight">
              Growing every week.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { value: stats?.superstars ?? 0, suffix: "+", label: "Vetted Superstars", sub: "beauty and lifestyle creators" },
              { value: stats?.brands ?? 0, suffix: "", label: "Brands and Agencies", sub: "registered on CASTD" },
              { value: stats?.completed_matches ?? 0, suffix: "", label: "Completed Matches", sub: "confirmed campaigns" },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1 } } }}
                className="bg-[#FFF8EC] rounded-3xl p-8 hover:shadow-md transition-shadow duration-300 border border-[#F0E8D8]"
              >
                <div className="w-8 h-1 rounded-full bg-[#FFD200] mb-6" />
                <div className="font-display text-5xl font-black text-[#1A1A1A] tracking-tight mb-3">
                  {stats ? <AnimatedNumber value={s.value} suffix={s.suffix} /> : "..."}
                </div>
                <div className="font-bold text-[#1A1A1A] text-sm mb-1">{s.label}</div>
                <div className="text-xs text-[#6B6B6B]">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#FFF8EC] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold text-[#FFD200] uppercase tracking-[0.25em] mb-3">Process</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight">
              Three steps.
              <br />
              Zero guesswork.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1 } } }}
                className="bg-white rounded-3xl p-8 border border-[#F0E8D8] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-10 h-10 rounded-full bg-[#FFD200] flex items-center justify-center">
                    <span className="font-black text-[#1A1A1A] text-sm">{step.num}</span>
                  </div>
                  <span className="font-display text-5xl font-black text-[#1A1A1A]/6 leading-none select-none">{step.num}</span>
                </div>
                <h3 className="font-display text-xl font-black text-[#1A1A1A] mb-3">{step.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed flex-1 mb-6">{step.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  {step.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-[#FFF8EC] border border-[#F0E8D8] text-[#6B6B6B] px-2.5 py-1 rounded-full font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }}
            variants={fadeUp}
            className="mt-6 bg-[#1A1A1A] rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-5"
          >
            <div>
              <p className="font-black text-white text-lg">Free to browse. Free to inquire.</p>
              <p className="text-white/50 text-sm mt-1">Pay only when you've confirmed the perfect Superstar.</p>
            </div>
            <Link href="/signup"
              className="shrink-0 inline-flex items-center px-7 py-3.5 rounded-full bg-[#FFD200] text-[#1A1A1A] font-bold text-sm hover:bg-[#FFC000] transition-colors">
              Get started free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-white px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold text-[#FFD200] uppercase tracking-[0.25em] mb-3">Who it's for</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight">
              One platform.
              <br />
              Both sides.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Brand card */}
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0, transition: { duration: 0.6 } } }}
              className="rounded-3xl overflow-hidden bg-[#1A1A1A] min-h-[520px] flex flex-col"
            >
              <div className="h-56 overflow-hidden relative">
                <img src={IMG_BRAND} alt="Brand team" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1A1A1A]" />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFD200]" />
                  <span className="text-[#FFD200] text-xs font-black uppercase tracking-[0.2em]">CASTD Brand</span>
                </div>
                <h3 className="font-display text-2xl font-black text-white mb-5 leading-tight">
                  Find the right talent.
                  <br />Faster.
                </h3>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Search 27+ vetted creator profiles",
                    "Filter by language, vibe, content type",
                    "Submit unlimited free inquiries",
                    "AI-matched fit score per talent",
                    "Chat directly after confirmation",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                      <span className="w-1 h-1 rounded-full bg-[#FFD200] mt-2 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className="self-start inline-flex items-center px-6 py-3 rounded-full bg-[#FFD200] text-[#1A1A1A] font-bold text-sm hover:bg-[#FFC000] transition-colors">
                  Browse the catalog
                </Link>
              </div>
            </motion.div>

            {/* Superstar card */}
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.1 } } }}
              className="rounded-3xl overflow-hidden bg-[#FFF8EC] border border-[#F0E8D8] min-h-[520px] flex flex-col"
            >
              <div className="h-56 overflow-hidden">
                <img src={IMG_TALENT} alt="Superstar talent creator" className="w-full h-full object-cover object-top" />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]" />
                  <span className="text-[#1A1A1A] text-xs font-black uppercase tracking-[0.2em]">CASTD Superstar</span>
                </div>
                <h3 className="font-display text-2xl font-black text-[#1A1A1A] mb-5 leading-tight">
                  Get discovered.
                  <br />Get booked.
                </h3>
                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    "Build your free Superstar profile",
                    "Get discovered by Singapore brands",
                    "Set cash, product, or hybrid rates",
                    "Manage bookings in one dashboard",
                    "Build your collab portfolio",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[#6B6B6B]">
                      <span className="w-1 h-1 rounded-full bg-[#1A1A1A] mt-2 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup"
                  className="self-start inline-flex items-center px-6 py-3 rounded-full bg-[#1A1A1A] text-white font-bold text-sm hover:bg-[#333] transition-colors">
                  Join as Superstar
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-[#FFF8EC] px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold text-[#FFD200] uppercase tracking-[0.25em] mb-3">Reviews</p>
            <h2 className="font-display text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tight">
              What they're saying.
            </h2>
          </motion.div>

          {reviews.length === 0 ? (
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }}
              variants={fadeUp}
              className="bg-white border border-[#F0E8D8] rounded-3xl p-14 text-center"
            >
              <div className="flex justify-center gap-1.5 mb-5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} className="w-4 h-4 rounded-sm bg-[#FFD200]" />
                ))}
              </div>
              <p className="font-bold text-[#1A1A1A] mb-2">Real reviews coming soon</p>
              <p className="text-[#6B6B6B] text-sm max-w-sm mx-auto">
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
                  className="bg-white rounded-3xl p-6 border border-[#F0E8D8] flex flex-col gap-4 hover:shadow-md transition-shadow"
                >
                  <StarRating score={r.score} />
                  <p className="text-[#1A1A1A] text-sm leading-relaxed flex-1">"{r.comment}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#1A1A1A] text-xs font-bold">{r.ratee_name}</p>
                      <p className="text-[#6B6B6B] text-xs capitalize">{r.ratee_type}</p>
                    </div>
                    <span className="text-[#6B6B6B] text-xs">
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
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="w-2 h-2 rounded-full bg-[#1A1A1A]/20" />
            ))}
          </div>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-black text-[#1A1A1A] tracking-tight leading-[0.88] mb-7">
            Your next campaign
            <br />
            starts here.
          </h2>
          <p className="text-[#1A1A1A]/55 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Browse free. Inquire free. Pay only when you've found exactly who you need.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup"
              className="inline-flex items-center px-10 py-4 rounded-full bg-[#1A1A1A] text-[#FFD200] font-bold text-sm hover:bg-[#333] transition-colors">
              Get started - it's free
            </Link>
            <Link href="/login"
              className="inline-flex items-center px-8 py-4 rounded-full border-2 border-[#1A1A1A]/20 text-[#1A1A1A]/70 font-bold text-sm hover:border-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors">
              Log in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1A1A1A] px-6 md:px-10 py-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="font-display text-xl font-black text-white tracking-tight">CASTD</span>
          <div className="flex gap-8 text-sm text-white/30">
            <Link href="/login" className="hover:text-white/70 transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-white/70 transition-colors">Sign up</Link>
          </div>
          <p className="text-white/20 text-xs tracking-wide">
            {new Date().getFullYear()} CASTD. Singapore.
          </p>
        </div>
      </footer>
    </div>
  );
}
