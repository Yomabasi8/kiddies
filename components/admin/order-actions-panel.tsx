"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Truck } from "lucide-react";
import { addOrderNote, recordRefund, saveTracking, setOrderStatus, type ActionResult } from "@/lib/admin/order-actions";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./confirm-dialog";
import { btn, field } from "./ui";

type Props = {
  orderId: string;
  status: string;
  paid: boolean;
  refundable: number; // kobo remaining
  tracking: { number: string; url: string };
};

const NEXT: Record<string, { to: "processing" | "dispatched" | "delivered"; label: string }> = {
  paid: { to: "processing", label: "Start processing" },
  processing: { to: "dispatched", label: "Mark as dispatched" },
  dispatched: { to: "delivered", label: "Mark as delivered" },
};
const CANCELLABLE = ["pending", "paid", "processing"];

export function OrderActionsPanel({ orderId, status, paid, refundable, tracking }: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [note, setNote] = useState("");
  const [trackNo, setTrackNo] = useState(tracking.number);
  const [trackUrl, setTrackUrl] = useState(tracking.url);
  const [internalNote, setInternalNote] = useState("");
  const [refundAmount, setRefundAmount] = useState(refundable ? String(refundable / 100) : "");
  const [restock, setRestock] = useState(true);
  const [confirm, setConfirm] = useState<null | "cancel" | "refund">(null);

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) after?.();
      setConfirm(null);
    });

  const next = NEXT[status];

  return (
    <div className="space-y-5">
      {result && (
        <p role="status" className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold", result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>
          {result.ok && <CheckCircle2 className="size-4" />} {result.message}
        </p>
      )}

      {/* Fulfilment */}
      {(next || CANCELLABLE.includes(status)) && (
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Note for the timeline <span className="font-normal text-ink/45">(optional)</span></span>
            <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Handed to rider" />
          </label>
          <div className="flex flex-wrap gap-2">
            {next && (
              <button type="button" disabled={pending} onClick={() => run(() => setOrderStatus(orderId, next.to, note), () => setNote(""))} className={btn.primary}>
                {next.to === "dispatched" && <Truck className="size-4" />} {next.label}
              </button>
            )}
            {CANCELLABLE.includes(status) && (
              <button type="button" disabled={pending} onClick={() => setConfirm("cancel")} className={cn(btn.secondary, "text-red-600")}>Cancel order</button>
            )}
          </div>
          {status === "pending" && <p className="text-xs text-ink/50">This order hasn&apos;t been paid. It moves forward automatically once the payment is verified.</p>}
        </div>
      )}

      {/* Tracking */}
      {paid && !["cancelled", "refunded"].includes(status) && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => saveTracking(orderId, trackNo, trackUrl)); }} className="space-y-3 border-t border-ink/10 pt-5">
          <p className="text-sm font-bold">Delivery tracking</p>
          <input className={field} value={trackNo} onChange={(e) => setTrackNo(e.target.value)} placeholder="Tracking number" aria-label="Tracking number" />
          <input className={field} value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} placeholder="https:// tracking link (optional)" aria-label="Tracking link" />
          <button type="submit" disabled={pending} className={btn.secondary}>Save tracking</button>
        </form>
      )}

      {/* Refund */}
      {paid && refundable > 0 && (
        <div className="space-y-3 border-t border-ink/10 pt-5">
          <p className="text-sm font-bold">Record a refund</p>
          <p className="text-xs text-ink/55">First refund the customer in your Paystack dashboard, then record it here.</p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink/60">Amount refunded (₦)</span>
            <input className={field} inputMode="decimal" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="size-4 accent-[#086f54]" />
            Items were returned, so put them back in stock
          </label>
          <button type="button" disabled={pending} onClick={() => setConfirm("refund")} className={btn.secondary}>Record refund</button>
        </div>
      )}

      {/* Internal notes */}
      <form onSubmit={(e) => { e.preventDefault(); run(() => addOrderNote(orderId, internalNote), () => setInternalNote("")); }} className="space-y-3 border-t border-ink/10 pt-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Add internal note</span>
          <textarea className={cn(field, "h-20 py-2")} value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Only staff can see this" />
        </label>
        <button type="submit" disabled={pending || !internalNote.trim()} className={btn.secondary}>Add note</button>
      </form>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm === "cancel" ? "Cancel this order?" : "Record this refund?"}
        message={
          confirm === "cancel"
            ? paid
              ? "The items go back into stock and the order is flagged until you refund the customer and record the refund."
              : "The customer hasn't paid, so no refund is needed."
            : `This records a refund of ₦${refundAmount}. Make sure you've already refunded the customer in Paystack.`
        }
        confirmLabel={confirm === "cancel" ? "Cancel order" : "Record refund"}
        tone={confirm === "cancel" ? "danger" : "primary"}
        busy={pending}
        onConfirm={() =>
          confirm === "cancel"
            ? run(() => setOrderStatus(orderId, "cancelled", note))
            : run(() => recordRefund(orderId, refundAmount, restock, note))
        }
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
