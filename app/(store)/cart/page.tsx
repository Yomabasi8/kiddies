import type { Metadata } from "next";
import { PageHeader } from "@/components/storefront/page-header";
import { CartPageView } from "@/components/cart/cart-page-view";

export const metadata: Metadata = { title: "Your Cart" };

export default function CartPage() {
  return (
    <main className="flex-1">
      <PageHeader title="Your Cart" crumbs={[{ href: "/", label: "Home" }, { label: "Cart" }]} />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <CartPageView />
      </div>
    </main>
  );
}
