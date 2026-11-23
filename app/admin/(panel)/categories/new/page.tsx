import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { PageTitle, btn } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Add category" };
export const instant = false;

export default async function NewCategoryPage() {
  await requireStaff();
  return (
    <>
      <Link href="/admin/categories" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Categories</Link>
      <PageTitle title="Add category" />
      <CategoryForm
        initial={{ name: "", slug: "", description: "", imageUrl: "", imageStyle: "cutout", icon: "other", accent: "mint", isVisible: true, sortOrder: "100" }}
        archived={false}
        productCount={0}
        otherCategories={[]}
      />
    </>
  );
}
