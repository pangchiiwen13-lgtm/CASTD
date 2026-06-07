"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { clearSessionToken, setSessionToken } from "@/lib/get-token";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/talents", label: "Superstars" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) router.push("/admin/login");
  }, [session, isPending, router]);

  // Cache the session token so getSessionToken() can read it
  // (Better Auth sets httpOnly cookies which JS can't read directly)
  useEffect(() => {
    const token = (session as any)?.session?.token;
    if (token) setSessionToken(token);
  }, [session]);

  if (isPending || !session) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b px-6 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight">CASTD Admin</span>
          <div className="flex gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  buttonVariants({
                    variant: (n.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(n.href)) ? "secondary" : "ghost",
                    size: "sm",
                  })
                )}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </div>
        <button
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          onClick={async () => {
            clearSessionToken();
            await fetch("/api/admin-auth", { method: "DELETE" });
            signOut().then(() => router.push("/admin/login"));
          }}
        >
          Sign out
        </button>
      </nav>
      <main className="flex-1">{children}</main>
    </div>
  );
}
