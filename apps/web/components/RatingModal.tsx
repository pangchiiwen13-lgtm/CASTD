"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  inquiryId: string;
  campaignName: string;
  onClose: () => void;
  onDone: () => void;
}

export function RatingModal({ inquiryId, campaignName, onClose, onDone }: Props) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (score === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError("");
    const token = (typeof window !== "undefined"
      ? (window as any).__northstar_session_token
      : null) || getSessionToken() || "";
    try {
      await api.submitRating(
        { inquiry_id: inquiryId, score, comment: comment.trim() || undefined },
        token
      );
      onDone();
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const display = hovered || score;

  const labels: Record<number, string> = {
    1: "Poor",
    2: "Below average",
    3: "Good",
    4: "Great",
    5: "Outstanding",
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rate this collaboration</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground -mt-2 mb-4 truncate">
          {campaignName}
        </p>

        {/* Stars */}
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="text-4xl leading-none transition-transform hover:scale-110 active:scale-95"
              style={{ color: n <= display ? "#FFD200" : "#EBEBEB" }}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setScore(n)}
            >
              <span
                className="w-8 h-8 inline-block transition-all"
                style={{
                  clipPath: "polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
                  backgroundColor: n <= display ? "#FFD200" : "#EBEBEB",
                }}
              />
            </button>
          ))}
          {display > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">{labels[display]}</span>
          )}
        </div>

        {/* Comment */}
        <div className="mt-4">
          <Textarea
            placeholder="Share what made this experience stand out (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={400}
            className="resize-none text-sm"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{comment.length}/400</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00]"
            onClick={submit}
            disabled={submitting || score === 0}
          >
            {submitting ? "Submitting..." : "Submit review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
