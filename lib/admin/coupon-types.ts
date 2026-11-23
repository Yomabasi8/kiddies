/** Coupon form values (strings as typed; Naira for fixed amounts). */
export type CouponFormValues = {
  id?: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed";
  value: string;
  minSubtotal: string;
  scope: "all" | "products" | "categories";
  productIds: string[];
  categoryIds: string[];
  startsAt: string; // datetime-local
  endsAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  isActive: boolean;
};

export const EMPTY_COUPON: CouponFormValues = {
  code: "", description: "", discountType: "percent", value: "", minSubtotal: "", scope: "all",
  productIds: [], categoryIds: [], startsAt: "", endsAt: "", usageLimit: "", perCustomerLimit: "1", isActive: true,
};
