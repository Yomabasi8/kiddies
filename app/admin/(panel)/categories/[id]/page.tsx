import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { PageTitle, btn } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Edit category" };
export const instant = false;

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  await requireStaff();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = createAdminClient();
  const [{ data: c }, { count }, { data: others }] = await Promise.all([
    db.from("categories").select("*").eq("id", id).maybeSingle(),
    db.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    db.from("categories").select("id, name").is("archived_at", null).neq("id", id).order("sort_order"),
  ]);
  if (!c) notFound();
  return (
    <>
      <Link href="/admin/categories" className={`${btn.ghost} -ml-3 mb-2`}><ChevronLeft className="size-4" /> Categories</Link>
      <PageTitle title={c.name} description={`${count ?? 0} product${count === 1 ? "" : "s"}`} />
      <CategoryForm
        key={c.updated_at}
        initial={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", imageUrl: c.image_url ?? "", imageStyle: c.image_style, icon: c.icon, accent: c.accent, isVisible: c.is_visible, sortOrder: String(c.sort_order) }}
        archived={!!c.archived_at}
        productCount={count ?? 0}
        otherCategories={others ?? []}
      />
    </>
  );
}
