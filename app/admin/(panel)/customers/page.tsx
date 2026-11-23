import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Customers" };
export const instant = false;

export default async function Page() {
  await requireStaff();
  return (
    <ComingNext
      title={"Customers"}
      description={"People who have bought from the store."}
      features={["Registered and guest customers", "Order count and total spend", "Search customers", "Customer order history"]}
    />
  );
}
