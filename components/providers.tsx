"use client";

import { useEffect } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { ReactLenis } from "lenis/react";
import { Toaster } from "sonner";
import { useCart } from "@/lib/cart-store";

/**
 * App-wide client providers: Motion respects the visitor's reduced-motion
 * setting, Lenis smooth scrolling is skipped entirely when it is on, and
 * the persisted cart is loaded after mount.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    useCart.persist.rehydrate();

    // Supabase falls back to the site root when an email link's redirect
    // isn't allow-listed; forward invite/reset tokens to the right page.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const type = hash.get("type");
    if (
      hash.get("access_token") &&
      (type === "invite" || type === "recovery") &&
      window.location.pathname !== "/admin/set-password"
    ) {
      window.location.replace(`/admin/set-password${window.location.hash}`);
    }
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      {reduceMotion ? (
        children
      ) : (
        <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
          {children}
        </ReactLenis>
      )}
      <Toaster
        position="top-center"
        richColors
        closeButton
        offset={96}
        toastOptions={{ className: "!rounded-2xl !font-sans" }}
      />
    </MotionConfig>
  );
}
