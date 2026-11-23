import type { Metadata } from "next";
import { PageHeader } from "@/components/storefront/page-header";
import { CategoryCard } from "@/components/storefront/category-showcase";
import { getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Categories",
  description: "Shop by category: feeding plates and bowls, cutlery, bottles, cups, bibs, lunch boxes, toys and more.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <main className="flex-1">
      <PageHeader
        title="Shop by Category"
        intro="Everything sorted the way parents shop: from first feeds to playtime."
        crumbs={[{ href: "/", label: "Home" }, { label: "Categories" }]}
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((c, i) => (
            <li key={c.id}>
              <CategoryCard category={c} index={i} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
