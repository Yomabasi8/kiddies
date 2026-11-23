import { Hero } from "@/components/storefront/hero";
import { CategoryShowcase } from "@/components/storefront/category-showcase";
import { ProductShowcase } from "@/components/storefront/product-showcase";
import { CollectionsBento } from "@/components/storefront/collections-bento";
import { Testimonials } from "@/components/storefront/testimonials";
import { BestStartBanner } from "@/components/storefront/best-start-banner";
import { getCategories, getFeaturedProducts } from "@/lib/catalog";
import { getTestimonials } from "@/lib/testimonials";

export default async function Home() {
  const [categories, products, testimonials] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getTestimonials(),
  ]);

  // Hero spotlight: featured products that have photography.
  const spotlight = products.filter((p) => p.image).slice(0, 6);

  return (
    <main className="flex-1">
      <Hero products={spotlight} categories={categories} />
      <CategoryShowcase categories={categories} />
      <ProductShowcase products={products} categories={categories} />
      <Testimonials items={testimonials} />
      <BestStartBanner />
      <CollectionsBento />
    </main>
  );
}
