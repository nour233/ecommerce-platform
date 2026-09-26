"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import { logoutAction } from "@/app/actions/auth";

export function LogoutButton({ tone = "light" }: { tone?: "light" | "dark" }) {
  return <form action={logoutAction}><LogoutSubmitButton tone={tone} /></form>;
}

function LogoutSubmitButton({ tone }: { tone: "light" | "dark" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`focus-ring grid size-10 place-items-center rounded-md transition disabled:opacity-50 ${
        tone === "dark"
          ? "text-white/75 hover:bg-white/10 hover:text-white"
          : "text-ink/65 hover:bg-ink/5 hover:text-ink"
      }`}
      aria-label={pending ? "Logging out" : "Log out"}
      title="Log out"
    >
      <LogOut size={17} aria-hidden="true" />
    </button>
  );
}
