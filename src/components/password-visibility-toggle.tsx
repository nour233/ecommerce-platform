"use client";

import { Eye, EyeOff } from "lucide-react";

export function PasswordVisibilityToggle({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return <button type="button" onClick={onToggle} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} className="focus-ring absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-ink/50 transition hover:bg-ink/5 hover:text-ink">
    {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
  </button>;
}
