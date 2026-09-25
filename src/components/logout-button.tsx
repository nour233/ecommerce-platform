"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
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
      className="focus-ring grid size-10 place-items-center rounded-md text-ink/65 transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
      aria-label="Log out"
      title="Log out"
    >
      <LogOut size={17} aria-hidden="true" />
    </button>
  );
}
