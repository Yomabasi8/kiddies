import type { Metadata } from "next";
import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FlyToCartLayer } from "@/components/cart/fly-to-cart";
import { OfferProvider } from "@/components/storefront/offer-context";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { StoreClosed } from "@/components/storefront/store-closed";
import { StoreGate } from "@/components/storefront/store-gate";
import { getStoreSettings } from "@/lib/store-settings";

/** Keep search engines from indexing the maintenance page as the store. */
export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreSettings();
  return store.store_closed ? { robots: { index: false, follow: false } } : {};
}

/** Customer storefront shell. The admin dashboard gets its own layout. */
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const store = await getStoreSettings();
  return (
    <StoreGate closed={store.store_closed} closedView={<StoreClosed message={store.closed_message} reopensOn={store.reopens_on} />}>
      <OfferProvider days={store.free_delivery_first_days}>
        <AnnouncementBar />
        <SiteHeader />
        {children}
        <SiteFooter />
        <CartDrawer />
        <FlyToCartLayer />
      </OfferProvider>
    </StoreGate>
  );
}
