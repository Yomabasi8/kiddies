"use client";

import { useRef, useState, useTransition } from "react";
import { adjustStock, setLowStockThreshold } from "@/lib/admin/inventory-actions";
import { cn } from "@/lib/utils";
import { btn, field } from "./ui";

/** "Adjust" button + dialog for one stock row. */
export function AdjustStockButton({ inventoryId, productName, quantity }: { inventoryId: string; productName: string; quantity: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<"restock" | "adjustment">("restock");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const n = Number(amount);
  const preview = amount === "" || !Number.isInteger(n) ? null : mode === "add" ? quantity + n : mode === "remove" ? quantity - n : n;

  function open() {
    setMsg(null);
    setAmount("");
    setNote("");
    ref.current?.showModal();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await adjustStock(inventoryId, mode, n, mode === "add" ? reason : "adjustment", note);
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) ref.current?.close();
    });
  }

  return (
    <>
      <button type="button" onClick={open} className={btn.ghost}>Adjust</button>
      {msg?.ok && <span role="status" className="sr-only">{msg.text}</span>}
      <dialog ref={ref} aria-labelledby={`adj-${inventoryId}`} className="m-auto w-[min(92vw,420px)] rounded-xl p-0 shadow-2xl backdrop:bg-ink/40">
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <h2 id={`adj-${inventoryId}`} className="text-lg font-extrabold">Adjust stock</h2>
            <p className="text-sm text-ink/55">{productName} · currently <strong>{quantity}</strong></p>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-ink/5 p-1" role="radiogroup" aria-label="Adjustment type">
            {(["add", "remove", "set"] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={cn("rounded-md py-1.5 text-sm font-bold capitalize", mode === m ? "bg-white shadow-sm" : "text-ink/55")}>
                {m === "set" ? "Set to" : m}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">{mode === "set" ? "New quantity" : "Quantity"}</span>
            <input autoFocus required inputMode="numeric" pattern="\d*" className={field} value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
          </label>
          {mode === "add" && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Reason</span>
              <select className={field} value={reason} onChange={(e) => setReason(e.target.value as "restock" | "adjustment")}>
                <option value="restock">New stock received</option>
                <option value="adjustment">Stock count correction</option>
              </select>
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Note <span className="font-normal text-ink/45">(optional)</span></span>
            <input className={field} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Damaged in storage" />
          </label>
          {preview !== null && (
            <p className={cn("text-sm font-semibold", preview < 0 ? "text-red-600" : "text-ink/70")}>
              {preview < 0 ? "That's more than you have in stock." : `New stock level: ${preview}`}
            </p>
          )}
          {msg && !msg.ok && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{msg.text}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => ref.current?.close()} className={btn.secondary}>Cancel</button>
            <button type="submit" disabled={pending || preview === null || preview < 0} className={btn.primary}>{pending ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}

/** Inline editable low-stock threshold. Key it by value so it resets after a server refresh. */
export function ThresholdInput({ productId, value }: { productId: string; value: number }) {
  const [v, setV] = useState(String(value));
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  function save() {
    const n = Number(v);
    if (v === String(value)) return;
    start(async () => {
      const r = await setLowStockThreshold(productId, n);
      setState(r.ok ? "saved" : "error");
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        aria-label="Low-stock threshold"
        inputMode="numeric"
        value={v}
        onChange={(e) => { setV(e.target.value.replace(/\D/g, "")); setState("idle"); }}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur())}
        disabled={pending}
        className={cn("h-8 w-16 rounded-md border px-2 text-right text-sm tabular-nums outline-none focus:border-brand", state === "error" ? "border-red-500" : "border-ink/15")}
      />
      {state === "saved" && <span className="text-xs font-semibold text-emerald-700">Saved</span>}
    </span>
  );
}
