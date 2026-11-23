import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared admin building blocks: page header, cards, stat cards, badges. */

export function PageTitle({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink/55">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-ink/10 bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-3.5">
          <h2 className="text-[15px] font-bold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, Icon, tone = "brand", href }: { label: string; value: string; hint?: string; Icon: LucideIcon; tone?: "brand" | "amber" | "coral" | "sky"; href?: string }) {
  const tones = {
    brand: "bg-brand/10 text-brand",
    amber: "bg-amber-100 text-amber-700",
    coral: "bg-red-100 text-red-700",
    sky: "bg-sky-100 text-sky-700",
  };
  const body = (
    <div className="flex h-full items-start justify-between gap-3 rounded-xl border border-ink/10 bg-white p-5 transition-shadow hover:shadow-sm">
      <div>
        <p className="text-sm font-semibold text-ink/55">{label}</p>
        <p className="mt-2 text-2xl font-extrabold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
      </div>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", tones[tone])}>
        <Icon className="size-5" />
      </span>
    </div>
  );
  return href ? <Link href={href} className="block rounded-xl focus-visible:ring-4 focus-visible:ring-brand/20">{body}</Link> : body;
}

const STATUS_STYLES: Record<string, string> = {
  // Order statuses
  pending: "bg-ink/5 text-ink/70",
  paid: "bg-sky-100 text-sky-800",
  processing: "bg-indigo-100 text-indigo-800",
  dispatched: "bg-amber-100 text-amber-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  refunded: "bg-zinc-200 text-zinc-700",
  // Payment statuses
  success: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  abandoned: "bg-zinc-200 text-zinc-700",
  partially_refunded: "bg-zinc-200 text-zinc-700",
  // Product statuses
  active: "bg-emerald-100 text-emerald-800",
  draft: "bg-ink/5 text-ink/70",
  archived: "bg-zinc-200 text-zinc-700",
  // Stock
  "in stock": "bg-emerald-100 text-emerald-800",
  "low stock": "bg-amber-100 text-amber-800",
  "out of stock": "bg-red-100 text-red-800",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold capitalize", STATUS_STYLES[status] ?? "bg-ink/5 text-ink/70")}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function AdminEmpty({ Icon, title, text, action }: { Icon: LucideIcon; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-ink/5 text-ink/40">
        <Icon className="size-6" />
      </span>
      <p className="mt-3 font-bold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-ink/55">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const btn = {
  primary: "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60",
  secondary: "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ink/15 bg-white px-4 text-sm font-bold text-ink transition-colors hover:bg-ink/5 disabled:opacity-60",
  danger: "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60",
  ghost: "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink",
};

export const field =
  "h-10 w-full rounded-lg border border-ink/15 bg-white px-3 text-sm outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand/15 aria-[invalid=true]:border-red-500";
