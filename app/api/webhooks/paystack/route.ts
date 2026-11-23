import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidWebhookSignature } from "@/lib/payments/paystack";
import { settlePayment } from "@/lib/payments/settle";

/**
 * Paystack webhook. Every event is:
 *  1. Authenticated: HMAC-SHA512 signature with our secret key.
 *  2. De-duplicated: stored with a unique (provider, event_key); repeats are
 *     acknowledged and ignored.
 *  3. Re-verified: charge.success triggers a direct verify call to Paystack
 *     before anything is marked paid.
 * Always answers 200 for authentic events so Paystack stops retrying; real
 * failures return 500 so Paystack retries later.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!isValidWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { id?: number; reference?: string; status?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }
  const type = event.event ?? "unknown";
  const reference = event.data?.reference ?? "";
  const eventKey = `${type}:${event.data?.id ?? reference}`;

  const db = createAdminClient();
  const { data: stored, error: insertError } = await db
    .from("payment_events")
    .insert({ provider: "paystack", event_key: eventKey, event_type: type, payload: event })
    .select("id")
    .maybeSingle();

  if (insertError) {
    if (insertError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("[paystack webhook] storing event failed", insertError.message);
    return NextResponse.json({ error: "storage failed" }, { status: 500 });
  }

  let result = "ignored";
  try {
    if (type === "charge.success" && reference) result = await settlePayment(reference);
  } catch (err) {
    console.error("[paystack webhook] settle failed", reference, err);
    // Let Paystack retry: remove our record so the retry isn't treated as a duplicate.
    await db.from("payment_events").delete().eq("id", stored!.id);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }

  await db.from("payment_events").update({ processed_at: new Date().toISOString(), result }).eq("id", stored!.id);
  return NextResponse.json({ received: true, result });
}
