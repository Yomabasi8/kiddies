import Image from "next/image";
import { ShieldCheck } from "lucide-react";

/** Split-screen frame for admin sign-in pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-[#F4F6F5] lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-white px-3 py-2">
            <Image src="/images/logo.png" alt="Kiddies Accessories" width={900} height={550} className="h-14 w-auto" preload />
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">Admin</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold leading-tight">Run the whole store from one place.</h2>
          <p className="mt-4 max-w-sm text-white/75">Products, orders, stock, customers and promotions, all connected to your storefront.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/60">
          <ShieldCheck className="size-4" /> Authorised staff only. Activity is logged.
        </p>
        <svg viewBox="0 0 200 200" className="absolute -bottom-20 -right-20 w-96 text-white/5" aria-hidden="true">
          {[0, 90, 180, 270].map((r) => (
            <path key={r} transform={`rotate(${r} 100 100)`} fill="currentColor" d="M100 100 C100 60 130 20 170 30 C200 40 190 90 150 100 Z" />
          ))}
        </svg>
      </aside>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Image src="/images/logo.png" alt="Kiddies Accessories" width={900} height={550} className="mb-8 h-16 w-auto lg:hidden" />
          <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink/60">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  );
}

export const adminInput =
  "h-11 w-full rounded-lg border border-ink/15 bg-white px-3.5 text-[15px] outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/15";
export const adminButton =
  "inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60";
