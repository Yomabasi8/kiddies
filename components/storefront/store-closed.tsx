import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarHeart } from "lucide-react";
import { CloudEdge, LightbulbDoodle, PaperPlaneDoodle, SparksDoodle, SwirlArrowDoodle } from "./hero-doodles";
import { Mascot } from "./mascot";
import { CONTACT_URL, EXTERNAL_LINK } from "@/lib/contact";

const DEFAULT_MESSAGE = "We're getting things ready behind the scenes. Follow us on Instagram for updates and new arrivals.";

/** "2026-12-15" → "Tuesday, 15 December". */
function formatReopenDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-NG", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Lagos" }).format(d);
}

/**
 * Full-page maintenance screen shown in place of the storefront while the
 * owner has closed the store (Admin → Store Settings → Store status).
 */
export function StoreClosed({ message, reopensOn }: { message: string | null; reopensOn: string | null }) {
  const reopen = reopensOn ? formatReopenDate(reopensOn) : null;

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-brand">
      <LightbulbDoodle className="pointer-events-none absolute left-[7%] top-[18%] hidden w-20 -rotate-12 text-white md:block" />
      <SwirlArrowDoodle className="pointer-events-none absolute right-[9%] top-[16%] hidden w-28 text-white/80 md:block" />
      <PaperPlaneDoodle className="pointer-events-none absolute bottom-[26%] right-[6%] hidden w-36 text-white md:block" />
      <SparksDoodle className="pointer-events-none absolute bottom-[30%] left-[10%] hidden w-14 text-sunny md:block" />

      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-5 pb-40 pt-10 text-center sm:pt-14">
        <span className="rounded-[28px] bg-white px-6 py-2 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]">
          <Image src="/images/logo.png" alt="Kiddies Accessories" width={900} height={550} preload className="h-14 w-auto sm:h-16" />
        </span>

        <Mascot className="mt-10 w-24 sm:w-28" color="#F7E14B" />

        <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.1] text-white text-balance sm:text-5xl">
          We&apos;ll be back soon!
        </h1>
        <p className="mt-5 max-w-md whitespace-pre-line text-balance text-[16px] leading-relaxed text-white/90">{message || DEFAULT_MESSAGE}</p>

        {reopen && (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-sunny px-4 py-2 text-sm font-bold text-ink">
            <CalendarHeart className="size-4" aria-hidden="true" />
            We plan to reopen on {reopen}
          </p>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <a
            href={CONTACT_URL}
            {...EXTERNAL_LINK}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-coral px-8 text-[15px] font-bold text-white shadow-pop transition-transform hover:-translate-y-0.5"
          >
            Follow us on Instagram
            <ArrowUpRight className="size-4" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <Link
            href="/track-order"
            className="inline-flex h-12 items-center rounded-full border-[1.5px] border-white/80 px-6 text-[15px] font-bold text-white transition-colors hover:bg-white hover:text-brand"
          >
            Track an existing order
          </Link>
        </div>
      </div>

      <CloudEdge className="pointer-events-none absolute inset-x-0 bottom-0 block h-[90px] w-full text-white sm:h-[130px]" />
    </main>
  );
}
