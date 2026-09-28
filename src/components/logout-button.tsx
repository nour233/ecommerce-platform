"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/actions/auth";

export function LogoutButton({ tone = "light", label = false }: { tone?: "light" | "dark"; label?: boolean }) {
  return <form action={logoutAction}><LogoutSubmitButton tone={tone} label={label} /></form>;
}

function LogoutSubmitButton({ tone, label }: { tone: "light" | "dark"; label: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`focus-ring ${label ? "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold" : "grid size-10 place-items-center"} rounded-md transition disabled:opacity-50 ${
        tone === "dark"
          ? "text-white/75 hover:bg-white/10 hover:text-white"
          : "text-ink/65 hover:bg-ink/5 hover:text-ink"
      }`}
      aria-label={pending ? "Logging out" : "Log out"}
      title="Log out"
    >
      <LogOut size={17} aria-hidden="true" />{label ? <span>{pending ? "Signing out…" : "Sign out"}</span> : null}
    </button>
  );
}
