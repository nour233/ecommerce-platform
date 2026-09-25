"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className={`focus-ring grid size-10 place-items-center rounded-md transition disabled:opacity-50 ${
        tone === "dark"
          ? "text-white/75 hover:bg-white/10 hover:text-white"
          : "text-ink/65 hover:bg-ink/5 hover:text-ink"
      }`}
      aria-label="Log out"
      title="Log out"
    >
      <LogOut size={17} aria-hidden="true" />
    </button>
  );
}
