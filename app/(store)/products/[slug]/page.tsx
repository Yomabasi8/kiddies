import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { ProductDetailView } from "@/components/product/product-detail-view";
import { ProductGrid } from "@/components/shop/product-grid";
import { SectionHeading } from "@/components/storefront/section-heading";
import {
  getAllProductSlugs,
  getCategories,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog";

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description || `Shop ${product.name} at Kiddies Accessories.`,
    openGraph: { title: product.name, images: product.image ? [product.image] : undefined },
  };
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <main className="flex-1 bg-white">
      <Suspense fallback={<div className="min-h-[80vh]" />}>
        <ProductContent params={params} />
      </Suspense>
    </main>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related] = await Promise.all([getCategories(), getRelatedProducts(product)]);
  const category = categories.find((c) => c.id === product.categoryId);
  if (!category) notFound();

  const price = (product.salePrice ?? product.price) / 100;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.description,
    image: product.image ?? undefined,
    category: category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Escape "<" so product text can't break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-[120px] sm:px-6 sm:pt-[140px]">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1 text-sm font-semibold text-ink/50">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
            <li><Link href="/shop" className="hover:text-ink">Shop</Link></li>
            <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
            <li><Link href={`/shop?category=${category.slug}`} className="hover:text-ink">{category.name}</Link></li>
            <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
            <li aria-current="page" className="text-ink">{product.name}</li>
          </ol>
        </nav>

        <ProductDetailView product={product} category={category} />
      </div>

      {related.length > 0 && (
        <section className="bg-[#FDF8E9] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading eyebrow="You might also like" title="More Little Favourites" action={{ href: "/shop", label: "View all products" }} />
            <div className="mt-10">
              <ProductGrid products={related} categories={categories} columns="lg:grid-cols-4" />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
