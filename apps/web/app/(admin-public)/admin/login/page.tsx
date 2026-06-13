"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
      } else {
        setError("Incorrect password.");
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0C0C0C]">
      <div className="w-full max-w-xs px-6">
        <div className="text-center mb-10">
          <div className="text-2xl font-bold text-white tracking-tight mb-1">CASTD</div>
          <p className="text-sm text-[#666]">Admin access</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-[#555] focus-visible:ring-[#FFD200]"
            autoFocus
            autoComplete="current-password"
          />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button
            type="submit"
            disabled={loading || !password.trim()}
            className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] font-semibold"
          >
            {loading ? "Checking..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
