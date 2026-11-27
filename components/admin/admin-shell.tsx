"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tag,
  Users,
  X,
} from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/categories", label: "Categories", Icon: FolderTree },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/inventory", label: "Inventory", Icon: Boxes },
  { href: "/admin/customers", label: "Customers", Icon: Users },
  { href: "/admin/promotions", label: "Promotions", Icon: Tag },
  { href: "/admin/reports", label: "Analytics & Reports", Icon: BarChart3 },
  { href: "/admin/settings", label: "Store Settings", Icon: Settings },
] as const;

type Notification = { id: number; title: string; body: string | null; created_at: string };

export function AdminShell({
  user,
  notifications,
  storeClosed = false,
  children,
}: {
  user: { name: string; email: string; role: string };
  notifications: Notification[];
  /** Shows a reminder bar while the storefront is in maintenance mode. */
  storeClosed?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-ink/10 px-5">
        <Image src="/images/logo.png" alt="Kiddies Accessories" width={900} height={550} className="h-11 w-auto" />
        <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-brand">Admin</span>
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {ADMIN_NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setNavOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-brand text-white" : "text-ink/70 hover:bg-ink/5 hover:text-ink",
                )}
              >
                <Icon className="size-[18px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-ink/10 p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink">
          <ExternalLink className="size-[18px]" /> View storefront
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F5] font-sans text-ink">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-ink/10 bg-white lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-ink/40" onClick={() => setNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button type="button" onClick={() => setNavOpen(false)} aria-label="Close menu" className="absolute right-3 top-3.5 grid size-9 place-items-center rounded-lg hover:bg-ink/5">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-ink/10 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setNavOpen(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-lg hover:bg-ink/5 lg:hidden">
            <Menu className="size-5" />
          </button>
          <div className="hidden text-sm font-semibold text-ink/50 lg:block">
            {ADMIN_NAV.find((n) => pathname.startsWith(n.href))?.label ?? "Admin"}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationsMenu items={notifications} />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold leading-tight">{user.name}</p>
              <p className="text-xs text-ink/50">{user.email}</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-bold uppercase text-white" aria-hidden="true">
              {user.name.slice(0, 1)}
            </span>
            <form action={signOut}>
              <button type="submit" className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-ink/60 hover:bg-ink/5 hover:text-ink">
                <LogOut className="size-4" /> <span className="hidden sm:inline">Log out</span>
              </button>
            </form>
          </div>
        </header>
        {storeClosed && (
          <p role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 sm:px-6 lg:px-8">
            Your store is closed. Customers see the maintenance page and can&apos;t place orders.
            <Link href="/admin/settings" className="underline underline-offset-2 hover:text-amber-950">Change in Store Settings</Link>
          </p>
        )}
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function NotificationsMenu({ items }: { items: Notification[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notifications, ${items.length} unread`}
        className="relative grid size-10 place-items-center rounded-lg hover:bg-ink/5"
      >
        <Bell className="size-5" />
        {items.length > 0 && (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-xl border border-ink/10 bg-white shadow-xl">
          <p className="border-b border-ink/10 px-4 py-3 text-sm font-bold">Notifications</p>
          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink/50">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-ink/5 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="text-xs text-ink/55">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-ink/40">{new Date(n.created_at).toLocaleString("en-NG")}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
