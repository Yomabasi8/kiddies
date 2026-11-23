import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shared input styling and labelled field for storefront forms. */
export const inputClass = (invalid?: boolean) =>
  cn(
    "w-full rounded-xl border-2 bg-white px-4 text-[15px] outline-none transition-colors focus:border-brand",
    invalid ? "border-coral" : "border-ink/10",
  );

export function TextField({
  label,
  name,
  error,
  optional,
  multiline,
  className,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  multiline?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const common = {
    id: name,
    name,
    "aria-invalid": !!error || undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
  };
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-bold text-ink">
        {label} {optional && <span className="font-semibold text-ink/40">(optional)</span>}
      </label>
      {multiline ? (
        <textarea {...common} rows={5} className={cn(inputClass(!!error), "py-3")} {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : (
        <input {...common} className={cn(inputClass(!!error), "h-12")} {...(props as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-coral">
          <AlertCircle className="size-4" /> {error}
        </p>
      )}
    </div>
  );
}
