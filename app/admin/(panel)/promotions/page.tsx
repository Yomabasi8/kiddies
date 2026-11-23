import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Promotions" };
export const instant = false;

export default async function Page() {
  await requireStaff();
  return (
    <ComingNext
      title={"Promotions"}
      description={"Coupon codes and discount campaigns."}
      features={["Percentage and fixed-amount coupons", "Start and end dates, minimum spend", "Limit to products or categories", "Usage limits and activation"]}
    />
  );
}
