"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-16 text-center">
      <div>
        <AlertTriangle className="mx-auto text-clay" size={40} aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-bold">We could not load this page</h1>
        <p className="mt-3 text-ink/65">
          The service may be temporarily unavailable. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="focus-ring mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white"
        >
          <RotateCcw size={17} aria-hidden="true" />
          Try again
        </button>
      </div>
    </section>
  );
}
