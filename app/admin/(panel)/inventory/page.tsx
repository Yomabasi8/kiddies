import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Inventory" };
export const instant = false;

export default async function Page() {
  await requireStaff();
  return (
    <ComingNext
      title={"Inventory"}
      description={"Stock levels across all products."}
      features={["Stock status: in stock, low, out of stock", "Adjust stock with a reason", "Set low-stock thresholds", "Full stock movement history"]}
    />
  );
}
