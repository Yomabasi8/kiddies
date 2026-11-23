import "server-only";
import { revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/catalog";
import { summarise, verifyTransaction } from "./paystack";

export type SettleOutcome =
  | "confirmed" // just verified and confirmed now
  | "already_confirmed" // verified earlier (e.g. webhook beat the redirect)
  | "stock_shortfall" // paid, but flagged: not enough stock
  | "amount_mismatch" // paid amount didn't match: flagged, not confirmed
  | "pending" // still processing at Paystack
  | "failed" // failed or abandoned
  | "not_found"; // unknown reference

/**
 * Verify a payment WITH PAYSTACK and record the result. Used by both the
 * browser redirect and the webhook; safe to call any number of times.
 * An order is only ever marked paid from here, never from client input.
 */
export async function settlePayment(reference: string): Promise<SettleOutcome> {
  if (!/^KAP-[A-Z0-9]{12,32}$/.test(reference)) return "not_found";
  const db = createAdminClient();

  const tx = await verifyTransaction(reference);
  const raw = summarise(tx);

  if (tx.status === "success") {
    if (tx.currency !== "NGN") {
      await db.from("orders").update({ needs_attention: true, attention_reason: `Paid in unexpected currency ${tx.currency}` }).eq("id", (await orderIdFor(reference)) ?? "");
      return "amount_mismatch";
    }
    const { data, error } = await db.rpc("confirm_order_payment", {
      p_reference: reference,
      p_amount: tx.amount,
      p_provider_transaction_id: String(tx.id),
      p_channel: tx.channel,
      p_paid_at: tx.paid_at,
      p_raw: raw,
    });
    if (error) throw new Error(`Recording payment failed: ${error.message}`);
    if (data === "confirmed" || data === "stock_shortfall") revalidateTag(CATALOG_TAG, "max"); // stock changed
    return data as SettleOutcome;
  }

  if (tx.status === "failed" || tx.status === "abandoned" || tx.status === "reversed") {
    await db.rpc("mark_payment_unsuccessful", { p_reference: reference, p_status: tx.status === "abandoned" ? "abandoned" : "failed", p_raw: raw });
    return "failed";
  }
  return "pending";
}

async function orderIdFor(reference: string) {
  const { data } = await createAdminClient().from("payments").select("order_id").eq("reference", reference).maybeSingle();
  return data?.order_id as string | undefined;
}
