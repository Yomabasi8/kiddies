import type { Metadata } from "next";
import { PageHeader } from "@/components/storefront/page-header";
import { TrackOrderForm } from "@/components/orders/track-order-form";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your Kiddies Accessories order with your order reference.",
};

export default function TrackOrderPage() {
  return (
    <main className="flex-1">
      <PageHeader
        title="Track Your Order"
        intro="Where are your little treasures? Let's find out."
        crumbs={[{ href: "/", label: "Home" }, { label: "Track order" }]}
      />
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
        <TrackOrderForm />
      </div>
    </main>
  );
}
