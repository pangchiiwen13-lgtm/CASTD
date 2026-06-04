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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn.email({ email, password, callbackURL: "/catalog" });
    if (result.error) {
      setError(result.error.message || "Invalid email or password");
      setLoading(false);
    } else {
      // Session cookie is set automatically by the /api/auth proxy (Set-Cookie header).
      router.push("/catalog");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-1">CASTD</div>
          <p className="text-muted-foreground text-sm">Sign in to your brand account</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@brand.com" required />
          </div>
          <div className="grid gap-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          No account?{" "}
          <Link href="/signup" className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto")}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
