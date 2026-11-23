"use client";

import { useState } from "react";
import type { SalesPoint } from "@/lib/admin/dashboard";
import { formatPrice } from "@/lib/format";

const BAR = "#0B8A62"; // brand-family green, validated for chroma + contrast on white

/** Compact ₦ axis labels: ₦0, ₦50k, ₦1.2m. */
function short(kobo: number) {
  const n = kobo / 100;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}m`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return `₦${n}`;
}

/** Rounded max for a tidy axis with four steps. */
function niceMax(v: number) {
  if (v <= 0) return 4_000_00; // ₦4,000 placeholder scale when empty
  const step = Math.pow(10, Math.floor(Math.log10(v / 4)));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => s * 4 >= v) ?? step * 10;
  return nice * 4;
}

export function SalesChart({ data }: { data: SalesPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.revenue), 0));
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const labelEvery = Math.ceil(data.length / 8);
  const empty = data.every((d) => d.revenue === 0);

  return (
    <div>
      <div className="relative flex h-64 gap-3">
        {/* Y axis */}
        <div className="flex w-12 shrink-0 flex-col-reverse justify-between pb-6 text-right text-[11px] tabular-nums text-ink/45">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 leading-none first:translate-y-0">{short(t)}</span>
          ))}
        </div>

        <div className="relative flex-1">
          {/* Gridlines */}
          <div className="absolute inset-x-0 bottom-6 top-0 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className="border-t border-ink/[0.07]" />
            ))}
          </div>

          {/* Bars */}
          <div className="absolute inset-x-0 bottom-6 top-0 flex items-end gap-[2px]" role="img" aria-label="Revenue over time. Full data in the table below.">
            {data.map((d, i) => (
              <button
                key={d.start}
                type="button"
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${d.label}: ${formatPrice(d.revenue)}, ${d.orders} orders`}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
              >
                <span
                  className="w-full max-w-10 rounded-t-[4px] transition-opacity"
                  style={{
                    height: `${(d.revenue / max) * 100}%`,
                    minHeight: d.revenue > 0 ? 3 : 0,
                    background: BAR,
                    opacity: active === null || active === i ? 1 : 0.45,
                  }}
                />
                {active === i && (
                  <span className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-left text-xs text-white shadow-lg">
                    <span className="block font-bold">{d.label}</span>
                    <span className="block tabular-nums">{formatPrice(d.revenue)}</span>
                    <span className="block text-white/60">{d.orders} {d.orders === 1 ? "order" : "orders"}</span>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* X labels */}
          <div className="absolute inset-x-0 bottom-0 flex gap-[2px] text-[11px] text-ink/45" aria-hidden="true">
            {data.map((d, i) => (
              <span key={d.start} className="flex-1 truncate text-center">{i % labelEvery === 0 ? d.label : ""}</span>
            ))}
          </div>

          {empty && (
            <p className="absolute inset-0 grid place-items-center pb-6 text-sm font-semibold text-ink/45">
              No paid orders in this period yet.
            </p>
          )}
        </div>
      </div>

      <table className="sr-only">
        <caption>Revenue and orders by period</caption>
        <thead>
          <tr><th>Period</th><th>Revenue</th><th>Orders</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.start}><td>{d.label}</td><td>{formatPrice(d.revenue)}</td><td>{d.orders}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
