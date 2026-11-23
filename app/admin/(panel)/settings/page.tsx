import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Store Settings" };
export const instant = false;

export default async function Page() {
  await requireStaff();
  return (
    <ComingNext
      title={"Store Settings"}
      description={"Business details and store configuration."}
      features={["Store name, logo, contact details and socials", "Payment provider status", "Delivery zones, fees and timings", "Notification preferences and admin account"]}
    />
  );
}
