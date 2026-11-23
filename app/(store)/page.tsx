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

  return (
    <main className="flex-1">
      <Hero />
      <CategoryShowcase categories={categories} />
      <ProductShowcase products={products} categories={categories} />
      <Testimonials items={testimonials} />
      <BestStartBanner />
      <CollectionsBento />
    </main>
  );
}
