"use client";
import { useSession, signOut } from "@/lib/auth-client";
import { clearSessionToken, setSessionToken } from "@/lib/get-token";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
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
      <nav className="sticky top-0 bg-background z-10">
        <AdminPreviewBanner current="brand" />
      <div className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/catalog" className="text-lg font-bold tracking-tight">
            CASTD <span className="text-xs font-normal text-muted-foreground ml-1">Brand</span>
          </Link>
          <div className="hidden md:flex gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(buttonVariants({
                  variant: pathname?.startsWith(n.href) ? "secondary" : "ghost",
                  size: "sm",
                }))}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Notification bell + user menu */}
        <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="relative" ref={menuRef}>
          <button
            className="focus:outline-none"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="User menu"
          >
            <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 transition-all">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-52 rounded-lg border bg-background shadow-lg py-1 z-50">
              {/* User info */}
              <div className="px-4 py-2 border-b">
                <p className="text-sm font-medium truncate">{name}</p>
                {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
              </div>
              {/* Links */}
              <div className="px-3 py-1">
                <span className="inline-block text-xs bg-[#FFD200] text-[#0C0C0C] font-semibold px-2 py-0.5 rounded-full">Brand</span>
              </div>
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Brand Profile
              </Link>
              {NAV.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="block px-4 py-2 text-sm hover:bg-muted transition-colors md:hidden"
                  onClick={() => setMenuOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
              {/* Switch portal */}
              <div className="border-t mt-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                  onClick={switchToSuperstar}
                >
                  ⭐ Switch to Superstar portal
                </button>
              </div>
              {/* Sign out */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors border-t"
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
      <main className="flex-1">{children}</main>
    </div>
  );
}
