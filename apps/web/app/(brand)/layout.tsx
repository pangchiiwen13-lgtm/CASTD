"use client";
import { useSession, signOut } from "@/lib/auth-client";
import { clearSessionToken, setSessionToken } from "@/lib/get-token";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/shortlist", label: "Shortlist" },
  { href: "/inquiries", label: "Inquiries" },
  { href: "/campaigns", label: "Campaigns" },
];

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPending && !session) router.push("/login");
  }, [session, isPending, router]);

  // Cache the session token so getSessionToken() can read it
  useEffect(() => {
    const token = (session as any)?.session?.token;
    if (token) setSessionToken(token);
  }, [session]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isPending || !session) return null;

  const name = session.user.name || session.user.email || "Brand";
  const email = session.user.email || "";
  const initials = name.slice(0, 2).toUpperCase();

  async function handleSignOut() {
    setMenuOpen(false);
    clearSessionToken();
    await signOut();
    router.push("/");
  }

  function switchToSuperstar() {
    setMenuOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("castd_portal_intent", "superstar");
    }
    router.push("/superstar/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 bg-white z-10 shadow-sm">
        <AdminPreviewBanner current="brand" />
        <div className="border-b border-[#F0EDEA] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/catalog" className="text-lg font-bold tracking-tight text-[#1A1A1A]">
              Northstar <span className="text-xs font-normal text-[#9A9A9A] ml-1">Brand</span>
            </Link>
            <div className="hidden md:flex gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    pathname?.startsWith(n.href)
                      ? "bg-[#FFD200] text-[#0C0C0C]"
                      : "text-[#6A6A6A] hover:bg-[#F5F3F0] hover:text-[#1A1A1A]",
                  )}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="relative" ref={menuRef}>
              <button
                className="focus:outline-none"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="User menu"
              >
                <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-[#FFD200] hover:ring-offset-1 transition-all">
                  <AvatarFallback className="text-xs bg-[#FFD200] text-[#0C0C0C] font-bold">{initials}</AvatarFallback>
                </Avatar>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-10 w-52 rounded-2xl border border-[#F0EDEA] bg-white shadow-xl py-1.5 z-50">
                  <div className="px-4 py-2 border-b border-[#F0EDEA]">
                    <p className="text-sm font-semibold truncate text-[#1A1A1A]">{name}</p>
                    {email && <p className="text-xs text-[#9A9A9A] truncate">{email}</p>}
                    <span className="inline-block mt-1.5 text-xs bg-[#FFD200] text-[#0C0C0C] font-bold px-2 py-0.5 rounded-full">Brand</span>
                  </div>
                  <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#FFF8EC] transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    Brand Profile
                  </Link>
                  {NAV.map(n => (
                    <Link
                      key={n.href}
                      href={n.href}
                      className="block px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#FFF8EC] transition-colors md:hidden"
                      onClick={() => setMenuOpen(false)}
                    >
                      {n.label}
                    </Link>
                  ))}
                  <div className="border-t border-[#F0EDEA] mt-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-[#6A6A6A] hover:bg-[#FFF8EC] transition-colors"
                      onClick={switchToSuperstar}
                    >
                      Switch to Superstar portal
                    </button>
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-[#F0EDEA]"
                    onClick={handleSignOut}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 bg-[#FFF8EC]">{children}</main>
    </div>
  );
}
