import type { Metadata } from "next";
import { PolicyPage } from "@/components/storefront/policy-page";
import { POLICIES } from "@/lib/policies";

const policy = POLICIES["terms"];

export const metadata: Metadata = { title: policy.title, description: policy.intro };

export default function Page() {
  return <PolicyPage policy={policy} />;
}
