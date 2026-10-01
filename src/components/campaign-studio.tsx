"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Check, Pencil, Send, Copy, Trash2 } from "lucide-react";
import { CampaignBanner } from "@/components/campaign-banner";
import { campaignContentSchema, type Campaign, type CampaignBrief, type CampaignContent } from "@/lib/campaign-schema";
import type { Product, Category } from "@/types";

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0";
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json" } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "The request failed. Please try again.");
  return payload.data;
}

export function CampaignStudio({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [active, setActive] = useState<Campaign | null>(null);
  const [edit, setEdit] = useState<CampaignContent | null>(null);
  const [brief, setBrief] = useState<CampaignBrief>({ theme: "Create a seasonal collection that turns browsers into customers", audience: "People looking for everyday essentials", tone: "inspiring", language: "English", categoryIds: [], productIds: [] });
  const [busy, setBusy] = useState<string | null>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function toggleCategory(categoryId: string) {
    const categoryIds = brief.categoryIds.includes(categoryId) ? brief.categoryIds.filter((id) => id !== categoryId) : [...brief.categoryIds, categoryId];
    setBrief({ ...brief, categoryIds, productIds: [] });
  }
  async function load() {
    setBusy("loading"); setError("");
    try { setCampaigns(await request<Campaign[]>("/api/admin/campaigns")); setActive(null); setEdit(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load campaigns"); }
    finally { setBusy(null); }
  }
  useEffect(() => { void load(); }, []);
  function update(campaign: Campaign) {
    setCampaigns(items => [campaign, ...items.filter(item => item.id !== campaign.id)]);
    setActive(campaign); setEdit(null);
  }
  async function generate(event: React.FormEvent) {
    event.preventDefault(); setBusy("generating"); setError(""); setNotice("");
    try { const created = await request<Campaign>("/api/admin/campaigns", { method: "POST", body: JSON.stringify(brief) }); update(created); setNotice(created.generationSource === "catalog-fallback" ? "The AI provider is busy, so we created a smart catalog draft. Review and edit it before approval." : "Your AI campaign scenario is ready. Review it, approve it and publish it."); }
    catch (err) { setError(err instanceof Error ? err.message : "Generation failed"); }
    finally { setBusy(null); }
  }
  async function mutate(action: "edit" | "approve" | "publish" | "unpublish") {
    if (!active) return;
    if (action === "edit" && !campaignContentSchema.safeParse(edit).success) { setError("Complete all text fields and select 1 to 6 unique products. Check the field length limits."); return; }
    setBusy(action); setError(""); setNotice("");
    try {
      update(await request<Campaign>(`/api/admin/campaigns/${active.id}`, { method: "PATCH", body: JSON.stringify({ action, version: active.version, ...(action === "edit" ? { content: edit } : {}) }) }));
      setNotice(action === "publish" ? "Published on the storefront. Your social caption is ready to copy." : action === "approve" ? "Approved. The campaign is ready to publish." : "Saved as a draft. Approval is required before publication.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save campaign"); }
    finally { setBusy(null); }
  }
  async function removeCampaign() {
    if (!active || !window.confirm(`Delete “${active.title}”? This cannot be undone.`)) return;
    setBusy("deleting"); setError(""); setNotice("");
    try { await request<{ id: string }>(`/api/admin/campaigns/${active.id}`, { method: "DELETE", body: JSON.stringify({ version: active.version }) }); setCampaigns(items => items.filter(item => item.id !== active.id)); setActive(null); setEdit(null); setNotice("Campaign deleted. It has been removed from the storefront."); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to delete campaign"); }
    finally { setBusy(null); }
  }
  const preview = edit ?? active;
  const selected = preview?.productIds.flatMap(id => { const p = products.find(p => p.id === id); return p ? [p] : []; }) ?? [];
  return <div className="space-y-7">
    <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-6 shadow-sm"><div className="relative max-w-3xl"><p className="flex items-center gap-2 font-bold text-emerald-950"><span className="grid size-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm"><Sparkles size={18} /></span> AI Campaign Strategist</p><p className="mt-3 text-sm leading-6 text-slate-700">Give AI your business goal. It selects the strongest products, writes a customer scenario and produces every message needed to convert visitors.</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-white px-3 py-1.5 text-emerald-800 shadow-sm">Goal</span><span className="rounded-full bg-white px-3 py-1.5 text-emerald-800 shadow-sm">AI strategy</span><span className="rounded-full bg-white px-3 py-1.5 text-emerald-800 shadow-sm">Review & publish</span></div></div></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={load} disabled={!!busy} className="ml-3 underline">Reload campaigns</button></div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    <div className="grid items-start gap-7 xl:grid-cols-[390px_minmax(0,1fr)]">
      <aside className="space-y-5 xl:sticky xl:top-6"><form onSubmit={generate} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Campaign direction</p><h2 className="mt-1 font-bold text-slate-950">Give AI the goal</h2></div><span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">AI</span></div>
        <label className="block text-sm font-medium">Business goal<input className={inputClass} required minLength={3} maxLength={300} value={brief.theme} onChange={e => setBrief({ ...brief, theme: e.target.value })} /><span className="mt-1 block text-xs text-slate-500">Example: introduce summer essentials and encourage visitors to discover a complete routine.</span></label>
        <label className="block text-sm font-medium">Audience<input className={inputClass} required minLength={2} maxLength={200} value={brief.audience} onChange={e => setBrief({ ...brief, audience: e.target.value })} /></label>
        <label className="block text-sm font-medium">Tone<select className={inputClass} value={brief.tone} onChange={e => setBrief({ ...brief, tone: e.target.value as CampaignBrief["tone"] })}><option value="inspiring">Inspiring</option><option value="playful">Playful</option><option value="premium">Premium</option></select></label>
        <label className="block text-sm font-medium">Language<select className={inputClass} value={brief.language} onChange={e => setBrief({ ...brief, language: e.target.value as CampaignBrief["language"] })}><option>English</option><option>French</option></select></label>
        <fieldset><legend className="text-sm font-semibold">Catalog scope <span className="font-normal text-slate-400">(optional)</span></legend><p className="mt-1 text-xs text-slate-500">Choose categories to focus the strategy. Leave empty to let AI explore your entire catalog.</p><div className="mt-3 grid grid-cols-2 gap-2">{categories.map((category) => <label key={category.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2.5 text-xs transition ${brief.categoryIds.includes(category.id) ? "border-emerald-500 bg-emerald-50 text-emerald-950" : "border-slate-200 bg-white hover:border-emerald-300"}`}><input type="checkbox" checked={brief.categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} /><span className="min-w-0 flex-1 truncate font-semibold">{category.name}</span></label>)}</div></fieldset>
        <button className={`${buttonClass} w-full bg-emerald-700`} disabled={!!busy || !!edit}>{busy === "generating" ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}{busy === "generating" ? "Building your customer scenario…" : "Let AI build the campaign"}</button>
        <p className="text-xs leading-5 text-slate-500">AI decides which products tell the strongest story, then saves the complete campaign as a draft.</p>
      </form><div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Saved campaigns</h2><span className="text-xs text-slate-400">{campaigns.length}</span></div>{!campaigns.length && <p className="text-sm text-slate-500">{busy === "loading" ? "Loading…" : "Your first campaign starts with an idea."}</p>}<div className="max-h-52 space-y-2 overflow-auto">{campaigns.map(c => <button key={c.id} disabled={!!busy || !!edit} onClick={() => { setActive(c); setError(""); setNotice(""); }} className={`block w-full rounded-xl border p-3 text-left transition disabled:opacity-50 ${active?.id === c.id ? "border-emerald-500 bg-emerald-50 shadow-sm" : "border-slate-100 hover:border-slate-300"}`}><span className="block truncate text-sm font-semibold">{c.title}</span><span className="text-xs capitalize text-slate-500">{c.status} · {c.productIds.length} products</span></button>)}</div></div></aside>
      <section className="min-w-0 space-y-5">{preview && active ? <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-800">{edit ? "Editing draft" : active.status}</span><div className="flex flex-wrap gap-2">{edit ? <><button className={buttonClass} disabled={!!busy} onClick={() => mutate("edit")}>Save draft</button><button className={buttonClass} disabled={!!busy} onClick={() => setEdit(null)}>Cancel</button></> : <>
          <button className={buttonClass} disabled={!!busy || active.status === "published"} onClick={() => setEdit(campaignContentSchema.parse(active))}><Pencil size={15} /> Edit</button>
          <button className={buttonClass} disabled={!!busy || active.status !== "draft"} onClick={() => mutate("approve")}><Check size={15} /> Approve</button>
          <button className={`${buttonClass} bg-emerald-700`} disabled={!!busy || active.status !== "approved"} onClick={() => mutate("publish")}><Send size={15} /> Publish</button>
          {active.status === "published" && <><button className={buttonClass} disabled={!!busy} onClick={() => mutate("unpublish")}>Unpublish</button><Link className={buttonClass} href={`/campaigns/${active.id}`} target="_blank">View live</Link></>}<button className={`${buttonClass} bg-red-600 hover:bg-red-700`} disabled={!!busy} onClick={() => void removeCampaign()}><Trash2 size={15} /> Delete</button>
        </>}</div></div>
        <div className="overflow-hidden rounded-3xl shadow-xl shadow-slate-200/60"><CampaignBanner campaign={preview} products={selected} /></div>
        {edit && <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Edit campaign</h3><p className="text-xs text-slate-500">Saving changes resets approval. Published campaigns must be unpublished before editing.</p>{([['title', 'Title', 100], ['scenario', 'Customer scenario', 650], ['description', 'Description', 1200], ['bannerText', 'Banner text', 140], ['socialCaption', 'Social caption', 1500]] as const).map(([key, label, max]) => <label key={key} className="block text-sm font-medium">{label}<textarea className={inputClass} rows={key === "description" || key === "socialCaption" || key === "scenario" ? 3 : 2} maxLength={max} value={edit[key]} onChange={e => setEdit({ ...edit, [key]: e.target.value })} /></label>)}<label className="block text-sm font-medium">Banner palette<select className={inputClass} value={edit.palette} onChange={e => setEdit({ ...edit, palette: e.target.value as CampaignContent["palette"] })}><option value="sunset">Sunset</option><option value="ocean">Ocean</option><option value="forest">Forest</option></select></label><fieldset><legend className="mb-3 text-sm font-semibold">Product selection ({edit.productIds.length}/6)</legend><div className="max-h-64 space-y-2 overflow-auto">{products.map(p => <label key={p.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm"><input type="checkbox" checked={edit.productIds.includes(p.id)} disabled={!edit.productIds.includes(p.id) && (p.stock < 1 || edit.productIds.length >= 6)} onChange={e => setEdit({ ...edit, productIds: e.target.checked ? [...edit.productIds, p.id] : edit.productIds.filter(id => id !== p.id) })} />{p.name}<span className="ml-auto text-xs text-slate-500">{p.stock} in stock</span></label>)}</div></fieldset></div>}
        <div className="grid gap-5 md:grid-cols-2"><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-bold">AI customer scenario</h3><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{preview.scenario}</p><h3 className="mt-5 font-bold">Selected products</h3><ul className="mt-3 grid gap-2 sm:grid-cols-2">{preview.productIds.map(id => { const p = products.find(p => p.id === id); return <li key={id} className="flex gap-2 rounded-xl bg-slate-50 p-2.5 text-sm"><Check size={16} className="mt-0.5 shrink-0 text-emerald-700" /><span className="min-w-0 truncate">{p?.name ?? "Product removed"}{(!p || p.stock < 1) && <span className="block text-red-600">Unavailable</span>}</span></li>; })}</ul></div><div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Social caption</h3><button className="grid size-9 place-items-center rounded-full bg-slate-100 transition hover:bg-emerald-100" aria-label="Copy social caption" onClick={async () => { try { await navigator.clipboard.writeText(preview.socialCaption); setNotice("Social caption copied."); } catch { setError("Copy failed. Select and copy the caption manually."); } }}><Copy size={17} /></button></div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{preview.socialCaption}</p><p className="mt-4 text-xs text-slate-400">Ready to copy to your social channels.</p></div></div>
      </> : <div className="grid min-h-[560px] place-items-center rounded-3xl border border-dashed border-slate-300 bg-gradient-to-br from-white to-emerald-50/40 p-10 text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm"><Sparkles size={30} /></span><h2 className="mt-5 text-2xl font-bold">Your campaign preview</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">Select products, then let AI create the copy, visual direction and social caption here.</p></div></div>}</section>
    </div>
  </div>;
}
