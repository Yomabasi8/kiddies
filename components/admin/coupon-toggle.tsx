"use client";

import { useTransition } from "react";
import { setCouponActive } from "@/lib/admin/coupon-actions";

export function CouponToggle({ id, active, code }: { id: string; active: boolean; code: string }) {
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        role="switch"
        checked={active}
        disabled={pending}
        onChange={(e) => start(() => setCouponActive(id, e.target.checked))}
        aria-label={`${code} active`}
        className="size-4 accent-[#086f54]"
      />
      <span className={active ? "font-semibold text-emerald-700" : "text-ink/50"}>{active ? "Active" : "Off"}</span>
    </label>
  );
}
