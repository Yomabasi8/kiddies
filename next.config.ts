import type { NextConfig } from "next";
import { CONTACT_URL } from "./lib/contact";

// Product images uploaded in the admin live in Supabase Storage.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/**`)] : [],
  },
  // Contact enquiries are handled on Instagram (see lib/contact.ts).
  async redirects() {
    return [{ source: "/contact", destination: CONTACT_URL, permanent: false }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
