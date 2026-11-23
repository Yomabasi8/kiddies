import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Orders" };
export const instant = false;

export default async function Page() {
  await requireStaff();
  return (
    <ComingNext
      title={"Orders"}
      description={"Review, process and fulfil customer orders."}
      features={["Filter by pending, processing, dispatched, delivered, cancelled, refunded", "Search by order reference or customer", "Order details, payment verification and timeline", "Update status, add tracking and internal notes", "Cancel and refund with stock restoration"]}
    />
  );
}
