"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "brand" | "superstar" | null;

function storePortalIntent(role: Role) {
  if (role && typeof window !== "undefined") {
    localStorage.setItem("castd_portal_intent", role);
  }
}

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) { setError("Please select how you want to use CASTD"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    storePortalIntent(role);
    const result = await signUp.email({ email, password, name, callbackURL: "/portal" });
    if (result.error) {
      setError(result.error.message || "Sign-up failed");
      setLoading(false);
    } else {
      router.push(role === "superstar" ? "/onboarding/superstar" : "/onboarding?role=brand");
    }
  }

  async function handleGoogle() {
    if (!role) { setError("Please select whether you are a Superstar or Brand first"); return; }
    setGoogleLoading(true);
    setError("");
    storePortalIntent(role);
    await signIn.social({ provider: "google", callbackURL: "/portal" });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-1">CASTD</div>
          <p className="text-muted-foreground text-sm">Create your free account</p>
        </div>

        {/* Role selection - required */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[#0C0C0C] mb-3 text-center">I want to join as a...</p>
          <div className="grid grid-cols-2 gap-3">
            <RoleCard
              icon="⭐"
              title="Superstar"
              desc="Get discovered and booked"
              selected={role === "superstar"}
              onClick={() => { setRole("superstar"); setError(""); }}
            />
            <RoleCard
              icon="🏢"
              title="Brand / Agency"
              desc="Find and book talent"
              selected={role === "brand"}
              onClick={() => { setRole("brand"); setError(""); }}
            />
          </div>
        </div>

        {/* Google */}
        <Button
          type="button"
          variant="outline"
          className={cn("w-full flex items-center gap-2 mb-4", !role && "opacity-50 cursor-not-allowed")}
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
            <span className="bg-background px-2">or sign up with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1">
            <Label>Your name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
          </div>
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required />
          </div>
          <div className="grid gap-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !role} className={cn(!role && "opacity-50")}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto")}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function RoleCard({ icon, title, desc, selected, onClick }: {
  icon: string; title: string; desc: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center",
        selected
          ? "border-[#FFD200] bg-[#FFFBEB]"
          : "border-[#EBEBEB] hover:border-[#FFD200]/50"
      )}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="font-semibold text-sm text-[#0C0C0C]">{title}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
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
