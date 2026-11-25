import type { Metadata } from "next";
import { PageHeader } from "@/components/storefront/page-header";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { getDeliveryMethods } from "@/lib/delivery-data";
import { getStoreSettings } from "@/lib/store-settings";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [deliveryMethods, store] = await Promise.all([getDeliveryMethods(), getStoreSettings()]);
  return (
    <main className="flex-1">
      <PageHeader
        title="Checkout"
        intro="No account needed. Just your details and you're done."
        crumbs={[{ href: "/", label: "Home" }, { href: "/cart", label: "Cart" }, { label: "Checkout" }]}
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <CheckoutView deliveryMethods={deliveryMethods} freeDeliveryDays={store.free_delivery_first_days} />
      </div>
    </main>
  );
}
