import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle, btn } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";
import { EMPTY_PRODUCT, loadCategoryOptions } from "@/lib/admin/product-load";

export const metadata: Metadata = { title: "Add product" };
export const instant = false;

export default async function NewProductPage() {
  await requireStaff();
  const categories = await loadCategoryOptions();
  return (
    <>
      <Link href="/admin/products" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Products</Link>
      <PageTitle title="Add product" description="Save as a draft any time; publish when it's ready for the shop." />
      <ProductForm initial={EMPTY_PRODUCT} categories={categories} />
    </>
  );
}
