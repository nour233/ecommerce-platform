"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Tags,
  Trash2,
  Users,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Category, Product, User, UserRole } from "@/types";
import { CloudinaryImageField } from "@/components/cloudinary-image-field";

type Section = "overview" | "products" | "categories" | "users";
type ProductDraft = Omit<Product, "id" | "categoryName" | "createdAt">;
type CategoryDraft = Omit<Category, "id">;

const emptyProduct: ProductDraft = { name: "", slug: "", description: "", categoryId: "", price: 0, rating: 0, stock: 0, imageUrl: "", tags: [] };
const emptyCategory: CategoryDraft = { name: "", slug: "", description: "", imageUrl: "" };
const inputClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";
const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

async function adminRequest<T>(url: string, options: RequestInit): Promise<T | null> {
  const response = await fetch(url, { ...options, headers: options.body ? { "Content-Type": "application/json" } : undefined });
  if (response.status === 204) return null;
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? "The operation failed");
  return payload.data as T;
}

export function AdminDashboard({ currentUser, initialProducts, initialCategories, initialUsers }: {
  currentUser: User;
  initialProducts: Product[];
  initialCategories: Category[];
  initialUsers: User[];
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [users, setUsers] = useState(initialUsers);
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inventoryValue = useMemo(() => products.reduce((sum, product) => sum + product.price * product.stock, 0), [products]);
  const totalStock = useMemo(() => products.reduce((sum, product) => sum + product.stock, 0), [products]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleProducts = products.filter((product) => !normalizedQuery || `${product.name} ${product.categoryName} ${product.slug}`.toLowerCase().includes(normalizedQuery));
  const visibleCategories = categories.filter((category) => !normalizedQuery || `${category.name} ${category.description}`.toLowerCase().includes(normalizedQuery));
  const visibleUsers = users.filter((user) => !normalizedQuery || `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(normalizedQuery));

  function selectSection(value: Section) { setSection(value); setQuery(""); setMessage(null); }
  function report(error: unknown) { setMessage(error instanceof Error ? error.message : "The operation failed"); }
  function openProduct(product?: Product) {
    setMessage(null); setProductId(product?.id ?? null);
    setProductDraft(product ? { name: product.name, slug: product.slug, description: product.description, categoryId: product.categoryId, price: product.price, rating: product.rating, stock: product.stock, imageUrl: product.imageUrl, tags: product.tags } : { ...emptyProduct, categoryId: categories[0]?.id ?? "" });
  }
  async function saveProduct(event: React.FormEvent) {
    event.preventDefault(); if (!productDraft) return; setBusy(true); setMessage(null);
    try {
      const saved = await adminRequest<Product>(productId ? `/api/admin/products/${productId}` : "/api/admin/products", { method: productId ? "PATCH" : "POST", body: JSON.stringify(productDraft) });
      if (saved) setProducts((items) => productId ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
      setProductDraft(null); setProductId(null);
    } catch (error) { report(error); } finally { setBusy(false); }
  }
  async function removeProduct(product: Product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try { await adminRequest(`/api/admin/products/${product.id}`, { method: "DELETE" }); setProducts((items) => items.filter((item) => item.id !== product.id)); }
    catch (error) { report(error); }
  }
  function openCategory(category?: Category) {
    setMessage(null); setCategoryId(category?.id ?? null);
    setCategoryDraft(category ? { name: category.name, slug: category.slug, description: category.description, imageUrl: category.imageUrl } : { ...emptyCategory });
  }
  async function saveCategory(event: React.FormEvent) {
    event.preventDefault(); if (!categoryDraft) return; setBusy(true); setMessage(null);
    try {
      const saved = await adminRequest<Category>(categoryId ? `/api/admin/categories/${categoryId}` : "/api/admin/categories", { method: categoryId ? "PATCH" : "POST", body: JSON.stringify(categoryDraft) });
      if (saved) {
        setCategories((items) => categoryId ? items.map((item) => item.id === saved.id ? saved : item) : [saved, ...items]);
        setProducts((items) => items.map((item) => item.categoryId === saved.id ? { ...item, categoryName: saved.name } : item));
      }
      setCategoryDraft(null); setCategoryId(null);
    } catch (error) { report(error); } finally { setBusy(false); }
  }
  async function removeCategory(category: Category) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    try { await adminRequest(`/api/admin/categories/${category.id}`, { method: "DELETE" }); setCategories((items) => items.filter((item) => item.id !== category.id)); }
    catch (error) { report(error); }
  }
  async function changeRole(user: User, role: UserRole) {
    try {
      const saved = await adminRequest<User>(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ role }) });
      if (saved) setUsers((items) => items.map((item) => item.id === saved.id ? saved : item));
    } catch (error) { report(error); }
  }
  async function removeUser(user: User) {
    if (!window.confirm(`Delete the account for ${user.name}?`)) return;
    try { await adminRequest(`/api/admin/users/${user.id}`, { method: "DELETE" }); setUsers((items) => items.filter((item) => item.id !== user.id)); }
    catch (error) { report(error); }
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }

  const nav = [
    { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
    { id: "products" as const, label: "Products", icon: Boxes, count: products.length },
    { id: "categories" as const, label: "Categories", icon: Tags, count: categories.length },
    { id: "users" as const, label: "Customers", icon: Users, count: users.filter((user) => user.role === "customer").length }
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_100%_0%,#dff7ed_0%,transparent_28%),linear-gradient(135deg,#f7faf9_0%,#f2f5f8_54%,#eef2f6_100%)] text-slate-950 lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex bg-[#111827] text-white shadow-2xl shadow-slate-950/20 lg:sticky lg:top-0 lg:h-screen lg:flex-col">
        <div className="flex min-w-64 items-center gap-3 px-6 py-6 lg:min-w-0">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff9b6d] to-[#e95d36] text-white shadow-lg shadow-orange-950/25"><ShoppingBag size={21} /></span>
          <div><p className="font-bold tracking-tight">CommerceCraft</p><p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Merchant workspace</p></div>
        </div>
        <nav className="flex flex-1 gap-1 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:py-6" aria-label="Admin navigation">
          <p className="hidden px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 lg:block">Workspace</p>
          {nav.map(({ id, label, icon: Icon, count }) => (
            <button key={id} type="button" onClick={() => selectSection(id)} className={`flex min-h-12 shrink-0 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition lg:w-full ${section === id ? "bg-white text-slate-950 shadow-lg shadow-black/10" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={18} /><span>{label}</span>{count !== undefined ? <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${section === id ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-400"}`}>{count}</span> : null}
            </button>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"><ExternalLink size={17} />View storefront</Link>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-sm font-bold shadow-lg shadow-emerald-950/30">{currentUser.name.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{currentUser.name}</p><p className="truncate text-xs text-slate-400">Administrator</p></div>
            <button type="button" onClick={logout} className="grid size-9 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white" title="Log out" aria-label="Log out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-[78px] items-center justify-between border-b border-white/80 bg-white/80 px-4 backdrop-blur-xl sm:px-8">
          <div className="relative hidden w-full max-w-md sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} disabled={section === "overview"} placeholder={section === "overview" ? "Select a workspace to search" : `Search ${section}...`} className="h-11 w-full rounded-xl border border-slate-200 bg-white/70 pl-10 pr-4 text-sm shadow-sm outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 disabled:opacity-60" />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex"><span className="mr-2 mt-1 size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,.12)]" />Store online</span>
            <Link href="/" className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md" title="Open storefront" aria-label="Open storefront"><ArrowUpRight size={18} /></Link>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">{section === "overview" ? `Welcome back, ${currentUser.name.split(" ")[0]}` : "Catalog management"}</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{section === "overview" ? "Your store at a glance" : nav.find((item) => item.id === section)?.label}</h1>
            </div>
            {section === "products" ? <PrimaryButton onClick={() => openProduct()} icon={PackagePlus}>Add product</PrimaryButton> : null}
            {section === "categories" ? <PrimaryButton onClick={() => openCategory()} icon={Plus}>Add category</PrimaryButton> : null}
          </div>

          {message ? <div role="alert" className="mb-5 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"><span>{message}</span><button onClick={() => setMessage(null)} aria-label="Dismiss"><X size={17} /></button></div> : null}

          {section === "overview" ? <Overview products={products} categories={categories} users={users} inventoryValue={inventoryValue} totalStock={totalStock} onNavigate={selectSection} /> : null}

          {section === "products" ? (
            <DataPanel title="Product inventory" detail={`${visibleProducts.length} of ${products.length} products`}>
              <AdminTable headers={["Product", "Category", "Price", "Inventory", "Rating", ""]}>
                {visibleProducts.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><Image src={product.imageUrl} alt="" width={52} height={52} className="size-13 rounded-md object-cover" /><div><p className="font-semibold text-slate-900">{product.name}</p><p className="mt-0.5 text-xs text-slate-400">{product.slug}</p></div></div></td>
                    <td className="px-5 py-3 text-sm text-slate-600">{product.categoryName}</td><td className="px-5 py-3 text-sm font-semibold">${product.price.toFixed(2)}</td>
                    <td className="px-5 py-3"><StockBadge stock={product.stock} /></td><td className="px-5 py-3 text-sm font-medium">{product.rating.toFixed(1)} <span className="text-amber-500">★</span></td>
                    <td className="px-5 py-3"><RowActions onEdit={() => openProduct(product)} onDelete={() => removeProduct(product)} /></td>
                  </tr>
                ))}
              </AdminTable>
            </DataPanel>
          ) : null}

          {section === "categories" ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleCategories.map((category) => {
                const count = products.filter((product) => product.categoryId === category.id).length;
                return <article key={category.id} className="group overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                  <div className="relative aspect-[16/8] overflow-hidden"><Image src={category.imageUrl} alt={category.name} fill className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" /><span className="absolute bottom-3 left-4 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800 backdrop-blur">{count} products</span></div>
                  <div className="flex items-start justify-between gap-4 p-5"><div><h2 className="text-lg font-bold">{category.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{category.description}</p></div><RowActions onEdit={() => openCategory(category)} onDelete={() => removeCategory(category)} /></div>
                </article>;
              })}
            </div>
          ) : null}

          {section === "users" ? (
            <DataPanel title="Customer directory" detail={`${visibleUsers.length} registered accounts`}>
              <AdminTable headers={["Customer", "Joined", "Access", "Status", ""]}>
                {visibleUsers.map((user) => <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-md text-sm font-bold ${user.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{user.name.slice(0, 2).toUpperCase()}</span><div><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div></div></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(user.createdAt))}</td>
                  <td className="px-5 py-4"><select value={user.role} disabled={user.id === currentUser.id} onChange={(event) => changeRole(user, event.target.value as UserRole)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"><option value="customer">Customer</option><option value="admin">Administrator</option></select></td>
                  <td className="px-5 py-4"><span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><span className="size-2 rounded-full bg-emerald-500" />Active</span></td>
                  <td className="px-5 py-4"><button type="button" disabled={user.id === currentUser.id} onClick={() => removeUser(user)} className="grid size-9 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-20" title="Delete account" aria-label={`Delete ${user.name}`}><Trash2 size={17} /></button></td>
                </tr>)}
              </AdminTable>
            </DataPanel>
          ) : null}
        </main>
      </div>

      {productDraft ? <Editor title={productId ? "Edit product" : "Add a product"} subtitle="Keep storefront information accurate and complete." onClose={() => setProductDraft(null)}><form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2"><Field label="Product name"><input required className={inputClass} value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} /></Field><Field label="URL slug"><input required className={inputClass} value={productDraft.slug} onChange={(e) => setProductDraft({ ...productDraft, slug: e.target.value })} /></Field><Field label="Category"><select required className={inputClass} value={productDraft.categoryId} onChange={(e) => setProductDraft({ ...productDraft, categoryId: e.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label="Product image"><CloudinaryImageField inputClassName={inputClass} value={productDraft.imageUrl} onChange={(imageUrl) => setProductDraft({ ...productDraft, imageUrl })} /></Field><Field label="Price"><input required type="number" min="0" step="0.01" className={inputClass} value={productDraft.price} onChange={(e) => setProductDraft({ ...productDraft, price: Number(e.target.value) })} /></Field><Field label="Stock"><input required type="number" min="0" className={inputClass} value={productDraft.stock} onChange={(e) => setProductDraft({ ...productDraft, stock: Number(e.target.value) })} /></Field><Field label="Rating"><input required type="number" min="0" max="5" step="0.1" className={inputClass} value={productDraft.rating} onChange={(e) => setProductDraft({ ...productDraft, rating: Number(e.target.value) })} /></Field><Field label="Tags"><input className={inputClass} value={productDraft.tags.join(", ")} onChange={(e) => setProductDraft({ ...productDraft, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></Field><div className="sm:col-span-2"><Field label="Description"><textarea required minLength={10} rows={4} className={`${inputClass} py-3`} value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} /></Field></div><FormActions busy={busy} onCancel={() => setProductDraft(null)} /></form></Editor> : null}
      {categoryDraft ? <Editor title={categoryId ? "Edit category" : "Add a category"} subtitle="Organize the catalog into clear storefront collections." onClose={() => setCategoryDraft(null)}><form onSubmit={saveCategory} className="grid gap-4"><Field label="Category name"><input required className={inputClass} value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /></Field><Field label="URL slug"><input required className={inputClass} value={categoryDraft.slug} onChange={(e) => setCategoryDraft({ ...categoryDraft, slug: e.target.value })} /></Field><Field label="Cover image"><CloudinaryImageField inputClassName={inputClass} value={categoryDraft.imageUrl} onChange={(imageUrl) => setCategoryDraft({ ...categoryDraft, imageUrl })} /></Field><Field label="Description"><textarea required minLength={5} rows={4} className={`${inputClass} py-3`} value={categoryDraft.description} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} /></Field><FormActions busy={busy} onCancel={() => setCategoryDraft(null)} /></form></Editor> : null}
    </div>
  );
}

function Overview({ products, categories, users, inventoryValue, totalStock, onNavigate }: { products: Product[]; categories: Category[]; users: User[]; inventoryValue: number; totalStock: number; onNavigate: (section: Section) => void }) {
  const stats = [
    { label: "Catalog value", value: `$${integerFormatter.format(inventoryValue)}`, note: `${totalStock} units in stock`, icon: CircleDollarSign, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Active products", value: products.length.toString(), note: `${products.filter((item) => item.stock < 10).length} need attention`, icon: Boxes, tone: "bg-sky-50 text-sky-700" },
    { label: "Collections", value: categories.length.toString(), note: "Storefront categories", icon: Tags, tone: "bg-amber-50 text-amber-700" },
    { label: "Customers", value: users.filter((user) => user.role === "customer").length.toString(), note: `${users.filter((user) => user.role === "admin").length} administrators`, icon: Users, tone: "bg-violet-50 text-violet-700" }
  ];
  const maxStock = Math.max(...products.map((product) => product.stock), 1);
  return <div className="space-y-7">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="group rounded-2xl border border-white bg-white/90 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span><ArrowUpRight size={17} className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-600" /></div><p className="mt-6 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1.5 text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs font-medium text-slate-400">{note}</p></article>)}</div>
    <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
      <DataPanel title="Inventory health" detail="Stock distribution by product">
        <div className="space-y-5 p-5">{products.slice(0, 6).map((product) => <div key={product.id}><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="truncate font-medium text-slate-700">{product.name}</span><span className="text-slate-500">{product.stock} units</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${product.stock < 10 ? "bg-[#ef8354]" : "bg-emerald-500"}`} style={{ width: `${Math.max(5, product.stock / maxStock * 100)}%` }} /></div></div>)}</div>
      </DataPanel>
      <div className="rounded-2xl bg-[radial-gradient(circle_at_100%_0%,#2c5364_0%,transparent_42%),#172033] p-6 text-white shadow-xl shadow-slate-900/15"><span className="grid size-11 place-items-center rounded-2xl bg-[#ef8354] shadow-lg shadow-orange-950/30"><Sparkles size={20} /></span><h2 className="mt-6 text-xl font-bold tracking-tight">Catalog control</h2><p className="mt-2 text-sm leading-6 text-slate-400">Keep product details, stock levels, collections and customer access current from one workspace.</p><div className="mt-6 space-y-2.5"><button onClick={() => onNavigate("products")} className="flex min-h-11 w-full items-center justify-between rounded-xl bg-white px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5">Manage inventory <ArrowUpRight size={17} /></button><button onClick={() => onNavigate("users")} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/10">Review customers <ArrowUpRight size={17} /></button></div></div>
    </div>
  </div>;
}

function PrimaryButton({ onClick, icon: Icon, children }: { onClick: () => void; icon: typeof Plus; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl"><Icon size={18} />{children}</button>; }
function DataPanel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-2xl border border-white bg-white/90 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="font-bold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-xs font-medium text-slate-400">{detail}</p></div></div>{children}</section>; }
function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr>{headers.map((header) => <th key={header} className="px-5 py-3.5 font-bold">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function StockBadge({ stock }: { stock: number }) { const style = stock === 0 ? "bg-red-50 text-red-700" : stock < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{stock === 0 ? "Out of stock" : `${stock} in stock`}</span>; }
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <div className="flex justify-end gap-1"><button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className="grid size-9 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><Pencil size={17} /></button><button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className="grid size-9 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div>; }
function Editor({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={title}><div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-[#f8fafc] shadow-2xl shadow-slate-950/30"><div className="flex items-start justify-between border-b border-slate-200 bg-white px-7 py-6"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Catalog editor</p><h2 className="text-2xl font-bold tracking-tight">{title}</h2><p className="mt-1.5 text-sm text-slate-500">{subtitle}</p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={19} /></button></div><div className="p-7">{children}</div></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>{children}</label>; }
function FormActions({ busy, onCancel }: { busy: boolean; onCancel: () => void }) { return <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 sm:col-span-2"><button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancel</button><button disabled={busy} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-50">{busy ? "Saving..." : "Save changes"}</button></div>; }
