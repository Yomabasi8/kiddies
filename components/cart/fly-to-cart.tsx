"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useCart, type Flight } from "@/lib/cart-store";

const SIZE = 72;

/**
 * Renders product thumbnails that arc from the product card into the cart
 * icon, then fires a small confetti pop on landing. Flights are only
 * launched when the visitor hasn't asked for reduced motion.
 */
export function FlyToCartLayer() {
  const flights = useCart((s) => s.flights);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden="true">
      <AnimatePresence>
        {flights.map((f) => (
          <FlyingItem key={f.id} flight={f} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function FlyingItem({ flight }: { flight: Flight }) {
  const land = useCart((s) => s.landFlight);
  const half = SIZE / 2;
  const sx = flight.from.x - half;
  const sy = flight.from.y - half;
  const ex = flight.to.x - half;
  const ey = flight.to.y - half;
  // Arc: rise above both points before swooping into the cart.
  const peakY = Math.min(sy, ey) - 120;

  async function handleLanded() {
    land(flight.id);
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 28,
      spread: 70,
      startVelocity: 18,
      scalar: 0.7,
      ticks: 90,
      origin: { x: flight.to.x / window.innerWidth, y: flight.to.y / window.innerHeight },
      colors: ["#e8573a", "#f7e14b", "#086f54", "#a5ddcf", "#f28b7b"],
      disableForReducedMotion: true,
    });
  }

  return (
    <motion.div
      className="absolute left-0 top-0 grid place-items-center overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-coral"
      style={{ width: SIZE, height: SIZE }}
      initial={{ x: sx, y: sy, scale: 1.4, opacity: 0, rotate: 0 }}
      animate={{
        x: [sx, (sx + ex) / 2, ex],
        y: [sy, peakY, ey],
        scale: [1.4, 1, 0.25],
        opacity: [0, 1, 1],
        rotate: [0, -20, 15],
      }}
      transition={{ duration: 0.75, ease: [0.45, 0, 0.2, 1], times: [0, 0.45, 1] }}
      onAnimationComplete={handleLanded}
    >
      {flight.image ? (
        <Image src={flight.image} alt="" width={SIZE} height={SIZE} className="size-full object-contain p-1.5" />
      ) : (
        <ShoppingBag className="size-8 text-coral" />
      )}
    </motion.div>
  );
}
