"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Activity,
  AlertTriangle,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Heart,
  Layers3,
  Lightbulb,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tags,
  Target,
  Trash2,
  TrendingUp,
  Users,
  WandSparkles,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Category, Product, StoreInsight, User, UserCommerceData, UserRole } from "@/types";
import { CloudinaryImageField } from "@/components/cloudinary-image-field";
import { buildStoreInsights } from "@/lib/services/store-insights";
import { CampaignStudio } from "@/components/campaign-studio";

type Section = "overview" | "products" | "categories" | "users" | "campaigns";
type ProductDraft = Omit<Product, "id" | "categoryName" | "createdAt">;
type CategoryDraft = Omit<Category, "id">;
type UserDraft = Pick<User, "name" | "email" | "role">;
type UserCommerce = UserCommerceData;
type AiProductSuggestion = Pick<ProductDraft, "name" | "slug" | "description" | "categoryId" | "price" | "tags">;

const emptyProduct: ProductDraft = { name: "", slug: "", description: "", categoryId: "", price: 0, rating: 0, stock: 0, imageUrl: "", tags: [] };
const emptyCategory: CategoryDraft = { name: "", slug: "", description: "", imageUrl: "" };
const inputClass = "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";
const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const editableNumber = (value: number) => value === 0 ? "" : value;
const parseEditableNumber = (value: string) => value === "" ? 0 : Number(value);
const toSlug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);

async function adminRequest<T>(url: string, options: RequestInit): Promise<T | null> {
  const response = await fetch(url, { ...options, headers: options.body ? { "Content-Type": "application/json" } : undefined });
  if (response.status === 204) return null;
  const payload = await response.json() as { data?: T; error?: string; details?: { fieldErrors?: Record<string, string[] | undefined> } };
  if (!response.ok) {
    const firstFieldError = Object.values(payload.details?.fieldErrors ?? {}).flat().find(Boolean);
    throw new Error(firstFieldError ?? payload.error ?? "The operation failed");
  }
  return payload.data as T;
}

