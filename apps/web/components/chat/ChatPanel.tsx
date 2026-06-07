"use client";
import { useEffect, useRef, useState } from "react";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  id: string;
  campaign_id: string;
  sender_user_id: string;
  sender_type: "brand" | "superstar";
  body: string;
  created_at: string;
}

interface Props {
  campaignId: string;
  myType: "brand" | "superstar";
  /** Display name for the other party */
  otherName?: string;
}

async function fetchMessages(campaignId: string, token: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}/messages/${campaignId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function sendMessage(campaignId: string, body: string, token: string): Promise<Message | null> {
  const res = await fetch(`${API_URL}/messages/${campaignId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) return null;
  return res.json();
}

export function ChatPanel({ campaignId, myType, otherName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function load() {
    const token = getSessionToken() || "";
    if (!token) return;
    fetchMessages(campaignId, token).then(msgs => {
      setMessages(prev => {
        // Only update if something changed (avoid re-render churn)
        if (JSON.stringify(prev) !== JSON.stringify(msgs)) return msgs;
        return prev;
      });
    });
  }

  useEffect(() => {
    load();
    // Poll every 5 seconds while the panel is mounted
    pollRef.current = setInterval(load, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [campaignId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    const token = getSessionToken() || "";
    const msg = await sendMessage(campaignId, body, token);
    if (msg) setMessages(prev => [...prev, msg]);
    setSending(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const isMine = (m: Message) => m.sender_type === myType;

  function fmtTime(s: string) {
    return new Date(s).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
  }
  function fmtDay(s: string) {
    return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
  }

  // Group by day
  let lastDay = "";

  return (
    <div className="flex flex-col border rounded-xl overflow-hidden" style={{ height: "420px" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
        <span className="text-sm font-semibold">
          Chat{otherName ? ` with ${otherName}` : ""}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto">Updates every 5s</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-white">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              No messages yet.<br />Say hello to kick off the campaign!
            </p>
          </div>
        )}
        {messages.map((m) => {
          const day = fmtDay(m.created_at);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = isMine(m);
          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-[#EBEBEB]" />
                  <span className="text-[10px] text-muted-foreground px-2">{day}</span>
                  <div className="flex-1 h-px bg-[#EBEBEB]" />
                </div>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-1`}>
                <div className={`max-w-[72%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  mine
                    ? "bg-[#0C0C0C] text-white rounded-br-sm"
                    : "bg-[#F5F5F5] text-[#0C0C0C] rounded-bl-sm"
                }`}>
                  <p>{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? "text-white/40" : "text-muted-foreground"} text-right`}>
                    {fmtTime(m.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 px-3 py-2 border-t bg-white">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-9 text-sm"
          disabled={sending}
          autoComplete="off"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || sending}
          className="h-9 px-4 bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
        >
          Send
        </Button>
      </form>
    </div>
  );
}
