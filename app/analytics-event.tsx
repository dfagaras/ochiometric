"use client";

import { useEffect } from "react";
import type { AnalyticsEvent } from "@/db/analytics";

export function sendMetric(event: AnalyticsEvent) {
  const body = JSON.stringify({ event });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
  else void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
}

export default function AnalyticsEvent({ event }: { event: AnalyticsEvent }) {
  useEffect(() => { sendMetric(event); }, [event]);
  return null;
}
