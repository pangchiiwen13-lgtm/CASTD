"use client";
import { useEffect, useRef, useState } from "react";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  id: string;
  campaign_id: string;
  sender_user_id: string;
  sender_type: "brand" | "superstar";
  body: string;
  created_at: string;
}

// Minimal campaign shape needed for the details panel
export interface CampaignMeta {
  campaign_name?: string;
  status?: "active" | "delivered" | "completed" | "cancelled";
  brief_text?: string;
  deliverables?: string;
  remuneration_type?: string;
  budget_range?: string;
  amount_sgd?: number;
  shoot_date?: string;
  talent_name?: string;
  company_name?: string;
}

interface Props {
  campaignId: string;
  myType: "brand" | "superstar";
  otherName?: string;
  campaign?: CampaignMeta;
}

async function fetchMessages(campaignId: string, token: string): Promise<Message[]> {
  const res = await fetch(`${API_URL}/messages/${campaignId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function postMessage(campaignId: string, body: string, token: string): Promise<Message | null> {
  const res = await fetch(`${API_URL}/messages/${campaignId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  if (!res.ok) return null;
  return res.json();
}

const STATUS_MAP: Record<string, { label: string; color: string; step: number }> = {
  active:    { label: "In progress",          color: "bg-blue-100 text-blue-700",   step: 1 },
  delivered: { label: "Awaiting confirmation", color: "bg-amber-100 text-amber-700", step: 2 },
  completed: { label: "Completed",             color: "bg-green-100 text-green-700", step: 3 },
  cancelled: { label: "Cancelled",             color: "bg-[#F5F3F0] text-[#9A9A9A]", step: 0 },
};

const TIMELINE_STEPS = ["Offer sent", "In progress", "Delivered", "Completed"];

function fmtCompensation(c: CampaignMeta): string {
  if (!c.remuneration_type) return "";
  if (c.remuneration_type === "product") return "Product / Gifting";
  if (c.budget_range) return c.budget_range;
  if (c.amount_sgd) return `SGD ${(c.amount_sgd / 100).toFixed(2)}`;
  return c.remuneration_type === "cash_hourly" ? "Hourly rate" : "Cash";
}

export function ChatPanel({ campaignId, myType, otherName, campaign }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function load() {
    const token = getSessionToken() || "";
    if (!token) return;
    fetchMessages(campaignId, token).then(msgs => {
      setMessages(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(msgs)) return msgs;
        return prev;
      });
    });
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
    const msg = await postMessage(campaignId, body, token);
    if (msg) setMessages(prev => [...prev, msg]);
    setSending(false);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const isMine = (m: Message) => m.sender_type === myType;
  const fmtTime = (s: string) => new Date(s).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" });
  const fmtDay = (s: string) => new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short" });

  const st = campaign?.status ? STATUS_MAP[campaign.status] : null;
  const currentStep = st?.step ?? 0;

  let lastDay = "";

  return (
    <div className="flex flex-col border border-[#F0EDEA] rounded-2xl overflow-hidden bg-white shadow-sm" style={{ height: "480px" }}>

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#F0EDEA] bg-[#FAFAFA] flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          {campaign?.campaign_name ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#1A1A1A] truncate">{campaign.campaign_name}</span>
              {st && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
              )}
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#1A1A1A]">
              Chat{otherName ? ` with ${otherName}` : ""}
            </span>
          )}
        </div>
        {campaign && (
          <button
            onClick={() => setShowDetails(d => !d)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg font-medium border transition-all flex-shrink-0",
              showDetails
                ? "bg-[#0C0C0C] text-white border-[#0C0C0C]"
                : "border-[#E0DDD9] text-[#6A6A6A] hover:border-[#0C0C0C] hover:text-[#1A1A1A]",
            )}
          >
            {showDetails ? "Hide details" : "Details"}
          </button>
        )}
      </div>

      {/* Campaign details drawer */}
      {showDetails && campaign && (
        <div className="border-b border-[#F0EDEA] bg-[#FFFBEB] px-4 py-4 space-y-3 text-xs flex-shrink-0 overflow-y-auto" style={{ maxHeight: "220px" }}>
          {/* Status timeline */}
          <div>
            <p className="text-[10px] text-[#9A9A9A] uppercase tracking-widest font-semibold mb-2">Status</p>
            <div className="flex items-center gap-0">
              {TIMELINE_STEPS.map((label, i) => {
                const done = i < currentStep;
                const active = i === currentStep - 1;
                const isLast = i === TIMELINE_STEPS.length - 1;
                return (
                  <div key={label} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={cn(
                        "w-3.5 h-3.5 rounded-full border-2 transition-colors",
                        done ? "bg-[#1A1A1A] border-[#1A1A1A]" : active ? "bg-[#FFD200] border-[#FFD200]" : "bg-white border-[#CCCCCC]",
                      )} />
                      <span className={cn(
                        "text-[9px] mt-1 text-center leading-tight",
                        active ? "text-[#1A1A1A] font-semibold" : done ? "text-[#6A6A6A]" : "text-[#CCCCCC]",
                      )}>{label}</span>
                    </div>
                    {!isLast && (
                      <div className={cn("h-px flex-1 mx-1 mt-[-10px]", done ? "bg-[#1A1A1A]" : "bg-[#E0DDD9]")} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {fmtCompensation(campaign) && (
              <div>
                <span className="text-[10px] text-[#9A9A9A] uppercase tracking-wider block">Compensation</span>
                <span className="text-[#1A1A1A] font-medium">{fmtCompensation(campaign)}</span>
              </div>
            )}
            {campaign.shoot_date && (
              <div>
                <span className="text-[10px] text-[#9A9A9A] uppercase tracking-wider block">Shoot date</span>
                <span className="text-[#1A1A1A] font-medium">{campaign.shoot_date}</span>
              </div>
            )}
            {campaign.deliverables && (
              <div className="col-span-2">
                <span className="text-[10px] text-[#9A9A9A] uppercase tracking-wider block">Deliverables</span>
                <span className="text-[#1A1A1A]">{campaign.deliverables}</span>
              </div>
            )}
          </div>
          {campaign.brief_text && (
            <div>
              <span className="text-[10px] text-[#9A9A9A] uppercase tracking-wider block mb-1">Brief</span>
              <p className="text-[#6A6A6A] leading-relaxed">{campaign.brief_text}</p>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-white">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">
              No messages yet.<br />Say hello to kick things off!
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
      <form onSubmit={handleSend} className="flex gap-2 px-3 py-2 border-t border-[#F0EDEA] bg-white">
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
