import Link from "next/link";
import { Hammer } from "lucide-react";
import { PageTitle, btn } from "./ui";

/** Honest placeholder for admin sections still being built. */
export function ComingNext({ title, description, features }: { title: string; description: string; features: string[] }) {
  return (
    <>
      <PageTitle title={title} description={description} />
      <div className="rounded-xl border border-dashed border-ink/20 bg-white p-8 sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-700">
          <Hammer className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-extrabold">This section is being built next</h2>
        <p className="mt-1 max-w-lg text-sm text-ink/60">The database for it is already in place. Here&apos;s what it will include:</p>
        <ul className="mt-4 grid max-w-2xl gap-2 text-sm sm:grid-cols-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />{f}</li>
          ))}
        </ul>
        <Link href="/admin/dashboard" className={`${btn.secondary} mt-6`}>Back to dashboard</Link>
      </div>
    </>
  );
}
