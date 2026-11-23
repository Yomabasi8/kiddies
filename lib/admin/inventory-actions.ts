"use server";

import { revalidatePath, updateTag } from "next/cache";
import { audit, requireStaff } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATALOG_TAG } from "@/lib/catalog";

export type InventoryResult = { ok: true; message: string; quantity?: number } | { ok: false; message: string };

/** Add, remove or set stock. Every change is a logged movement; never below 0. */
export async function adjustStock(
  inventoryId: string,
  mode: "add" | "remove" | "set",
  amount: number,
  reason: "restock" | "adjustment",
  note: string,
): Promise<InventoryResult> {
  const actor = await requireStaff();
  if (!/^[0-9a-f-]{36}$/i.test(inventoryId) || !Number.isInteger(amount) || amount < 0 || amount > 100000) {
    return { ok: false, message: "Enter a whole number." };
  }
  const db = createAdminClient();
  const { data: inv } = await db.from("inventory").select("quantity, product_id").eq("id", inventoryId).maybeSingle();
  if (!inv) return { ok: false, message: "Stock record not found." };

  const change = mode === "add" ? amount : mode === "remove" ? -amount : amount - inv.quantity;
  if (change === 0) return { ok: true, message: "No change.", quantity: inv.quantity };
  if (inv.quantity + change < 0) return { ok: false, message: `You can't remove more than the ${inv.quantity} in stock.` };

  const { data, error } = await db.rpc("adjust_stock", {
    p_inventory_id: inventoryId,
    p_change: change,
    p_reason: change > 0 && reason === "restock" ? "restock" : "adjustment",
    p_note: note.trim().slice(0, 300) || null,
    p_actor: actor.id,
  });
  if (error) return { ok: false, message: "Couldn't update stock. Please try again." };
  await audit(actor, "inventory.adjust", "product", inv.product_id, { change, quantity_after: data });
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/inventory");
  return { ok: true, message: `Stock updated to ${data}.`, quantity: data as number };
}

export async function setLowStockThreshold(productId: string, threshold: number): Promise<InventoryResult> {
  const actor = await requireStaff();
  if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(threshold) || threshold < 0 || threshold > 10000) {
    return { ok: false, message: "Enter a whole number." };
  }
  const { error } = await createAdminClient().from("products").update({ low_stock_threshold: threshold }).eq("id", productId);
  if (error) return { ok: false, message: "Couldn't save the threshold." };
  await audit(actor, "inventory.threshold", "product", productId, { threshold });
  revalidatePath("/admin/inventory");
  return { ok: true, message: "Threshold saved." };
}
