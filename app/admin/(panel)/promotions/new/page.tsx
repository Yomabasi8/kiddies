import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/coupon-form";
import { PageTitle, btn } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";
import { loadCouponOptions } from "@/lib/admin/coupon-load";
import { EMPTY_COUPON } from "@/lib/admin/coupon-types";

export const metadata: Metadata = { title: "Create coupon" };
export const instant = false;

export default async function NewCouponPage() {
  await requireStaff();
  const { products, categories } = await loadCouponOptions();
  return (
    <>
      <Link href="/admin/promotions" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Promotions</Link>
      <PageTitle title="Create coupon" />
      <CouponForm initial={EMPTY_COUPON} products={products} categories={categories} />
    </>
  );
}
