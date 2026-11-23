import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { PageTitle, btn } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";
import { loadCategoryOptions, loadProductForm } from "@/lib/admin/product-load";

export const metadata: Metadata = { title: "Edit product" };
export const instant = false;

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireStaff();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [product, categories] = await Promise.all([loadProductForm(id), loadCategoryOptions()]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Products</Link>
      <PageTitle title={product.name} description={`SKU ${product.sku}`} />
      {sp.saved && (
        <p role="status" className="mb-5 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="size-4" />
          {sp.saved === "published" ? "Saved and published. It's live in the shop." : "Saved as a draft. It's not visible in the shop."}
        </p>
      )}
      {/* key: reset the form state after each save */}
      <ProductForm key={JSON.stringify(product)} initial={product} categories={categories} />
    </>
  );
}
