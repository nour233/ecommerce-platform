"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Check, Pencil, Send, Copy, Trash2 } from "lucide-react";
import { CampaignBanner } from "@/components/campaign-banner";
import { campaignContentSchema, type Campaign, type CampaignBrief, type CampaignContent } from "@/lib/campaign-schema";
import type { Product, Category } from "@/types";

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40";
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
  const [brief, setBrief] = useState<CampaignBrief>({ theme: "Summer Collection", audience: "People looking for everyday essentials", tone: "inspiring", language: "English", categoryId: "" });
  const [busy, setBusy] = useState<string | null>("loading");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
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
    try { const created = await request<Campaign>("/api/admin/campaigns", { method: "POST", body: JSON.stringify(brief) }); update(created); setNotice(created.generationSource === "catalog-fallback" ? "Gemini’s free quota is busy, so we created a smart catalog draft. Review and edit it before approval." : "Campaign saved as a draft. Review the copy and product selection before approval."); }
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
  return <div className="space-y-6">
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="flex items-center gap-2 font-bold text-emerald-950"><Sparkles size={20} /> AI Campaign Generator</p><p className="mt-2 text-sm leading-6 text-emerald-900">Turn an idea into a complete collection: creative copy, selected products, a visual banner and a social caption. Powered by Gemini. Works on your hosted store; free-tier quotas apply.</p><p className="mt-1 text-xs text-emerald-800">Generate → Edit → Approve → Publish to your storefront</p></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={load} disabled={!!busy} className="ml-3 underline">Reload campaigns</button></div>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[320px_1fr]">
      <div className="space-y-5"><form onSubmit={generate} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Campaign brief</h2>
        <label className="block text-sm font-medium">Theme / objective<input className={inputClass} required minLength={3} maxLength={300} value={brief.theme} onChange={e => setBrief({ ...brief, theme: e.target.value })} /></label>
        <label className="block text-sm font-medium">Audience<input className={inputClass} required minLength={2} maxLength={200} value={brief.audience} onChange={e => setBrief({ ...brief, audience: e.target.value })} /></label>
        <label className="block text-sm font-medium">Tone<select className={inputClass} value={brief.tone} onChange={e => setBrief({ ...brief, tone: e.target.value as CampaignBrief["tone"] })}><option value="inspiring">Inspiring</option><option value="playful">Playful</option><option value="premium">Premium</option></select></label>
        <label className="block text-sm font-medium">Language<select className={inputClass} value={brief.language} onChange={e => setBrief({ ...brief, language: e.target.value as CampaignBrief["language"] })}><option>English</option><option>French</option></select></label>
        <label className="block text-sm font-medium">Products<select className={inputClass} value={brief.categoryId} onChange={e => setBrief({ ...brief, categoryId: e.target.value })}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <button className={`${buttonClass} w-full bg-emerald-700`} disabled={!!busy || !!edit || !products.some(p => p.stock > 0 && (!brief.categoryId || p.categoryId === brief.categoryId))}>{busy === "generating" ? <Loader2 className="animate-spin" size={17} /> : <Sparkles size={17} />}{busy === "generating" ? "Creating your campaign…" : "Generate campaign"}</button>
        <p className="text-xs leading-5 text-slate-500">Generation can take up to one minute. Every generated campaign is saved as a draft.</p>
      </form><div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="mb-3 font-bold">Saved campaigns</h2>{!campaigns.length && <p className="text-sm text-slate-500">{busy === "loading" ? "Loading…" : "Your first campaign starts with an idea."}</p>}<div className="max-h-96 space-y-2 overflow-auto">{campaigns.map(c => <button key={c.id} disabled={!!busy || !!edit} onClick={() => { setActive(c); setError(""); setNotice(""); }} className={`block w-full rounded-xl border p-3 text-left disabled:opacity-50 ${active?.id === c.id ? "border-emerald-500 bg-emerald-50" : "border-slate-100"}`}><span className="block text-sm font-semibold">{c.title}</span><span className="text-xs capitalize text-slate-500">{c.status} · {c.productIds.length} products</span></button>)}</div></div></div>
      <div className="min-w-0 space-y-5">{preview && active ? <>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-emerald-800">{edit ? "Editing draft" : active.status}</span><div className="flex flex-wrap gap-2">{edit ? <><button className={buttonClass} disabled={!!busy} onClick={() => mutate("edit")}>Save draft</button><button className={buttonClass} disabled={!!busy} onClick={() => setEdit(null)}>Cancel</button></> : <>
          <button className={buttonClass} disabled={!!busy || active.status === "published"} onClick={() => setEdit(campaignContentSchema.parse(active))}><Pencil size={15} /> Edit</button>
          <button className={buttonClass} disabled={!!busy || active.status !== "draft"} onClick={() => mutate("approve")}><Check size={15} /> Approve</button>
          <button className={`${buttonClass} bg-emerald-700`} disabled={!!busy || active.status !== "approved"} onClick={() => mutate("publish")}><Send size={15} /> Publish</button>
          {active.status === "published" && <><button className={buttonClass} disabled={!!busy} onClick={() => mutate("unpublish")}>Unpublish</button><Link className={buttonClass} href={`/campaigns/${active.id}`} target="_blank">View live</Link></>}<button className={`${buttonClass} bg-red-600 hover:bg-red-700`} disabled={!!busy} onClick={() => void removeCampaign()}><Trash2 size={15} /> Delete</button>
        </>}</div></div>
        <CampaignBanner campaign={preview} products={selected} />
        {edit && <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Edit campaign</h3><p className="text-xs text-slate-500">Saving changes resets approval. Published campaigns must be unpublished before editing.</p>{([['title', 'Title', 100], ['description', 'Description', 1200], ['bannerText', 'Banner text', 140], ['socialCaption', 'Social caption', 1500]] as const).map(([key, label, max]) => <label key={key} className="block text-sm font-medium">{label}<textarea className={inputClass} rows={key === "description" || key === "socialCaption" ? 3 : 2} maxLength={max} value={edit[key]} onChange={e => setEdit({ ...edit, [key]: e.target.value })} /></label>)}<label className="block text-sm font-medium">Banner palette<select className={inputClass} value={edit.palette} onChange={e => setEdit({ ...edit, palette: e.target.value as CampaignContent["palette"] })}><option value="sunset">Sunset</option><option value="ocean">Ocean</option><option value="forest">Forest</option></select></label><fieldset><legend className="mb-3 text-sm font-semibold">Product selection ({edit.productIds.length}/6)</legend><div className="max-h-64 space-y-2 overflow-auto">{products.map(p => <label key={p.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm"><input type="checkbox" checked={edit.productIds.includes(p.id)} disabled={!edit.productIds.includes(p.id) && (p.stock < 1 || edit.productIds.length >= 6)} onChange={e => setEdit({ ...edit, productIds: e.target.checked ? [...edit.productIds, p.id] : edit.productIds.filter(id => id !== p.id) })} />{p.name}<span className="ml-auto text-xs text-slate-500">{p.stock} in stock</span></label>)}</div></fieldset></div>}
        <div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Selected products</h3><ul className="mt-3 space-y-3">{preview.productIds.map(id => { const p = products.find(p => p.id === id); return <li key={id} className="flex gap-2 text-sm"><Check size={16} className="shrink-0 text-emerald-700" /><span>{p?.name ?? "Product removed"}{(!p || p.stock < 1) && <span className="block text-red-600">Unavailable — update your selection</span>}</span></li>; })}</ul></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">Social caption</h3><button aria-label="Copy social caption" onClick={async () => { try { await navigator.clipboard.writeText(preview.socialCaption); setNotice("Social caption copied."); } catch { setError("Copy failed. Select and copy the caption manually."); } }}><Copy size={17} /></button></div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{preview.socialCaption}</p><p className="mt-4 text-xs text-slate-400">Ready to copy to your social channels.</p></div></div>
      </> : <div className="grid min-h-[500px] place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center"><div><Sparkles className="mx-auto text-emerald-600" size={40} /><h2 className="mt-5 text-2xl font-bold">One idea. A complete campaign.</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">Describe your collection and let AI create its story. Preview it here before it reaches your customers.</p></div></div>}</div>
    </div>
  </div>;
}
