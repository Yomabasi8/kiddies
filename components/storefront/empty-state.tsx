import Link from "next/link";
import { Mascot } from "./mascot";

/** Friendly empty state with Blocky. */
export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-[32px] bg-[#FDF8E9] px-6 py-14 text-center">
      <Mascot className="w-24" color="#7B6CF6" />
      <h2 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-[15px] text-ink/60">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-coral px-6 text-sm font-bold text-white shadow-pop transition-transform hover:-translate-y-0.5"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
