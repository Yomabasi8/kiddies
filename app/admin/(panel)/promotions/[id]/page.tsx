import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CouponForm } from "@/components/admin/coupon-form";
import { PageTitle, btn } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";
import { loadCoupon, loadCouponOptions } from "@/lib/admin/coupon-load";

export const metadata: Metadata = { title: "Edit coupon" };
export const instant = false;

export default async function EditCouponPage({ params }: PageProps<"/admin/promotions/[id]">) {
  await requireStaff();
  const { id } = await params;
  const [coupon, { products, categories }] = await Promise.all([loadCoupon(id), loadCouponOptions()]);
  if (!coupon) notFound();
  return (
    <>
      <Link href="/admin/promotions" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Promotions</Link>
      <PageTitle title={coupon.code} />
      <CouponForm key={JSON.stringify(coupon)} initial={coupon} products={products} categories={categories} />
    </>
  );
}
