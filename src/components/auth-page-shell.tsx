import Image from "next/image";
import type { ReactNode } from "react";
import { Heart, PackageCheck, ShieldCheck } from "lucide-react";

type AuthPageShellProps = {
  mode: "login" | "register";
  children: ReactNode;
};

const content = {
  login: {
    eyebrow: "Member access",
    title: "Welcome back to your collection.",
    description:
      "Return to the pieces you saved, your personal cart and a quieter way to shop.",
    image:
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=1800&q=90",
    imageAlt: "A sculptural lounge chair in a thoughtfully styled room",
    formEyebrow: "Your account",
    formTitle: "Good to see you again.",
    formDescription: "Enter your details to continue where you left off."
  },
  register: {
    eyebrow: "Join CommerceCraft",
    title: "Make thoughtful shopping feel personal.",
    description:
      "Build a wishlist, keep your cart in sync and discover considered objects for everyday life.",
    image:
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1800&q=90",
    imageAlt: "A curated rail of modern clothing and everyday accessories",
    formEyebrow: "Free membership",
    formTitle: "Create your account.",
    formDescription: "A few details are all you need to get started."
  }
} as const;

const benefits = [
  { icon: Heart, label: "Save favorites" },
  { icon: PackageCheck, label: "Keep your cart" },
  { icon: ShieldCheck, label: "Private by design" }
];

export function AuthPageShell({ mode, children }: AuthPageShellProps) {
  const page = content[mode];

  return (
    <section className="bg-white">
      <div className="grid min-h-[760px] lg:grid-cols-[minmax(0,1.15fr)_minmax(440px,0.85fr)]">
        <div className="relative isolate min-h-[360px] overflow-hidden bg-ink text-white sm:min-h-[440px] lg:min-h-[760px]">
          <Image
            src={page.image}
            alt={page.imageAlt}
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#101827]/55" />
          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(16,24,39,0.92)_0%,rgba(16,24,39,0.14)_72%)]" />

          <div className="absolute inset-0 flex flex-col justify-end px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12 xl:px-20">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffb38f]">
                {page.eyebrow}
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
                {page.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
                {page.description}
              </p>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 border-y border-white/20 py-5">
              {benefits.map(({ icon: Icon, label }) => (
                <div key={label} className="flex min-w-0 flex-col gap-2 border-l border-white/20 px-3 first:border-l-0 first:pl-0 sm:flex-row sm:items-center sm:gap-3 sm:pl-5">
                  <Icon className="h-5 w-5 shrink-0 text-[#ffb38f]" aria-hidden="true" />
                  <span className="text-xs font-semibold leading-4 text-white/90 sm:text-sm">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center bg-linen px-5 py-12 sm:px-10 lg:px-12 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-clay">
              <span className="h-px w-8 bg-clay" aria-hidden="true" />
              {page.formEyebrow}
            </div>
            <h2 className="mt-5 text-3xl font-bold leading-tight text-ink sm:text-4xl">
              {page.formTitle}
            </h2>
            <p className="mt-3 leading-7 text-ink/65">{page.formDescription}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
