"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CalendarDays, CheckCircle2, KeyRound, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import type { User } from "@/types";

type Feedback = { type: "success" | "error"; message: string } | null;

export function ProfileClient({ initialUser }: { initialUser: User }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setProfileLoading(true);
    setProfileFeedback(null);
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/users/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          currentPassword: formData.get("currentPassword") || undefined
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setProfileFeedback({ type: "error", message: payload.error ?? "Unable to update your profile." });
        return;
      }
      setUser(payload.data);
      setProfileFeedback({ type: "success", message: "Your profile has been updated." });
      form.reset();
      router.refresh();
    } catch {
      setProfileFeedback({ type: "error", message: "Unable to reach the server." });
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setPasswordLoading(true);
    setPasswordFeedback(null);
    const formData = new FormData(form);
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmation = String(formData.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setPasswordFeedback({ type: "error", message: "New passwords do not match." });
      setPasswordLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/users/current/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.get("currentPassword"),
          newPassword
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setPasswordFeedback({ type: "error", message: payload.error ?? "Unable to change your password." });
        return;
      }
      form.reset();
      setPasswordFeedback({ type: "success", message: "Your password has been changed." });
    } catch {
      setPasswordFeedback({ type: "error", message: "Unable to reach the server." });
    } finally {
      setPasswordLoading(false);
    }
  }

  const initials = user.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");

  return (
    <section className="bg-[#f4f5f3] pb-20">
      <div className="bg-[#172033] px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 sm:flex-row sm:items-center">
          <span className="grid size-20 shrink-0 place-items-center rounded-full border-4 border-white/15 bg-[#ef8354] text-2xl font-bold text-[#172033]">{initials || "CC"}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffb38f]">Member profile</p>
            <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Your CommerceCraft account</h1>
            <p className="mt-3 text-white/65">Keep your personal details and account security up to date.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 pt-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="h-fit rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-bold text-ink">{user.name}</p>
          <p className="mt-1 break-all text-sm text-ink/55">{user.email}</p>
          <div className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm">
            <div className="flex items-center gap-3 text-ink/65"><ShieldCheck size={17} className="text-moss" /><span className="capitalize">{user.role} account</span></div>
            <div className="flex items-center gap-3 text-ink/65"><CalendarDays size={17} className="text-clay" /><span>Member since {new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(user.createdAt))}</span></div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="profile-details-title">
            <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-cream text-moss"><UserRound size={21} /></span>
              <div><h2 id="profile-details-title" className="text-2xl font-bold text-ink">Personal details</h2><p className="mt-1 text-sm text-ink/55">Update the name and email used by your account.</p></div>
            </div>
            <form key={`${user.name}-${user.email}`} onSubmit={updateProfile} className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink">Full name<span className="relative mt-2 block"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" /><input name="name" defaultValue={user.name} minLength={2} maxLength={80} required className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-4 font-normal" /></span></label>
              <label className="block text-sm font-semibold text-ink">Email address<span className="relative mt-2 block"><Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" /><input name="email" type="email" defaultValue={user.email} required className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-4 font-normal" /></span></label>
              <label className="block text-sm font-semibold text-ink sm:col-span-2">Current password <span className="font-normal text-ink/45">(required only when changing email)</span><span className="relative mt-2 block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" /><input name="currentPassword" type="password" autoComplete="current-password" placeholder="Confirm an email change" minLength={8} className="focus-ring h-14 w-full rounded-md border border-ink/15 bg-white pl-12 pr-4 font-normal" /></span></label>
              {profileFeedback ? <FeedbackMessage feedback={profileFeedback} /> : null}
              <div className="sm:col-span-2"><button type="submit" disabled={profileLoading} className="focus-ring inline-flex h-12 items-center gap-2 rounded-md bg-ink px-6 text-sm font-semibold text-white transition hover:bg-clay disabled:opacity-60"><Save size={16} />{profileLoading ? "Saving..." : "Save profile"}</button></div>
            </form>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="password-title">
            <div className="flex items-start gap-4 border-b border-slate-100 pb-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-[#fff0e8] text-clay"><KeyRound size={21} /></span>
              <div><h2 id="password-title" className="text-2xl font-bold text-ink">Password & security</h2><p className="mt-1 text-sm text-ink/55">Use a unique password with at least eight characters.</p></div>
            </div>
            <form onSubmit={changePassword} className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-ink sm:col-span-2">Current password<input name="currentPassword" type="password" autoComplete="current-password" minLength={8} required className="focus-ring mt-2 h-14 w-full rounded-md border border-ink/15 bg-white px-4 font-normal" /></label>
              <label className="block text-sm font-semibold text-ink">New password<input name="newPassword" type="password" autoComplete="new-password" minLength={8} required className="focus-ring mt-2 h-14 w-full rounded-md border border-ink/15 bg-white px-4 font-normal" /></label>
              <label className="block text-sm font-semibold text-ink">Confirm new password<input name="confirmation" type="password" autoComplete="new-password" minLength={8} required className="focus-ring mt-2 h-14 w-full rounded-md border border-ink/15 bg-white px-4 font-normal" /></label>
              {passwordFeedback ? <FeedbackMessage feedback={passwordFeedback} /> : null}
              <div className="sm:col-span-2"><button type="submit" disabled={passwordLoading} className="focus-ring inline-flex h-12 items-center gap-2 rounded-md border border-ink bg-white px-6 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white disabled:opacity-60"><KeyRound size={16} />{passwordLoading ? "Updating..." : "Change password"}</button></div>
            </form>
          </section>
        </div>
      </div>
    </section>
  );
}

function FeedbackMessage({ feedback }: { feedback: Exclude<Feedback, null> }) {
  return <p role={feedback.type === "error" ? "alert" : "status"} className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm sm:col-span-2 ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.type === "success" ? <CheckCircle2 size={16} /> : null}{feedback.message}</p>;
}
