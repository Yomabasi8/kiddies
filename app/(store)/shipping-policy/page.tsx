import type { Metadata } from "next";
import { PolicyPage } from "@/components/storefront/policy-page";
import { POLICIES, withDeliveryLines } from "@/lib/policies";
import { getDeliveryMethods } from "@/lib/delivery-data";

const policy = POLICIES["shipping-policy"];

export const metadata: Metadata = { title: policy.title, description: policy.intro };

export default async function Page() {
  return <PolicyPage policy={withDeliveryLines(policy, await getDeliveryMethods())} />;
}
