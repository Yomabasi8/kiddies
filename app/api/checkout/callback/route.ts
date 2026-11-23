import { NextResponse, type NextRequest } from "next/server";
import { settlePayment } from "@/lib/payments/settle";

/**
 * Paystack sends the customer back here after paying. We verify the payment
 * with Paystack (never trusting the redirect itself), record it, then show
 * the confirmation page.
 */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref") ?? "";
  let outcome = "error";
  try {
    outcome = await settlePayment(reference);
  } catch (err) {
    console.error("[checkout/callback] verification failed", reference, err);
  }
  const url = new URL("/order/confirmed", request.url);
  url.searchParams.set("ref", reference);
  url.searchParams.set("outcome", outcome);
  return NextResponse.redirect(url, 303);
}
