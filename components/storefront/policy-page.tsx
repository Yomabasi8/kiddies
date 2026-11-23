import Link from "next/link";
import { FileWarning } from "lucide-react";
import type { Policy } from "@/lib/policies";
import { POLICIES } from "@/lib/policies";
import { PageHeader } from "./page-header";

export function PolicyPage({ policy }: { policy: Policy }) {
  return (
    <main className="flex-1">
      <PageHeader title={policy.title} intro={policy.intro} crumbs={[{ href: "/", label: "Home" }, { label: policy.title }]} />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1fr_260px]">
        <article>
          {!policy.finalised && (
            <p className="mb-10 flex gap-3 rounded-2xl bg-[#FFF6D9] px-5 py-4 text-sm font-semibold text-[#7A5600]">
              <FileWarning className="size-5 shrink-0" />
              This policy is a draft and will be finalised before the store launches.
            </p>
          )}
          <p className="text-sm font-semibold text-ink/45">Last updated {policy.updated}</p>
          {policy.sections.map((s) => (
            <section key={s.heading} className="mt-9">
              <h2 className="font-display text-2xl font-semibold">{s.heading}</h2>
              {s.body.map((p) => (
                <p key={p} className="mt-3 text-[15px] leading-relaxed text-ink/75">{p}</p>
              ))}
            </section>
          ))}
        </article>
        <nav aria-label="Policies" className="h-fit rounded-3xl bg-[#FDF8E9] p-6 lg:sticky lg:top-32">
          <h2 className="font-display text-lg font-semibold">Store policies</h2>
          <ul className="mt-3 space-y-2">
            {Object.values(POLICIES).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/${p.slug}`}
                  aria-current={p.slug === policy.slug ? "page" : undefined}
                  className="text-[15px] font-bold text-ink/65 hover:text-brand aria-[current=page]:text-brand"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
