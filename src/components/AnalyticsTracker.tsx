"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const last = useRef<string | null>(null);
  const key = `${pathname}?${search.toString()}`;

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/dang-ky") return;
    if (last.current === key) return;
    last.current = key;
    trackEvent("page_view");
    if (pathname === "/dang-ky") trackEvent("registration_opened", "page");
  }, [key, pathname]);

  return null;
}