export function AdminDashboard({ currentUser, initialProducts, initialCategories, initialUsers, initialUserCommerce }: {
  currentUser: User;
  initialProducts: Product[];
  initialCategories: Category[];
  initialUsers: User[];
  initialUserCommerce: UserCommerce[];
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [users, setUsers] = useState(initialUsers);
  const [userCommerce] = useState(initialUserCommerce);
  const [productDraft, setProductDraft] = useState<ProductDraft | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryProductsId, setCategoryProductsId] = useState<string | null>(null);
  const [userDraft, setUserDraft] = useState<UserDraft | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inventoryValue = useMemo(() => products.reduce((sum, product) => sum + product.price * product.stock, 0), [products]);
  const totalStock = useMemo(() => products.reduce((sum, product) => sum + product.stock, 0), [products]);
  const cartItemCount = useMemo(() => userCommerce.reduce((total, commerce) => total + commerce.cart.reduce((count, item) => count + item.quantity, 0), 0), [userCommerce]);
  const wishlistItemCount = useMemo(() => userCommerce.reduce((total, commerce) => total + commerce.wishlist.length, 0), [userCommerce]);
  const insights = useMemo(() => buildStoreInsights(products, categories, userCommerce), [products, categories, userCommerce]);
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
  async function generateProductDetails(imageUrl?: string) {
    const sourceImage = imageUrl ?? productDraft?.imageUrl;
    if (!sourceImage || !productDraft) {
      setMessage("Upload or paste a product image before using AI generation.");
      return;
    }
    setAiGenerating(true); setMessage(null);
    try {
      const suggestion = await adminRequest<AiProductSuggestion>("/api/admin/ai/product-details", { method: "POST", body: JSON.stringify({ imageUrl: sourceImage }) });
      if (suggestion) setProductDraft((current) => current ? { ...current, ...suggestion, imageUrl: sourceImage } : current);
    } catch (error) { report(error); } finally { setAiGenerating(false); }
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
      const saved = await adminRequest<User>(`/api/admin/users/${user.id}`, { method: "PATCH", body: JSON.stringify({ name: user.name, email: user.email, role }) });
      if (saved) setUsers((items) => items.map((item) => item.id === saved.id ? saved : item));
    } catch (error) { report(error); }
  }
  function openUser(user: User) {
    setMessage(null);
    setUserId(user.id);
    setUserDraft({ name: user.name, email: user.email, role: user.role });
  }
  async function saveUser(event: React.FormEvent) {
    event.preventDefault();
    if (!userDraft || !userId) return;
    setBusy(true); setMessage(null);
    try {
      const saved = await adminRequest<User>(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(userDraft) });
      if (saved) setUsers((items) => items.map((item) => item.id === saved.id ? saved : item));
      setUserDraft(null); setUserId(null);
    } catch (error) { report(error); } finally { setBusy(false); }
  }
  async function removeUser(user: User) {
    if (!window.confirm(`Delete the account for ${user.name}?`)) return;
    try { await adminRequest(`/api/admin/users/${user.id}`, { method: "DELETE" }); setUsers((items) => items.filter((item) => item.id !== user.id)); }
    catch (error) { report(error); }
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }

  const nav = [
    { id: "campaigns" as const, label: "AI Campaigns", icon: Sparkles },
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

          {section === "overview" ? <Overview products={products} categories={categories} users={users} userCommerce={userCommerce} inventoryValue={inventoryValue} totalStock={totalStock} cartItemCount={cartItemCount} wishlistItemCount={wishlistItemCount} insights={insights} onNavigate={selectSection} /> : null}

          {section === "campaigns" ? <CampaignStudio products={products} categories={categories} /> : null}

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
                return <article key={category.id} role="button" tabIndex={0} onClick={() => setCategoryProductsId(category.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCategoryProductsId(category.id); } }} className="group cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                  <div className="relative aspect-[16/8] overflow-hidden"><Image src={category.imageUrl} alt={category.name} fill className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" /><span className="absolute bottom-3 left-4 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800 backdrop-blur">{count} products</span></div>
                  <div className="flex items-start justify-between gap-4 p-5"><div><h2 className="text-lg font-bold">{category.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{category.description}</p><p className="mt-4 text-xs font-bold text-emerald-700">View {count} product{count === 1 ? "" : "s"} →</p></div><div onClick={(event) => event.stopPropagation()}><RowActions onEdit={() => openCategory(category)} onDelete={() => removeCategory(category)} /></div></div>
                </article>;
              })}
            </div>
          ) : null}

          {section === "users" ? (
            <DataPanel title="Customer directory" detail={`${visibleUsers.length} registered accounts`}>
              <AdminTable headers={["Customer", "Joined", "Cart", "Saved", "Access", "Status", ""]}>
                {visibleUsers.map((user) => <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-md text-sm font-bold ${user.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{user.name.slice(0, 2).toUpperCase()}</span><div><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-500">{user.email}</p></div></div></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(user.createdAt))}</td>
                  <td className="px-5 py-4"><CommerceCount icon={ShoppingCart} value={userCommerce.find((item) => item.userId === user.id)?.cart.reduce((total, item) => total + item.quantity, 0) ?? 0} /></td>
                  <td className="px-5 py-4"><CommerceCount icon={Heart} value={userCommerce.find((item) => item.userId === user.id)?.wishlist.length ?? 0} /></td>
                  <td className="px-5 py-4"><select value={user.role} disabled={user.id === currentUser.id} onChange={(event) => changeRole(user, event.target.value as UserRole)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"><option value="customer">Customer</option><option value="admin">Administrator</option></select></td>
                  <td className="px-5 py-4"><UserPresence lastActiveAt={user.lastActiveAt} /></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => openUser(user)} className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">View</button><button type="button" disabled={user.id === currentUser.id} onClick={() => removeUser(user)} className="grid size-9 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-20" title="Delete account" aria-label={`Delete ${user.name}`}><Trash2 size={17} /></button></div></td>
                </tr>)}
              </AdminTable>
            </DataPanel>
          ) : null}
        </main>
      </div>

      {productDraft ? (
        <Editor title={productId ? "Edit product" : "Add a product"} subtitle="Keep storefront information accurate and complete." onClose={() => setProductDraft(null)}>
          <form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name"><input required className={inputClass} value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} /></Field>
            <Field label="URL slug"><input required className={inputClass} value={productDraft.slug} onChange={(e) => setProductDraft({ ...productDraft, slug: e.target.value })} /></Field>
            <Field label="Category"><select required className={inputClass} value={productDraft.categoryId} onChange={(e) => setProductDraft({ ...productDraft, categoryId: e.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
            <Field label="Product image">
              <CloudinaryImageField inputClassName={inputClass} value={productDraft.imageUrl} onChange={(imageUrl) => setProductDraft({ ...productDraft, imageUrl })} onUploaded={(imageUrl) => void generateProductDetails(imageUrl)} />
              <button type="button" disabled={!productDraft.imageUrl || aiGenerating} onClick={() => void generateProductDetails()} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-sm font-bold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"><WandSparkles size={16} className={aiGenerating ? "animate-pulse" : ""} />{aiGenerating ? "AI is analyzing the image…" : "Generate product details with AI"}</button>
              <p className="mt-2 text-xs leading-5 text-slate-500">AI suggests editable catalog details from the image. Review them before saving.</p>
            </Field>
            <Field label="Price"><input required type="number" min="0" step="0.01" className={inputClass} value={editableNumber(productDraft.price)} onChange={(e) => setProductDraft({ ...productDraft, price: parseEditableNumber(e.target.value) })} /></Field>
            <Field label="Stock"><input required type="number" min="0" className={inputClass} value={editableNumber(productDraft.stock)} onChange={(e) => setProductDraft({ ...productDraft, stock: parseEditableNumber(e.target.value) })} /></Field>
            <Field label="Rating"><input required type="number" min="0" max="5" step="0.1" className={inputClass} value={editableNumber(productDraft.rating)} onChange={(e) => setProductDraft({ ...productDraft, rating: parseEditableNumber(e.target.value) })} /></Field>
            <Field label="Tags"><input className={inputClass} value={productDraft.tags.join(", ")} onChange={(e) => setProductDraft({ ...productDraft, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></Field>
            <div className="sm:col-span-2"><Field label="Description"><textarea required minLength={10} rows={4} className={`${inputClass} py-3`} value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} /></Field></div>
            <FormActions busy={busy} onCancel={() => setProductDraft(null)} />
          </form>
        </Editor>
      ) : null}
      {categoryDraft ? <Editor title={categoryId ? "Edit category" : "Add a category"} subtitle="Organize the catalog into clear storefront collections." onClose={() => setCategoryDraft(null)}><form onSubmit={saveCategory} className="grid gap-4"><Field label="Category name"><input required className={inputClass} value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value, slug: categoryId ? categoryDraft.slug : toSlug(e.target.value) })} /></Field><Field label="URL slug"><input required className={inputClass} value={categoryDraft.slug} onChange={(e) => setCategoryDraft({ ...categoryDraft, slug: toSlug(e.target.value) })} /><p className="mt-1 text-xs text-slate-500">Created automatically from the category name. You can edit it.</p></Field><Field label="Cover image"><CloudinaryImageField inputClassName={inputClass} value={categoryDraft.imageUrl} onChange={(imageUrl) => setCategoryDraft({ ...categoryDraft, imageUrl })} /></Field><Field label="Description"><textarea required minLength={5} rows={4} className={`${inputClass} py-3`} value={categoryDraft.description} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} /></Field><FormActions busy={busy} onCancel={() => setCategoryDraft(null)} /></form></Editor> : null}
      {categoryProductsId ? <CategoryProducts category={categories.find((category) => category.id === categoryProductsId) ?? null} products={products.filter((product) => product.categoryId === categoryProductsId)} onClose={() => setCategoryProductsId(null)} /> : null}
      {userDraft && userId ? <UserEditor user={users.find((user) => user.id === userId) ?? null} commerce={userCommerce.find((item) => item.userId === userId)} currentUserId={currentUser.id} draft={userDraft} busy={busy} onDraftChange={setUserDraft} onClose={() => { setUserDraft(null); setUserId(null); }} onSubmit={saveUser} /> : null}
    </div>
  );
}

