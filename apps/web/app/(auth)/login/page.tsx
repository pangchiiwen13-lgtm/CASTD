"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Portal = "superstar" | "brand" | null;

function storePortalIntent(portal: Portal) {
  if (portal && typeof window !== "undefined") {
    localStorage.setItem("castd_portal_intent", portal);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<Portal>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!portal) { setError("Please select how you want to sign in"); return; }
    setLoading(true);
    setError("");
    storePortalIntent(portal);
    const result = await signIn.email({ email, password, callbackURL: "/portal" });
    if (result.error) {
      setError(result.error.message || "Invalid email or password");
      setLoading(false);
    } else {
      router.push("/portal");
    }
  }

  async function handleGoogle() {
    if (!portal) { setError("Please select whether you are a Superstar or Brand first"); return; }
    setGoogleLoading(true);
    setError("");
    storePortalIntent(portal);
    await signIn.social({ provider: "google", callbackURL: "/portal" });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FFF8EC]">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-1 text-[#1A1A1A]">CASTD</div>
          <p className="text-[#9A9A9A] text-sm">Sign in to your account</p>
        </div>

        {/* Portal selection - required */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[#0C0C0C] mb-3 text-center">I am signing in as a...</p>
          <div className="grid grid-cols-2 gap-3">
            <PortalCard
              title="Superstar"
              desc="Talent portal"
              selected={portal === "superstar"}
              onClick={() => { setPortal("superstar"); setError(""); }}
            />
            <PortalCard
              title="Brand"
              desc="Brand portal"
              selected={portal === "brand"}
              onClick={() => { setPortal("brand"); setError(""); }}
            />
          </div>
        </div>

        {/* Google */}
        <Button
          type="button"
          variant="outline"
          className={cn("w-full flex items-center gap-2 mb-4", !portal && "opacity-50 cursor-not-allowed")}
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </Button>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#EBEBEB]" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-background px-2">or sign in with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="grid gap-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !portal} className={cn(!portal && "opacity-50")}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          No account?{" "}
          <Link href="/signup" className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto")}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

function PortalCard({ title, desc, selected, onClick }: {
  title: string; desc: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 text-center items-center",
        selected
          ? "border-[#FFD200] bg-white shadow-md"
          : "border-[#E8E4E0] bg-white hover:border-[#FFD200]/60 hover:shadow-sm",
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-xl mb-1 flex items-center justify-center transition-colors",
        selected ? "bg-[#FFD200]" : "bg-[#F5F3F0]",
      )}>
        <span className={cn("w-3 h-3 rounded-full inline-block", selected ? "bg-[#0C0C0C]" : "bg-[#CCCCCC]")} />
      </div>
      <div className="font-semibold text-sm text-[#1A1A1A]">{title}</div>
      <div className="text-[11px] text-[#9A9A9A]">{desc}</div>
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
