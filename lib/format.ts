const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

/** Format a kobo amount as Naira, e.g. 1250000 → "₦12,500". */
export function formatPrice(kobo: number) {
  return naira.format(kobo / 100);
}

export function discountPercent(price: number, salePrice: number) {
  return Math.round(((price - salePrice) / price) * 100);
}
