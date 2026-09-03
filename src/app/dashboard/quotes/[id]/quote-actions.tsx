"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Download, MessageSquare, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { approveQuote, approveQuoteInternally, requestQuoteChanges } from "./actions";

export function QuoteActions({ quoteId, quoteStatus, isStaff = false }: { quoteId: string; quoteStatus: string; isStaff?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approved, setApproved] = useState(quoteStatus === "ACCEPTED");

  const isFinal = ["DECLINED", "EXPIRED", "CANCELLED"].includes(quoteStatus);

  function handleInternalApproval() {
    setError(null);
    startTransition(async () => {
      const res = await approveQuoteInternally(quoteId);
      if (res.ok) setMessage("Final team approval recorded. The client can now review and approve the quote.");
      else setError(res.error);
    });
  }

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const res = await approveQuote(quoteId);
      if (res.ok) {
        setApproved(true);
        setMessage("Quote approved. Pay the project deposit below to start work.");
      } else setError(res.error);
    });
  }

  async function handleCheckout() {
    setError(null);
    setCheckoutPending(true);
    try {
      const res = await fetch(`/api/v1/quotes/${quoteId}/checkout`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not start checkout.");
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("Could not reach the payment service. Please try again.");
    } finally {
      setCheckoutPending(false);
    }
  }

  function handleRequestChanges() {
    setError(null);
    startTransition(async () => {
      const res = await requestQuoteChanges(quoteId, reason);
      if (res.ok) {
        setMessage("Your request has been sent to BRIEVV's team for review.");
        setMode("idle");
        setReason("");
      } else setError(res.error);
    });
  }

  return (
    <div className="space-y-4">
      {isStaff && quoteStatus === "PENDING_REVIEW" && (
        <div className="rounded border border-orange/30 bg-orange/5 px-4 py-3">
          <p className="text-sm text-ink">This quote is awaiting final BRIEVV team approval.</p>
          <Button className="mt-3" onClick={handleInternalApproval} isLoading={pending}>
            Approve for client review
          </Button>
        </div>
      )}
      {isStaff && <p className="text-xs text-steel">Team approval is required before the client can approve or pay.</p>}
      {!isStaff && <>
      {error && <p className="font-mono text-xs text-danger">{error}</p>}
      {message && !approved && <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-ink">{message}</p>}

      {approved ? (
        <div className="space-y-3">
          {message && <p className="rounded border border-success/30 bg-success/5 px-4 py-3 text-sm text-ink">{message}</p>}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCheckout} isLoading={checkoutPending}>
              <CreditCard size={15} /> Pay Deposit &amp; Start Project
            </Button>
            <a
              href={`/api/v1/quotes/${quoteId}/pdf`}
              className="ml-auto inline-flex items-center gap-1.5 text-sm text-steel hover:text-ink"
            >
              <Download size={15} /> Download PDF
            </a>
          </div>
        </div>
      ) : mode === "changes" ? (
        <div className="space-y-3">
          <Textarea
            rows={4}
            placeholder="What would you like BRIEVV to change about this quote?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button onClick={handleRequestChanges} isLoading={pending}>
              Send request
            </Button>
            <Button variant="ghost" onClick={() => setMode("idle")} disabled={pending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleApprove} isLoading={pending} disabled={isFinal || quoteStatus !== "READY"}>
            Approve Quote
          </Button>
          <Button variant="outline" onClick={() => setMode("changes")} disabled={isFinal || pending}>
            <MessageSquare size={15} /> Request changes
          </Button>
          <Link href="/contact" className="inline-flex items-center gap-2 text-sm font-medium text-orange hover:underline">
            Talk to BRIEVV
          </Link>
          <a
            href={`/api/v1/quotes/${quoteId}/pdf`}
            className="ml-auto inline-flex items-center gap-1.5 text-sm text-steel hover:text-ink"
          >
            <Download size={15} /> Download PDF
          </a>
        </div>
      )}
      </>}
    </div>
  );
}
