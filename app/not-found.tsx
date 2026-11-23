import Link from "next/link";
import { Mascot } from "@/components/storefront/mascot";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-brand px-6 text-center text-white">
      <p className="font-display text-[clamp(7rem,30vw,16rem)] font-semibold leading-none text-white/10" aria-hidden="true">
        404
      </p>
      <Mascot className="-mt-24 w-32 sm:-mt-36 sm:w-40" />
      <h1 className="mt-6 font-display text-3xl font-semibold sm:text-5xl">Oops! This page wandered off.</h1>
      <p className="mt-3 max-w-md text-[15px] text-white/80">
        We couldn&apos;t find what you were looking for. Let&apos;s get you back to the good stuff.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href="/" className="inline-flex h-12 items-center rounded-full bg-sunny px-8 text-[15px] font-extrabold text-ink shadow-pop transition-transform hover:-translate-y-0.5">
          Back to home
        </Link>
        <Link href="/shop" className="inline-flex h-12 items-center rounded-full border-2 border-white/70 px-7 text-[15px] font-bold transition-colors hover:bg-white hover:text-brand">
          Browse the shop
        </Link>
      </div>
    </main>
  );
}
