"use client";

import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserRound
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath: string;
};

export function AuthForm({ mode, nextPath }: AuthFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [registerStep, setRegisterStep] = useState<
    "details" | "verification"
  >("details");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const isRegister = mode === "register";
  const isVerificationStep =
    isRegister && registerStep === "verification";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const formData = new FormData(event.currentTarget);
    if (isVerificationStep && !/^\d{6}$/.test(verificationCode)) {
      setError("Enter the 6-digit code received by email.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        isVerificationStep
          ? "/api/auth/register/verify"
          : `/api/auth/${mode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            isVerificationStep
              ? {
                  email: verificationEmail,
                  code: verificationCode
                }
              : {
                  ...(isRegister ? { name: formData.get("name") } : {}),
                  email: formData.get("email"),
                  password: formData.get("password")
                }
          )
        }
      );
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Unable to continue. Please try again.");
        return;
      }

      if (isRegister && !isVerificationStep) {
        setVerificationEmail(payload.data.email);
        setVerificationCode("");
        setRegisterStep("verification");
        setNotice("Verification code sent. Check your inbox.");
        return;
      }

      const destination = payload.data?.role === "admin" ? "/admin" : nextPath;
      router.push(destination);
      router.refresh();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/auth/register/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Unable to resend the code.");
        return;
      }
      setNotice("A new verification code has been sent.");
      setVerificationCode("");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeEmail() {
    setRegisterStep("details");
    setVerificationEmail("");
    setVerificationCode("");
    setError("");
    setNotice("");
  }

  const alternateHref = `${isRegister ? "/login" : "/register"}?next=${encodeURIComponent(nextPath)}`;

  return (
    <form key={`${mode}-${registerStep}`} onSubmit={submit} className="space-y-5">
      {isVerificationStep ? (
        <>
          <div className="flex gap-3 rounded-md border border-moss/20 bg-moss/5 p-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-moss" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Check your email</p>
              <p className="mt-1 break-all text-sm text-ink/65">
                We sent a six-digit code to {verificationEmail}.
              </p>
            </div>
          </div>
          <label className="block text-sm font-semibold">
            <span>Verification code</span>
            <input
              id="registration-verification-code"
              name="code"
              type="text"
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              minLength={6}
              maxLength={6}
              required
              autoFocus
              className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-4 text-center text-xl font-semibold"
            />
          </label>
        </>
      ) : (
        <>
          {isRegister ? (
            <label className="block text-sm font-semibold text-ink">
              Full name
              <span className="relative mt-2 block">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  required
                  minLength={2}
                  className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-4 font-normal transition hover:border-ink/30"
                />
              </span>
            </label>
          ) : null}
          <label className="block text-sm font-semibold text-ink">
            Email
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" aria-hidden="true" />
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-4 font-normal transition hover:border-ink/30"
              />
            </span>
          </label>
          <label className="block text-sm font-semibold text-ink">
            Password
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" aria-hidden="true" />
              <input
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-4 font-normal transition hover:border-ink/30"
              />
            </span>
            {isRegister ? (
              <span className="mt-2 flex items-center gap-2 text-xs font-normal text-ink/55">
                <ShieldCheck className="h-3.5 w-3.5 text-moss" aria-hidden="true" />
                Use 8 or more characters
              </span>
            ) : null}
          </label>
        </>
      )}
      {notice ? (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="focus-ring group flex h-14 w-full items-center justify-center gap-2 rounded-md bg-ink text-sm font-semibold text-white transition hover:bg-clay disabled:cursor-wait disabled:opacity-60"
      >
        {loading
          ? "Please wait..."
          : isVerificationStep
            ? "Verify and create account"
            : isRegister
              ? "Send verification code"
              : "Log in"}
        {!loading && !isVerificationStep ? (
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        ) : null}
      </button>
      {isVerificationStep ? (
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <button
            type="button"
            onClick={resendCode}
            disabled={loading}
            className="focus-ring inline-flex items-center gap-2 font-semibold text-moss hover:underline disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Resend code
          </button>
          <button
            type="button"
            onClick={changeEmail}
            disabled={loading}
            className="focus-ring inline-flex items-center gap-2 font-semibold text-ink/65 hover:text-ink disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Change email
          </button>
        </div>
      ) : null}
      <p className="text-center text-sm text-ink/65">
        {isRegister ? "Already have an account?" : "New to CommerceCraft?"}{" "}
        <Link href={alternateHref} className="font-semibold text-moss underline-offset-4 hover:underline">
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
      {!isVerificationStep ? (
        <div className="flex items-center justify-center gap-2 border-t border-ink/10 pt-5 text-xs text-ink/50">
          <ShieldCheck className="h-4 w-4 text-moss" aria-hidden="true" />
          Your account details stay private and protected.
        </div>
      ) : null}
    </form>
  );
}
