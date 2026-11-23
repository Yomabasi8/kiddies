import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Truck } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { Mascot } from "@/components/storefront/mascot";

export const metadata: Metadata = { title: "Your Account", robots: { index: false } };

/**
 * TODO(supabase-auth): registration, login, logout, password recovery,
 * profile, saved addresses and order history.
 */
export default function AccountPage() {
  return (
    <main className="flex-1">
      <PageHeader title="Your Account" crumbs={[{ href: "/", label: "Home" }, { label: "Account" }]} />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 text-center sm:px-6">
        <Mascot className="mx-auto w-28" color="#4FB3A5" />
        <h2 className="mt-6 font-display text-3xl font-semibold">Customer accounts are coming soon</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-ink/65">
          You don&apos;t need an account to shop with us. Check out as a guest and keep track of your order with your order reference.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link href="/shop" className="group flex items-center gap-4 rounded-3xl border-[3px] border-ink bg-white p-6 text-left shadow-[0_6px_0_0_#1b1b1b] transition-transform hover:-translate-y-1">
            <span className="grid size-12 place-items-center rounded-2xl bg-sunny"><ShoppingBag className="size-5" /></span>
            <span><span className="block font-bold">Keep shopping</span><span className="text-sm text-ink/55">Browse all products</span></span>
          </Link>
          <Link href="/track-order" className="group flex items-center gap-4 rounded-3xl border-[3px] border-ink bg-white p-6 text-left shadow-[0_6px_0_0_#1b1b1b] transition-transform hover:-translate-y-1">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#A5DDCF]"><Truck className="size-5" /></span>
            <span><span className="block font-bold">Track an order</span><span className="text-sm text-ink/55">Use your order reference</span></span>
          </Link>
        </div>
      </div>
    </main>
  );
}
