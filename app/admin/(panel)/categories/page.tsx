import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EyeOff, FolderPlus, FolderTree } from "lucide-react";
import { AdminEmpty, PageTitle, StatusBadge, btn } from "@/components/admin/ui";
import { FilterTabs, listHref, param, tableHead, td, th } from "@/components/admin/list-controls";
import { ACCENT_STYLES, CategoryIcon } from "@/components/storefront/category-icon";
import type { Accent, CategoryIconKey } from "@/lib/catalog/types";
import { requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Categories" };
export const instant = false;

type Row = { id: string; name: string; slug: string; image_url: string | null; icon: string; accent: string; is_visible: boolean; sort_order: number; archived_at: string | null; products: { status: string }[] };

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  await requireStaff();
  const sp = await searchParams;
  const view = param(sp, "view") === "archived" ? "archived" : "";
  const { data, error } = await createAdminClient()
    .from("categories")
    .select("id, name, slug, image_url, icon, accent, is_visible, sort_order, archived_at, products(status)")
    .order("sort_order");
  if (error) throw new Error(error.message);
  const all = (data ?? []) as Row[];
  const rows = all.filter((c) => (view ? c.archived_at : !c.archived_at));

  return (
    <>
      <PageTitle title="Categories" description="Shop categories, in the order they appear." actions={<Link href="/admin/categories/new" className={btn.primary}><FolderPlus className="size-4" /> Add category</Link>} />
      {(sp.saved || sp.archived) && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {sp.archived ? "Category archived." : `Saved “${param(sp, "saved")}”.`}
        </p>
      )}
      <FilterTabs
        active={view}
        tabs={[
          { key: "", label: "Active", count: all.filter((c) => !c.archived_at).length, href: "/admin/categories" },
          { key: "archived", label: "Archived", count: all.filter((c) => c.archived_at).length, href: listHref("/admin/categories", { view: "archived" }) },
        ]}
      />
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        {rows.length === 0 ? (
          <AdminEmpty Icon={FolderTree} title={view ? "No archived categories" : "No categories yet"} text={view ? "Archived categories appear here." : "Create categories to organise the shop."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className={tableHead}>
                <tr><th className={th}>Category</th><th className={`${th} text-right`}>Products</th><th className={th}>Visibility</th><th className={`${th} text-right`}>Order</th><th className={th}><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((c) => {
                  const active = c.products.filter((p) => p.status === "active").length;
                  return (
                    <tr key={c.id} className="hover:bg-ink/[0.02]">
                      <td className={td}>
                        <Link href={`/admin/categories/${c.id}`} className="flex items-center gap-3 font-semibold hover:text-brand">
                          <span className={`relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg ${ACCENT_STYLES[(c.accent as Accent) ?? "mint"]?.bg ?? "bg-ink/5"}`}>
                            {c.image_url ? <Image src={c.image_url} alt="" fill sizes="44px" className="object-contain p-1 mix-blend-multiply" /> : <CategoryIcon icon={c.icon as CategoryIconKey} className="size-5" />}
                          </span>
                          <span><span className="block">{c.name}</span><span className="text-xs font-normal text-ink/45">/{c.slug}</span></span>
                        </Link>
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{active}<span className="text-ink/40"> / {c.products.length}</span></td>
                      <td className={td}>{c.archived_at ? <StatusBadge status="archived" /> : c.is_visible ? <StatusBadge status="active" label="Visible" /> : <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/55"><EyeOff className="size-3.5" /> Hidden</span>}</td>
                      <td className={`${td} text-right tabular-nums text-ink/55`}>{c.sort_order}</td>
                      <td className={`${td} text-right`}><Link href={`/admin/categories/${c.id}`} className={btn.ghost}>Edit</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="mt-3 text-xs text-ink/50">Products column: active / total (including drafts and archived).</p>
    </>
  );
}