function Overview({ products, categories, users, userCommerce, inventoryValue, totalStock, cartItemCount, wishlistItemCount, insights, onNavigate }: { products: Product[]; categories: Category[]; users: User[]; userCommerce: UserCommerce[]; inventoryValue: number; totalStock: number; cartItemCount: number; wishlistItemCount: number; insights: StoreInsight[]; onNavigate: (section: Section) => void }) {
  const lowStock = products.filter((item) => item.stock < 10);
  const availableProducts = products.filter((item) => item.stock > 0).length;
  const healthScore = products.length ? Math.round((availableProducts / products.length) * 65 + (lowStock.length === 0 ? 35 : Math.max(5, 35 - lowStock.length * 8))) : 0;
  const categoryDistribution = categories.map((category) => ({ category, count: products.filter((product) => product.categoryId === category.id).length }));
  const largestCollection = categoryDistribution.reduce((largest, item) => item.count > largest.count ? item : largest, categoryDistribution[0] ?? { category: null, count: 0 });
  const engagement = products.map((product) => {
    const carts = userCommerce.reduce((total, commerce) => total + commerce.cart.filter((item) => item.productId === product.id).reduce((quantity, item) => quantity + item.quantity, 0), 0);
    const saves = userCommerce.reduce((total, commerce) => total + commerce.wishlist.filter((item) => item.productId === product.id).length, 0);
    return { product, carts, saves, score: carts * 2 + saves };
  }).sort((a, b) => b.score - a.score);
  const demandLeader = engagement[0];
  const stats = [
    { label: "Total users", value: users.length.toString(), note: `${users.filter(user => user.role === "customer").length} customer accounts`, icon: Users, tone: "bg-violet-50 text-violet-700" },
    { label: "Total products", value: products.length.toString(), note: `${availableProducts} currently available`, icon: Boxes, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Total categories", value: categories.length.toString(), note: "Active store collections", icon: Tags, tone: "bg-orange-50 text-orange-700" },
    { label: "Items in carts", value: cartItemCount.toString(), note: "Active purchase intent", icon: ShoppingCart, tone: "bg-sky-50 text-sky-700" },
    { label: "Items in wishlists", value: wishlistItemCount.toString(), note: "Products customers saved", icon: Heart, tone: "bg-rose-50 text-rose-700" }
  ];
  const maxStock = Math.max(...products.map((product) => product.stock), 1);
  return <div className="space-y-7">
    <section className="relative overflow-hidden rounded-3xl bg-[#172033] p-6 text-white shadow-xl shadow-slate-900/15 sm:p-8">
      <div className="absolute -right-20 -top-24 size-80 rounded-full bg-emerald-400/10 blur-3xl" /><div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="relative grid gap-7 xl:grid-cols-[1.1fr_.9fr]"><div><div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,.12)]" />STORE PULSE</div><h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">Your business, clearly in view.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">The essentials first: customers, catalog and the shopping activity happening in your store right now.</p></div><div className="grid grid-cols-3 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Catalog value</p><p className="mt-2 text-xl font-bold">${integerFormatter.format(inventoryValue)}</p><p className="mt-1 text-xs text-slate-400">{totalStock} units</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Stock health</p><p className="mt-2 text-xl font-bold text-emerald-200">{healthScore}%</p><p className="mt-1 text-xs text-slate-400">{lowStock.length} need review</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] px-4 py-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Top signal</p><p className="mt-2 truncate text-sm font-bold">{demandLeader?.product.name ?? "No activity yet"}</p><p className="mt-1 text-xs text-slate-400">{demandLeader?.score ?? 0} intent points</p></div></div></div>
    </section>
    <section><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">Core metrics</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Store overview</h2></div><p className="hidden text-xs font-medium text-slate-500 sm:block">Updated from your live catalog and customer activity</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{stats.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="group relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(15,23,42,0.10)]"><div className={`absolute inset-x-0 top-0 h-1 ${tone.split(" ")[0]}`} /><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span><ArrowUpRight size={17} className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-600" /></div><p className="mt-6 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1.5 text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs font-medium text-slate-400">{note}</p></article>)}</div></section>
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <DataPanel title="Action queue" detail="The next highest-impact actions for your storefront">
        <div className="divide-y divide-slate-100">{[
          { icon: lowStock.length ? AlertTriangle : CheckCircle2, tone: lowStock.length ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700", title: lowStock.length ? `${lowStock.length} products need a stock decision` : "Inventory is healthy", detail: lowStock.length ? `${lowStock.slice(0, 2).map((product) => product.name).join(" and ")}${lowStock.length > 2 ? " need review." : " need review."}` : "All listed products are above the low-stock threshold.", action: "Open inventory", target: "products" as Section },
          { icon: Heart, tone: "bg-rose-50 text-rose-700", title: demandLeader?.score ? `${demandLeader.product.name} has the strongest intent` : "Customer intent is still building", detail: demandLeader?.score ? `${demandLeader.carts} cart signals and ${demandLeader.saves} saves point to this product.` : "As customers add products to carts and wishlists, their signals appear here.", action: "Review products", target: "products" as Section },
          { icon: Layers3, tone: "bg-sky-50 text-sky-700", title: largestCollection.category ? `${largestCollection.category.name} is your deepest collection` : "No collection balance yet", detail: largestCollection.category ? `${largestCollection.count} products are grouped here. Use complementary collections to improve discovery.` : "Create a category to give your catalog structure.", action: "Manage collections", target: "categories" as Section }
        ].map(({ icon: Icon, tone, title, detail, action, target }) => <div key={title} className="flex items-start gap-4 p-5"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span><div className="min-w-0 flex-1"><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{detail}</p></div><button onClick={() => onNavigate(target)} className="shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">{action}</button></div>)}</div>
      </DataPanel>
      <section className="overflow-hidden rounded-2xl border border-white bg-white/90 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-violet-600">Demand map</p><h2 className="mt-1 font-bold tracking-tight text-slate-900">Customer signals</h2></div><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Target size={18} /></span></div><div className="space-y-4 p-5">{engagement.slice(0, 4).map(({ product, carts, saves, score }, index) => <div key={product.id} className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span><Image src={product.imageUrl} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{product.name}</p><p className="mt-0.5 text-xs text-slate-500">{carts} cart · {saves} saved</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">{score} pts</span></div>)}</div></section>
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <DataPanel title="Inventory coverage" detail="Relative stock position across your catalog">
        <div className="space-y-5 p-5">{products.slice(0, 6).map((product) => <div key={product.id}><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="truncate font-medium text-slate-700">{product.name}</span><span className={product.stock < 10 ? "font-bold text-orange-600" : "text-slate-500"}>{product.stock} units</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${product.stock < 10 ? "bg-[#ef8354]" : "bg-emerald-500"}`} style={{ width: `${Math.max(5, product.stock / maxStock * 100)}%` }} /></div></div>)}</div>
      </DataPanel>
      <div className="rounded-2xl bg-gradient-to-br from-[#172033] to-[#243655] p-6 text-white shadow-xl shadow-slate-900/15"><span className="grid size-11 place-items-center rounded-2xl bg-[#ef8354] shadow-lg shadow-orange-950/30"><Sparkles size={20} /></span><h2 className="mt-6 text-xl font-bold tracking-tight">One workspace, clear decisions.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Move from a signal to the exact operational screen where you can act on it.</p><div className="mt-6 space-y-2.5"><button onClick={() => onNavigate("products")} className="flex min-h-11 w-full items-center justify-between rounded-xl bg-white px-4 text-sm font-bold text-slate-950 shadow-sm transition hover:-translate-y-0.5">Manage inventory <ArrowUpRight size={17} /></button><button onClick={() => onNavigate("users")} className="flex min-h-11 w-full items-center justify-between rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/10">Review customers <ArrowUpRight size={17} /></button></div></div>
    </div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><BrainCircuit size={19} /></span><div><h2 className="font-bold tracking-tight text-slate-900">AI Store Insights</h2><p className="mt-1 text-xs font-medium text-slate-500">Recommendations generated from inventory, carts, and wishlist activity.</p></div></div><span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"><Sparkles size={13} />Live analysis</span></div>
      <div className="grid divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0">{insights.map((insight) => <InsightCard key={insight.id} insight={insight} />)}</div>
    </section>
  </div>;
}

function InsightCard({ insight }: { insight: StoreInsight }) {
  const styles = {
    orange: "bg-orange-50 text-orange-700",
    rose: "bg-rose-50 text-rose-700",
    sky: "bg-sky-50 text-sky-700",
    emerald: "bg-emerald-50 text-emerald-700"
  };
  const Icon = insight.id === "inventory" ? Boxes : insight.id === "demand" ? TrendingUp : Lightbulb;
  return <article className="p-5"><span className={`grid size-9 place-items-center rounded-xl ${styles[insight.tone]}`}><Icon size={17} /></span><h3 className="mt-4 text-sm font-bold leading-5 text-slate-900">{insight.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{insight.description}</p></article>;
}

function CategoryProducts({ category, products, onClose }: { category: Category | null; products: Product[]; onClose: () => void }) {
  if (!category) return null;
  return <Editor title={category.name} subtitle={`${products.length} product${products.length === 1 ? "" : "s"} in this category`} onClose={onClose}>
    {products.length ? <div className="grid gap-3 sm:grid-cols-2">{products.map((product) => <Link key={product.id} href={`/products/${product.slug}`} target="_blank" className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:shadow-sm"><Image src={product.imageUrl} alt="" width={56} height={56} className="size-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{product.name}</p><p className="mt-1 text-xs text-slate-500">${product.price.toFixed(2)} · {product.stock} in stock</p><p className="mt-2 text-xs font-bold text-emerald-700">Open product →</p></div></Link>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center"><p className="font-bold text-slate-800">No products in this category yet.</p><p className="mt-2 text-sm text-slate-500">Add products from the Products workspace to see them here.</p></div>}
  </Editor>;
}

function CommerceCount({ icon: Icon, value }: { icon: typeof ShoppingCart; value: number }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"><Icon size={13} className="text-slate-500" />{value}</span>;
}

function UserEditor({ user, commerce, currentUserId, draft, busy, onDraftChange, onClose, onSubmit }: { user: User | null; commerce?: UserCommerce; currentUserId: string; draft: UserDraft; busy: boolean; onDraftChange: (draft: UserDraft) => void; onClose: () => void; onSubmit: (event: React.FormEvent) => void }) {
  if (!user) return null;
  const cart = commerce?.cart ?? [];
  const wishlist = commerce?.wishlist ?? [];
  const subtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  return <Editor title="Customer details" subtitle="Review account access and the products connected to this customer." onClose={onClose}>
    <form onSubmit={onSubmit} className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name"><input required minLength={2} className={inputClass} value={draft.name} onChange={(event) => onDraftChange({ ...draft, name: event.target.value })} /></Field>
        <Field label="Email address"><input required type="email" className={inputClass} value={draft.email} onChange={(event) => onDraftChange({ ...draft, email: event.target.value })} /></Field>
        <Field label="Access level"><select value={draft.role} disabled={user.id === currentUserId} className={inputClass} onChange={(event) => onDraftChange({ ...draft, role: event.target.value as UserRole })}><option value="customer">Customer</option><option value="admin">Administrator</option></select></Field>
        <div className="grid grid-cols-2 gap-3 pt-7"><MetricMini label="Cart items" value={cart.reduce((total, item) => total + item.quantity, 0)} icon={ShoppingCart} /><MetricMini label="Saved" value={wishlist.length} icon={Heart} /></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <CommercePanel title="Shopping cart" detail={cart.length ? `$${subtotal.toFixed(2)} subtotal` : "No items in cart"} icon={ShoppingCart}>
          {cart.length ? cart.map((item) => <CommerceProduct key={item.productId} product={item.product} note={`Quantity: ${item.quantity} · $${(item.product.price * item.quantity).toFixed(2)}`} />) : <EmptyCommerce message="This customer has not added any products to their cart." />}
        </CommercePanel>
        <CommercePanel title="Wishlist" detail={wishlist.length ? `${wishlist.length} saved product${wishlist.length === 1 ? "" : "s"}` : "No saved products"} icon={Heart}>
          {wishlist.length ? wishlist.map((item) => <CommerceProduct key={item.productId} product={item.product} note={`$${item.product.price.toFixed(2)} · ${item.product.categoryName}`} />) : <EmptyCommerce message="This customer has not saved any products yet." />}
        </CommercePanel>
      </div>
      <FormActions busy={busy} onCancel={onClose} />
    </form>
  </Editor>;
}

function MetricMini({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ShoppingCart }) { return <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"><div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Icon size={13} />{label}</div><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>; }
function CommercePanel({ title, detail, icon: Icon, children }: { title: string; detail: string; icon: typeof ShoppingCart; children: React.ReactNode }) { return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3"><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><Icon size={16} /></span><div><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="text-xs text-slate-500">{detail}</p></div></div><div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">{children}</div></section>; }
function CommerceProduct({ product, note }: { product: Product; note: string }) { return <div className="flex items-center gap-3 px-4 py-3"><Image src={product.imageUrl} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{product.name}</p><p className="truncate text-xs text-slate-500">{note}</p></div></div>; }
function EmptyCommerce({ message }: { message: string }) { return <p className="px-4 py-8 text-center text-sm leading-6 text-slate-500">{message}</p>; }

function PrimaryButton({ onClick, icon: Icon, children }: { onClick: () => void; icon: typeof Plus; children: React.ReactNode }) { return <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-xl"><Icon size={18} />{children}</button>; }
function DataPanel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-2xl border border-white bg-white/90 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="font-bold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-xs font-medium text-slate-400">{detail}</p></div></div>{children}</section>; }
function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr>{headers.map((header) => <th key={header} className="px-5 py-3.5 font-bold">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function StockBadge({ stock }: { stock: number }) { const style = stock === 0 ? "bg-red-50 text-red-700" : stock < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{stock === 0 ? "Out of stock" : `${stock} in stock`}</span>; }
function UserPresence({ lastActiveAt }: { lastActiveAt?: string }) {
  const elapsed = lastActiveAt ? Date.now() - Date.parse(lastActiveAt) : Number.POSITIVE_INFINITY;
  if (Number.isFinite(elapsed) && elapsed < 2 * 60_000) return <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />Online now</span>;
  if (Number.isFinite(elapsed) && elapsed < 60 * 60_000) return <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700"><span className="size-2 rounded-full bg-amber-500" />Active recently</span>;
  return <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><span className="size-2 rounded-full bg-slate-300" />Offline</span>;
}
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <div className="flex justify-end gap-1"><button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className="grid size-9 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><Pencil size={17} /></button><button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className="grid size-9 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div>; }
function Editor({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={title}><div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-[#f8fafc] shadow-2xl shadow-slate-950/30"><div className="flex items-start justify-between border-b border-slate-200 bg-white px-7 py-6"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Catalog editor</p><h2 className="text-2xl font-bold tracking-tight">{title}</h2><p className="mt-1.5 text-sm text-slate-500">{subtitle}</p></div><button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={19} /></button></div><div className="p-7">{children}</div></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>{children}</label>; }
function FormActions({ busy, onCancel }: { busy: boolean; onCancel: () => void }) { return <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 sm:col-span-2"><button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancel</button><button disabled={busy} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-50">{busy ? "Saving..." : "Save changes"}</button></div>; }
