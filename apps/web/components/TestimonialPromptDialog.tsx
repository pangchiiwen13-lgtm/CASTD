"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { getSessionToken } from "@/lib/get-token";
import { cn } from "@/lib/utils";

interface Props {
  inquiryId: string;
  campaignName: string;
  onClose: () => void;
}

const STORAGE_KEY = "northstar_testimonial_done";

export function markTestimonialDone() {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "1");
}

export function hasGivenTestimonial() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function TestimonialPromptDialog({ inquiryId, campaignName, onClose }: Props) {
  const [score, setScore] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!comment.trim()) { setError("Please write a few words about your experience."); return; }
    setLoading(true); setError("");
    try {
      await api.submitRating({ inquiry_id: inquiryId, score, comment: comment.trim() }, getSessionToken() || "");
      markTestimonialDone();
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Failed to submit. Please try again.");
    } finally { setLoading(false); }
  }

  function skip() {
    markTestimonialDone(); // Don't ask again
    onClose();
  }

  return (
    <Dialog open onOpenChange={skip}>
      <DialogContent className="max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle>Thank you!</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FFD200] mx-auto mb-4 flex items-center justify-center">
                <span className="text-[#1A1A1A] font-black text-xl">ok</span>
              </div>
              <p className="text-sm text-[#6B6B6B]">
                Your review helps brands and creators discover Northstar. It may appear on our homepage.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={onClose} className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] w-full">Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="inline-flex items-center gap-2 bg-[#FFF8EC] border border-[#FFD200]/30 rounded-full px-3 py-1 mb-2 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200]" />
                <span className="text-xs font-semibold text-[#B8860B]">3 campaigns done</span>
              </div>
              <DialogTitle>You're on a roll!</DialogTitle>
              <p className="text-sm text-[#6B6B6B] mt-1">
                Tell us about your experience with <span className="font-semibold text-[#1A1A1A]">{campaignName}</span>. Your review may appear on the Northstar homepage.
              </p>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              {/* Star rating */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#1A1A1A]">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setScore(n)}
                      className="focus:outline-none"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg transition-all",
                        n <= (hovered || score) ? "bg-[#FFD200]" : "bg-[#F0E8D8]",
                      )} />
                    </button>
                  ))}
                  <span className="text-xs text-[#6B6B6B] self-center ml-1">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent!"][hovered || score]}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[#1A1A1A]">Your experience</label>
                <Textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="What did you love about working with Northstar? Any standout moments from this campaign..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-[10px] text-[#9A9A9A]">
                  Your first name and role may be shown publicly. No personal contact details are shared.
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <button
                onClick={skip}
                className="text-sm text-[#9A9A9A] hover:text-[#1A1A1A] transition-colors px-3 py-2"
              >
                Skip for now
              </button>
              <Button
                onClick={submit}
                disabled={loading}
                className="bg-[#FFD200] text-[#0C0C0C] hover:bg-[#e6bd00] flex-1"
              >
                {loading ? "Submitting..." : "Share my review"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
