"use client";

import { useEffect } from "react";

export function PresenceHeartbeat() {
  useEffect(() => {
    const reportPresence = () => { void fetch("/api/users/current/presence", { method: "POST" }); };
    reportPresence();
    const timer = window.setInterval(reportPresence, 60_000);
    document.addEventListener("visibilitychange", reportPresence);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", reportPresence);
    };
  }, []);

  return null;
}
