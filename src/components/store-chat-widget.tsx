"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";

type ProductReference = { name: string; slug: string };
type Message = { role: "user" | "assistant"; content: string; products?: ProductReference[] };

function ProductLinks({ content, products = [] }: { content: string; products?: ProductReference[] }) {
  const references = [...products].sort((first, second) => second.name.length - first.name.length);
  if (!references.length) return <>{content}</>;
  const pattern = new RegExp(`(${references.map((product) => product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const lookup = new Map(references.map((product) => [product.name.toLocaleLowerCase(), product]));
  return <>{content.split(pattern).map((part, index) => {
    const product = lookup.get(part.toLocaleLowerCase());
    return product ? <Link key={`${product.slug}-${index}`} href={`/products/${product.slug}`} className="font-bold text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800">{part}</Link> : <span key={index}>{part}</span>;
  })}</>;
}

export function StoreChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Bonjour ! Je suis votre assistant CommerceCraft. Que recherchez-vous aujourd’hui ?" }]);
  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) return null;
  async function send(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }].slice(-8);
    setMessages(next); setInput(""); setBusy(true);
    try {
      const response = await fetch("/api/storefront/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const payload = await response.json() as { error?: string; data?: { message?: string; products?: ProductReference[] } };
      setMessages((current) => [...current, { role: "assistant", content: payload.error || payload.data?.message || "Je rencontre un problème temporaire. Réessayez dans un instant.", products: payload.data?.products }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", content: "Je rencontre un problème temporaire. Réessayez dans un instant." }]);
    } finally { setBusy(false); }
  }
  return <div className="fixed bottom-5 right-5 z-[70] sm:bottom-7 sm:right-7">
    {open ? <section aria-label="CommerceCraft assistant" className="mb-3 flex h-[min(560px,calc(100vh-110px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/25"><header className="flex items-center justify-between bg-[#172033] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#ef8354]"><Sparkles size={19} /></span><div><p className="font-bold">CommerceCraft Assistant</p><p className="text-xs text-white/65">Conseils produits instantanés</p></div></div><button onClick={() => setOpen(false)} aria-label="Fermer le chat" className="grid size-9 place-items-center rounded-full transition hover:bg-white/10"><X size={18} /></button></header><div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{messages.map((message, index) => <p key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "ml-auto rounded-br-md bg-[#ef8354] text-white" : "rounded-bl-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-100"}`}><ProductLinks content={message.content} products={message.products} /></p>)}{busy ? <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm"><Loader2 size={16} className="animate-spin" />L’assistant réfléchit…</span> : null}</div><form onSubmit={send} className="flex gap-2 border-t border-slate-100 bg-white p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={600} placeholder="Ex. Je cherche un cadeau…" className="min-w-0 flex-1 rounded-xl bg-slate-100 px-3 text-sm outline-none focus:ring-2 focus:ring-[#ef8354]/40" /><button disabled={busy || !input.trim()} aria-label="Envoyer" className="grid size-11 place-items-center rounded-xl bg-[#ef8354] text-white transition hover:bg-[#dd6e41] disabled:opacity-40"><Send size={18} /></button></form></section> : null}
    <button onClick={() => setOpen((value) => !value)} aria-label="Ouvrir le chat" className="group grid size-14 place-items-center rounded-full bg-[#ef8354] text-white shadow-xl shadow-orange-950/30 transition hover:scale-105 hover:bg-[#dd6e41]"><MessageCircle size={25} className="transition group-hover:scale-110" /></button>
  </div>;
}
