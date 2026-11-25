"use client";

import { useEffect } from "react";
import { logSearch } from "@/lib/search-insights/actions";

/**
 * Logs a search once the shopper has settled on it. Mounted with
 * key={query}, so if they keep typing, the previous timer is cancelled
 * and half-typed words are never recorded. Renders nothing.
 */
export function SearchLogger({ query }: { query: string }) {
  useEffect(() => {
    const t = setTimeout(() => void logSearch(query), 1500);
    return () => clearTimeout(t);
  }, [query]);
  return null;
}
