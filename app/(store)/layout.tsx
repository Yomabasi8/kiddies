import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FlyToCartLayer } from "@/components/cart/fly-to-cart";
import { OfferProvider } from "@/components/storefront/offer-context";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { getStoreSettings } from "@/lib/store-settings";

/** Customer storefront shell. The admin dashboard gets its own layout. */
export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const store = await getStoreSettings();
  return (
    <OfferProvider days={store.free_delivery_first_days}>
      <AnnouncementBar />
      <SiteHeader />
      {children}
      <SiteFooter />
      <CartDrawer />
      <FlyToCartLayer />
    </OfferProvider>
  );
}
