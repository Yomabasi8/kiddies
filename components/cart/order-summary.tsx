import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Subtotal / discount / delivery / total breakdown. */
export function OrderSummaryTotals({
  subtotal,
  discount = 0,
  delivery,
  className,
}: {
  subtotal: number;
  discount?: number;
  /** Delivery fee in kobo, or null when not yet known. */
  delivery: number | null;
  className?: string;
}) {
  const total = subtotal - discount + (delivery ?? 0);
  return (
    <dl className={cn("space-y-2.5 text-[15px]", className)}>
      <div className="flex justify-between">
        <dt className="text-ink/65">Subtotal</dt>
        <dd className="font-bold">{formatPrice(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-brand">
          <dt>Discount</dt>
          <dd className="font-bold">−{formatPrice(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-ink/65">Delivery</dt>
        <dd className={delivery === null ? "text-sm text-ink/50" : "font-bold"}>
          {delivery === null ? "Calculated at checkout" : delivery === 0 ? "Free" : formatPrice(delivery)}
        </dd>
      </div>
      <div className="flex justify-between border-t-2 border-ink/10 pt-3 text-lg">
        <dt className="font-display font-semibold">Total</dt>
        <dd className="font-extrabold">{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}
