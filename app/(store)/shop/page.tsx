import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { EmptyState } from "@/components/storefront/empty-state";
import { ShopFilters } from "@/components/shop/shop-filters";
import { SortSelect } from "@/components/shop/sort-select";
import { ProductGrid, ProductGridSkeleton } from "@/components/shop/product-grid";
import { AGE_FILTERS, MATERIAL_FILTERS, getCategories, searchProducts } from "@/lib/catalog";
import { parseShopParams, shopHref, type RawParams } from "@/lib/catalog/shop-params";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse feeding sets, bottles and cups, bibs, lunch boxes, toys and kids' accessories. Filter by category, price, age and material.",
};

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <main className="flex-1">
      <PageHeader
        title="Shop All"
        intro="Feeding essentials, mealtime must-haves and playful finds for your little stars."
        crumbs={[{ href: "/", label: "Home" }, { label: "Shop" }]}
      />
      {/* Search params are request-time data, so results stream in. */}
      <Suspense fallback={<ShopFallback />}>
        <ShopResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ShopResults({ searchParams }: { searchParams: Promise<RawParams> }) {
  const raw = await searchParams;
  const query = parseShopParams(raw);
  const [result, categories] = await Promise.all([searchProducts(query), getCategories()]);
  const category = categories.find((c) => c.slug === query.category);

  // Removable chips for each active filter.
  const chips: { label: string; href: string }[] = [];
  if (query.q) chips.push({ label: `“${query.q}”`, href: shopHref(raw, { q: undefined, page: undefined }) });
  if (category) chips.push({ label: category.name, href: shopHref(raw, { category: undefined, page: undefined }) });
  if (query.minPrice !== undefined) chips.push({ label: `From ${formatPrice(query.minPrice)}`, href: shopHref(raw, { min: undefined, page: undefined }) });
  if (query.maxPrice !== undefined) chips.push({ label: `Up to ${formatPrice(query.maxPrice)}`, href: shopHref(raw, { max: undefined, page: undefined }) });
  const age = AGE_FILTERS.find((a) => a.months === query.ageMonths);
  if (age) chips.push({ label: `Age ${age.label}`, href: shopHref(raw, { age: undefined, page: undefined }) });
  if (query.material) chips.push({ label: query.material, href: shopHref(raw, { material: undefined, page: undefined }) });
  if (query.inStock) chips.push({ label: "In stock", href: shopHref(raw, { in_stock: undefined, page: undefined }) });
  if (query.onSale) chips.push({ label: "On sale", href: shopHref(raw, { on_sale: undefined, page: undefined }) });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6">
      <ShopFilters
            // Re-mount on navigation so inputs reflect the URL.
            key={JSON.stringify(query)}
            query={query}
            categories={categories}
            ageFilters={AGE_FILTERS}
            materials={MATERIAL_FILTERS}
            autoFocusSearch={raw.focus === "search"}
            activeCount={chips.filter((c) => !c.label.startsWith("“")).length}
          >
        <section aria-labelledby="results-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-heading" className="text-[15px] font-bold text-ink">
              {result.total} {result.total === 1 ? "product" : "products"}
              {category && <span className="font-semibold text-ink/50"> in {category.name}</span>}
            </h2>
            <SortSelect value={query.sort ?? "featured"} />
          </div>

          {chips.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link
                    href={c.href}
                    scroll={false}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-sm font-bold text-brand hover:bg-brand hover:text-white"
                  >
                    {c.label}
                    <X className="size-3.5" aria-label="Remove filter" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" scroll={false} className="inline-flex px-2 py-1.5 text-sm font-bold text-ink/50 underline-offset-4 hover:text-ink hover:underline">
                  Clear all
                </Link>
              </li>
            </ul>
          )}

          <div className="mt-8">
            {result.items.length > 0 ? (
              <ProductGrid products={result.items} categories={categories} />
            ) : (
              <EmptyState
                title="No matches yet"
                message="We couldn't find products matching those filters. Try removing one or searching for something else."
                action={{ href: "/shop", label: "Clear filters" }}
              />
            )}
          </div>

          {result.pageCount > 1 && (
            <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-2">
              <PageLink href={shopHref(raw, { page: String(result.page - 1) })} disabled={result.page <= 1} label="Previous page">
                <ChevronLeft className="size-5" />
              </PageLink>
              {Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) => (
                <PageLink key={n} href={shopHref(raw, { page: n === 1 ? undefined : String(n) })} active={n === result.page} label={`Page ${n}`}>
                  {n}
                </PageLink>
              ))}
              <PageLink href={shopHref(raw, { page: String(result.page + 1) })} disabled={result.page >= result.pageCount} label="Next page">
                <ChevronRight className="size-5" />
              </PageLink>
            </nav>
          )}
        </section>
      </ShopFilters>
    </div>
  );
}

function PageLink({
  href,
  children,
  label,
  active,
  disabled,
}: {
  href: string;
  children: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const cls = cn(
    "grid size-11 place-items-center rounded-full border-2 text-sm font-extrabold transition-colors",
    active ? "border-ink bg-ink text-white" : "border-ink/10 text-ink hover:border-ink",
    disabled && "pointer-events-none opacity-30",
  );
  if (disabled) return <span className={cls} aria-hidden="true">{children}</span>;
  return (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={cls}>
      {children}
    </Link>
  );
}

function ShopFallback() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6">
      <div className="h-13 w-full animate-pulse rounded-full bg-ink/[0.06]" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-5 animate-pulse rounded-full bg-ink/[0.06]" />
          ))}
        </div>
        <ProductGridSkeleton />
      </div>
    </div>
  );
}
