"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type PreviewMode = "brand" | "superstar";

// ── helpers (call from admin dashboard buttons) ──────────────────────────────

export function enterPreviewMode(mode: PreviewMode) {
  localStorage.setItem("northstar_admin_preview", mode);
}

export function exitPreviewMode() {
  localStorage.removeItem("northstar_admin_preview");
}

export function getPreviewMode(): PreviewMode | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("northstar_admin_preview");
  return v === "brand" || v === "superstar" ? v : null;
}

// ── Banner component ─────────────────────────────────────────────────────────

export function AdminPreviewBanner({ current }: { current: PreviewMode }) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(getPreviewMode() !== null);
  }, []);

  if (!show) return null;

  function switchTo(mode: PreviewMode) {
    enterPreviewMode(mode);
    router.push(mode === "brand" ? "/dashboard" : "/superstar/dashboard");
  }

  function exit() {
    exitPreviewMode();
    router.push("/admin");
  }

  const isBrand = current === "brand";

  return (
    <div className="bg-[#FFD200] text-[#0C0C0C] px-4 py-1.5 flex items-center justify-between gap-4 text-xs font-semibold">
      {/* Left - current context */}
      <span className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0C0C0C]/40 inline-block animate-pulse" />
        Admin Preview
        <span className="mx-1 opacity-40">·</span>
        {isBrand ? "Brand Portal" : "Superstar Portal"}
      </span>

      {/* Right - controls */}
      <div className="flex items-center gap-3">
        <span className="opacity-40 hidden sm:inline">Switch to:</span>
        <button
          onClick={() => switchTo(isBrand ? "superstar" : "brand")}
          className="flex items-center gap-1 bg-[#0C0C0C] text-[#FFD200] px-2.5 py-0.5 rounded-full hover:bg-[#2A2A2A] transition-colors"
        >
          {isBrand ? "Superstar" : "Brand"}
        </button>
        <span className="opacity-30">|</span>
        <button
          onClick={exit}
          className="opacity-70 hover:opacity-100 underline underline-offset-2 transition-opacity"
        >
          ← Admin
        </button>
      </div>
    </div>
  );
}
