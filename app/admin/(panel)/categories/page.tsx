import type { Metadata } from "next";
import { ComingNext } from "@/components/admin/coming-next";
import { requireStaff } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Categories" };
export const instant = false;

export default async function Page() {
  await requireStaff();
  return (
    <ComingNext
      title={"Categories"}
      description={"Organise products into shop categories."}
      features={["Create and edit categories", "Upload category images and descriptions", "Show or hide categories in the shop", "Safe archive with product reassignment"]}
    />
  );
}
