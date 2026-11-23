import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Analytics & Reports" };
export const instant = false;

export default async function Page() {
  await requireStaff();
  return (
    <ComingNext
      title={"Analytics & Reports"}
      description={"How the business is performing."}
      features={["Revenue, orders and average order value", "Sales over time with date ranges", "Bestselling products and categories", "Inventory and customer purchase trends"]}
    />
  );
}
