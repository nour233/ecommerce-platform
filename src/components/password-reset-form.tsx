"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { PasswordVisibilityToggle } from "@/components/password-visibility-toggle";

type Step = "request" | "reset" | "success";

export function PasswordResetForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  async function requestCode(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Unable to send a recovery code.");
        return;
      }
      setStep("reset");
      setNotice("If an account matches this email, a six-digit code is on its way.");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Unable to reset your password.");
        return;
      }
      setStep("success");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 size={30} aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-2xl font-bold text-ink">Password updated</h3>
        <p className="mt-3 leading-7 text-ink/65">Your new password is ready. You can now return to your account.</p>
        <Link href="/login" className="focus-ring mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-white transition hover:bg-clay">
          Continue to login <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={step === "request" ? requestCode : resetPassword} className="space-y-5">
      {step === "request" ? (
        <label className="block text-sm font-semibold text-ink">
          Account email
          <span className="relative mt-2 block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" aria-hidden="true" />
            <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" autoComplete="email" placeholder="you@example.com" required className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-4 font-normal transition hover:border-ink/30" />
          </span>
        </label>
      ) : (
        <>
          <div className="flex gap-3 rounded-md border border-moss/20 bg-moss/5 p-4">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-moss" aria-hidden="true" />
            <div><p className="text-sm font-semibold">Check your inbox</p><p className="mt-1 break-all text-sm text-ink/65">Enter the code sent for {email}.</p></div>
          </div>
          <label className="block text-sm font-semibold text-ink">
            Six-digit code
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} name="code" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus className="focus-ring mt-2 h-14 w-full rounded-md border border-ink/15 bg-white px-4 text-center text-xl font-bold tracking-[0.25em]" />
          </label>
          <label className="block text-sm font-semibold text-ink">
            New password
            <span className="relative mt-2 block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" aria-hidden="true" /><input name="password" type={passwordVisible ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-12 font-normal" /><PasswordVisibilityToggle visible={passwordVisible} onToggle={() => setPasswordVisible((visible) => !visible)} /></span>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Confirm new password
            <span className="relative mt-2 block"><ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" aria-hidden="true" /><input name="confirmation" type={confirmationVisible ? "text" : "password"} autoComplete="new-password" placeholder="Repeat your password" minLength={8} required className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-12 font-normal" /><PasswordVisibilityToggle visible={confirmationVisible} onToggle={() => setConfirmationVisible((visible) => !visible)} /></span>
          </label>
        </>
      )}

      {notice ? <p role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <button type="submit" disabled={loading} className="focus-ring group flex h-14 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-white transition hover:bg-clay disabled:cursor-wait disabled:opacity-60">
        {loading ? "Please wait..." : step === "request" ? "Send recovery code" : "Save new password"}
        {!loading ? <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /> : null}
      </button>

      {step === "reset" ? (
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <button type="button" onClick={() => requestCode()} disabled={loading} className="focus-ring inline-flex items-center gap-2 font-semibold text-moss hover:underline disabled:opacity-50"><RefreshCw size={15} />Resend code</button>
          <button type="button" onClick={() => { setStep("request"); setCode(""); setError(""); setNotice(""); }} disabled={loading} className="focus-ring inline-flex items-center gap-2 font-semibold text-ink/60 hover:text-ink disabled:opacity-50"><ArrowLeft size={15} />Change email</button>
        </div>
      ) : (
        <p className="text-center text-sm text-ink/65">Remembered your password? <Link href="/login" className="font-semibold text-moss hover:underline">Back to login</Link></p>
      )}
    </form>
  );
}
