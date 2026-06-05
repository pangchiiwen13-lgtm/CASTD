"use client";
import { useSession, signOut } from "@/lib/auth-client";
import { clearSessionToken } from "@/lib/get-token";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

const NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/shortlist", label: "Shortlist" },
  { href: "/inquiries", label: "Inquiries" },
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

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-6 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-6">
          <Link href="/catalog" className="text-lg font-bold tracking-tight">CASTD</Link>
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
              <Link
                href="/settings"
                className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Brand Profile
              </Link>
              <Link
                href="/catalog"
                className="block px-4 py-2 text-sm hover:bg-muted transition-colors md:hidden"
                onClick={() => setMenuOpen(false)}
              >
                Catalog
              </Link>
              <Link
                href="/shortlist"
                className="block px-4 py-2 text-sm hover:bg-muted transition-colors md:hidden"
                onClick={() => setMenuOpen(false)}
              >
                Shortlist
              </Link>
              <Link
                href="/inquiries"
                className="block px-4 py-2 text-sm hover:bg-muted transition-colors md:hidden"
                onClick={() => setMenuOpen(false)}
              >
                Inquiries
              </Link>
              {/* Sign out */}
              <button
                className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors border-t mt-1"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
