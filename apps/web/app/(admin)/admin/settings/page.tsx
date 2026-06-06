"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SettingField {
  key: string;
  configured: boolean;
  masked: string;
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Record<string, SettingField>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const token = getSessionToken() || "";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSettings(await res.json());
    })();
  }, [session]);

  async function save(key: string) {
    const value = inputs[key]?.trim();
    if (!value) return;
    setSaving(key);
    const token = getSessionToken() || "";
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ key, value }),
    });
    // Refresh settings to show new masked value
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSettings(await res.json());
    setInputs(i => ({ ...i, [key]: "" }));
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">Platform Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Configure email and integrations. Values are stored securely in the database.</p>

      <Card>
        <CardHeader>
          <CardTitle>Email - Resend</CardTitle>
          <CardDescription>
            CASTD uses <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">Resend</a> to send
            transactional emails to brands and talents. Free tier: 3,000 emails/month.
            Get your API key from <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com/api-keys</a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full shrink-0 ${settings.resend_api_key?.configured ? "bg-green-500" : "bg-muted-foreground"}`} />
            <span className="text-sm">
              {settings.resend_api_key?.configured
                ? <>Configured <span className="text-muted-foreground font-mono text-xs ml-1">{settings.resend_api_key.masked}</span></>
                : <span className="text-muted-foreground">Not configured - emails will be skipped</span>}
            </span>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="mb-1 block text-xs">New API key</Label>
              <Input
                type="password"
                placeholder="re_..."
                value={inputs.resend_api_key || ""}
                onChange={e => setInputs(i => ({ ...i, resend_api_key: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && save("resend_api_key")}
              />
            </div>
            <div className="flex items-end">
              <Button
                size="sm"
                onClick={() => save("resend_api_key")}
                disabled={!inputs.resend_api_key?.trim() || saving === "resend_api_key"}
              >
                {saving === "resend_api_key" ? "Saving..." : saved === "resend_api_key" ? "Saved!" : "Save"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted/40 border px-4 py-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">When emails are sent:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              <li>Brand submits inquiry → confirmation email to brand + notification email to talent</li>
              <li>Inquiry moves to "reviewing" → email to brand</li>
              <li>Booking confirmed → email to brand + email to talent</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
