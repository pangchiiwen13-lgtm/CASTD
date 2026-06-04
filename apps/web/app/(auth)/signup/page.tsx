"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    setError("");
    const result = await signUp.email({ email, password, name, callbackURL: "/onboarding" });
    if (result.error) {
      setError(result.error.message || "Sign-up failed");
      setLoading(false);
    } else {
      // Session cookie is set automatically by the /api/auth proxy (Set-Cookie header).
      router.push("/onboarding");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-2xl font-bold tracking-tight mb-1">CASTD</div>
          <p className="text-muted-foreground text-sm">Create your brand account — free to start</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-1">
            <Label>Your name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
          </div>
          <div className="grid gap-1">
            <Label>Work email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@yourbrand.com" required />
          </div>
          <div className="grid gap-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto")}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
