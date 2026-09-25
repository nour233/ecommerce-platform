"use client";

import { ArrowLeft, MailCheck, RefreshCw } from "lucide-react";
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
            <label className="block text-sm font-semibold">
              Name
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                minLength={2}
                className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-4 font-normal"
              />
            </label>
          ) : null}
          <label className="block text-sm font-semibold">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-4 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={8}
              className="focus-ring mt-2 h-12 w-full rounded-md border border-ink/15 bg-white px-4 font-normal"
            />
            {isRegister ? (
              <span className="mt-2 block text-xs font-normal text-ink/60">
                At least 8 characters
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
        className="focus-ring h-12 w-full rounded-md bg-ink text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-wait disabled:opacity-60"
      >
        {loading
          ? "Please wait..."
          : isVerificationStep
            ? "Verify and create account"
            : isRegister
              ? "Send verification code"
              : "Log in"}
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
    </form>
  );
}
