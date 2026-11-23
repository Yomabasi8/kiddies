import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { FlyToCartLayer } from "@/components/cart/fly-to-cart";

/** Customer storefront shell. The admin dashboard gets its own layout. */
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <CartDrawer />
      <FlyToCartLayer />
    </>
  );
}
