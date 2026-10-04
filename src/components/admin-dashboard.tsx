"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Activity,
  Boxes,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  Heart,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tags,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  Users,
  WandSparkles,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Category, Product, User, UserCommerceData, UserRole } from "@/types";
import type { AdminAuditReport } from "@/lib/services/admin-audit-service";
import { CloudinaryImageField } from "@/components/cloudinary-image-field";
import { CampaignStudio } from "@/components/campaign-studio";
import { AuditVisualBrief } from "@/components/audit-visual-brief";

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
function paginateAdmin<T>(items: T[], page: number, pageSize = 8) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: currentPage, pageCount, from: items.length ? start + 1 : 0, to: Math.min(start + pageSize, items.length) };
}

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
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState<"all" | "available" | "low" | "out">("all");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | UserRole>("all");
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
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
  const [aiReady, setAiReady] = useState(false);
  const productGeneration = useRef(0);
  const [audit, setAudit] = useState<AdminAuditReport | null>(null);
  const [auditBusy, setAuditBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const inventoryValue = useMemo(() => products.reduce((sum, product) => sum + product.price * product.stock, 0), [products]);
  const totalStock = useMemo(() => products.reduce((sum, product) => sum + product.stock, 0), [products]);
  const cartItemCount = useMemo(() => userCommerce.reduce((total, commerce) => total + commerce.cart.reduce((count, item) => count + item.quantity, 0), 0), [userCommerce]);
  const wishlistItemCount = useMemo(() => userCommerce.reduce((total, commerce) => total + commerce.wishlist.length, 0), [userCommerce]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleProducts = products.filter((product) => (!normalizedQuery || `${product.name} ${product.categoryName} ${product.slug}`.toLowerCase().includes(normalizedQuery)) && (productCategoryFilter === "all" || product.categoryId === productCategoryFilter) && (productStockFilter === "all" || productStockFilter === "available" && product.stock > 0 || productStockFilter === "low" && product.stock > 0 && product.stock < 10 || productStockFilter === "out" && product.stock === 0));
  const visibleCategories = categories.filter((category) => !normalizedQuery || `${category.name} ${category.description}`.toLowerCase().includes(normalizedQuery));
  const visibleUsers = users.filter((user) => (!normalizedQuery || `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(normalizedQuery)) && (userRoleFilter === "all" || user.role === userRoleFilter));
  const pagedProducts = paginateAdmin(visibleProducts, productPage);
  const pagedCategories = paginateAdmin(visibleCategories, categoryPage, 6);
  const pagedUsers = paginateAdmin(visibleUsers, userPage);

  function selectSection(value: Section) { setSection(value); setQuery(""); setProductPage(1); setCategoryPage(1); setUserPage(1); setMessage(null); }
  function report(error: unknown) { setMessage(error instanceof Error ? error.message : "The operation failed"); }
  function openProduct(product?: Product) {
    productGeneration.current += 1; setAiGenerating(false); setAiReady(false);
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
    const generation = ++productGeneration.current;
    setAiGenerating(true); setAiReady(false); setMessage(null);
    try {
      const suggestion = await adminRequest<AiProductSuggestion>("/api/admin/ai/product-details", { method: "POST", body: JSON.stringify({ imageUrl: sourceImage }) });
      if (generation !== productGeneration.current) return;
      if (suggestion) { setProductDraft((current) => current ? { ...current, ...suggestion, price: current.price, imageUrl: sourceImage } : current); setAiReady(true); }
    } catch (error) { if (generation === productGeneration.current) report(error); } finally { if (generation === productGeneration.current) setAiGenerating(false); }
  }
  async function runStoreAudit() {
    setAuditBusy(true); setMessage(null);
    try { setAudit(await adminRequest<AdminAuditReport>("/api/admin/ai/store-audit", { method: "POST" })); }
    catch (error) { report(error); } finally { setAuditBusy(false); }
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
      <aside className="flex flex-col bg-[#111827] text-white shadow-2xl shadow-slate-950/20 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex min-w-0 items-center gap-3 px-5 py-4 sm:px-6 sm:py-6">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#ff9b6d] to-[#e95d36] text-white shadow-lg shadow-orange-950/25"><ShoppingBag size={21} /></span>
          <div><p className="font-bold tracking-tight">CommerceCraft</p><p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Merchant workspace</p></div>
        </div>
        <nav className="flex w-full min-w-0 snap-x gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:flex-1 lg:flex-col lg:overflow-visible lg:py-6" aria-label="Admin navigation">
          <p className="hidden px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 lg:block">Workspace</p>
          {nav.map(({ id, label, icon: Icon, count }) => (
            <button key={id} type="button" onClick={() => selectSection(id)} className={`flex min-h-12 shrink-0 snap-start items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition lg:w-full ${section === id ? "bg-white text-slate-950 shadow-lg shadow-black/10" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={18} /><span>{label}</span>{count !== undefined ? <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${section === id ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-400"}`}>{count}</span> : null}
            </button>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500 text-xs font-bold shadow-lg shadow-emerald-950/30">{currentUser.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{currentUser.name}</p><p className="text-[11px] text-slate-400">Administrator</p></div></div>
          <div className="flex shrink-0 items-center gap-1"><Link href="/" className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white" title="View storefront" aria-label="View storefront"><ExternalLink size={17} /></Link><button type="button" onClick={logout} className="grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white" title="Log out" aria-label="Log out"><LogOut size={17} /></button></div>
        </div>
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
        {section !== "overview" && section !== "campaigns" ? <header className="flex min-h-[78px] items-center justify-between border-b border-white/80 bg-white/80 px-4 backdrop-blur-xl sm:px-8">
          <div className="hidden items-center gap-2 text-sm font-semibold text-slate-500 sm:flex"><span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><SlidersHorizontal size={17} /></span>Recherche et filtres intelligents</div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex"><span className="mr-2 mt-1 size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,.12)]" />Store online</span>
            <Link href="/" className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md" title="Open storefront" aria-label="Open storefront"><ArrowUpRight size={18} /></Link>
          </div>
        </header> : null}

        <main className="mx-auto max-w-[1500px] p-4 sm:p-8 lg:p-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">{section === "overview" ? `Welcome back, ${currentUser.name.split(" ")[0]}` : "Catalog management"}</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{section === "overview" ? "Store command center" : nav.find((item) => item.id === section)?.label}</h1>
            </div>
            {section === "overview" || section === "campaigns" ? (
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100 sm:inline-flex"><span className="mr-2 mt-1 size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(34,197,94,.12)]" />Store online</span>
            <Link href="/" className="grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md" title="Open storefront" aria-label="Open storefront"><ArrowUpRight size={18} /></Link>
          </div>
            ) : null}
            {section === "products" ? <PrimaryButton onClick={() => openProduct()} icon={PackagePlus}>Create from photo</PrimaryButton> : null}
            {section === "categories" ? <PrimaryButton onClick={() => openCategory()} icon={Plus}>Add category</PrimaryButton> : null}
          </div>

          {message ? <div role="alert" className="mb-5 flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"><span>{message}</span><button onClick={() => setMessage(null)} aria-label="Dismiss"><X size={17} /></button></div> : null}

          {section === "overview" ? <Overview products={products} categories={categories} users={users} userCommerce={userCommerce} inventoryValue={inventoryValue} totalStock={totalStock} cartItemCount={cartItemCount} wishlistItemCount={wishlistItemCount} audit={audit} auditBusy={auditBusy} onAudit={runStoreAudit} onNavigate={selectSection} /> : null}

          {section === "campaigns" ? <CampaignStudio products={products} categories={categories} /> : null}

          {section === "products" ? (
            <div className="space-y-4"><ExplorerBar title="Explore catalog" description="Find a product and focus on the inventory that needs attention." count={`${visibleProducts.length} product${visibleProducts.length > 1 ? "s" : ""}`} query={query} placeholder="Product name, category, or URL slug…" onQueryChange={(value) => { setQuery(value); setProductPage(1); }} onReset={() => { setQuery(""); setProductCategoryFilter("all"); setProductStockFilter("all"); setProductPage(1); }} active={Boolean(query || productCategoryFilter !== "all" || productStockFilter !== "all")}><FilterSelect label="Collection" value={productCategoryFilter} onChange={(value) => { setProductCategoryFilter(value); setProductPage(1); }}><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</FilterSelect><FilterSelect label="Availability" value={productStockFilter} onChange={(value) => { setProductStockFilter(value as typeof productStockFilter); setProductPage(1); }}><option value="all">All inventory</option><option value="available">Available</option><option value="low">Low stock</option><option value="out">Out of stock</option></FilterSelect></ExplorerBar><DataPanel title="Product inventory" detail={`${pagedProducts.from}–${pagedProducts.to} of ${visibleProducts.length} product${visibleProducts.length > 1 ? "s" : ""}`}>
              <AdminTable headers={["Product", "Category", "Price", "Inventory", "Rating", ""]}>
                {pagedProducts.items.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100 transition hover:bg-slate-50/70">
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><Image src={product.imageUrl} alt="" width={52} height={52} className="size-13 rounded-md object-cover" /><div><p className="font-semibold text-slate-900">{product.name}</p><p className="mt-0.5 text-xs text-slate-400">{product.slug}</p></div></div></td>
                    <td className="px-5 py-3 text-sm text-slate-600">{product.categoryName}</td><td className="px-5 py-3 text-sm font-semibold">${product.price.toFixed(2)}</td>
                    <td className="px-5 py-3"><StockBadge stock={product.stock} /></td><td className="px-5 py-3 text-sm font-medium">{product.rating.toFixed(1)} <span className="text-amber-500">★</span></td>
                    <td className="px-5 py-3"><RowActions onEdit={() => openProduct(product)} onDelete={() => removeProduct(product)} /></td>
                  </tr>
                ))}
              </AdminTable>
              <AdminPagination {...pagedProducts} onPageChange={setProductPage} /></DataPanel></div>
          ) : null}

          {section === "categories" ? (
            <div className="space-y-4"><ExplorerBar title="Explore collections" description="Find a category, review its products, and keep it growing." count={`${visibleCategories.length} categor${visibleCategories.length > 1 ? "ies" : "y"}`} query={query} placeholder="Category name or description…" onQueryChange={(value) => { setQuery(value); setCategoryPage(1); }} onReset={() => { setQuery(""); setCategoryPage(1); }} active={Boolean(query)}><span className="inline-flex min-h-11 items-center rounded-xl bg-white/70 px-3 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">{products.length} products organized</span></ExplorerBar><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pagedCategories.items.map((category) => {
                const count = products.filter((product) => product.categoryId === category.id).length;
                return <article key={category.id} role="button" tabIndex={0} onClick={() => setCategoryProductsId(category.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCategoryProductsId(category.id); } }} className="group cursor-pointer overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
                  <div className="relative aspect-[16/8] overflow-hidden"><Image src={category.imageUrl} alt={category.name} fill className="object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" /><span className="absolute bottom-3 left-4 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800 backdrop-blur">{count} products</span></div>
                  <div className="flex items-start justify-between gap-4 p-5"><div><h2 className="text-lg font-bold">{category.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{category.description}</p><p className="mt-4 text-xs font-bold text-emerald-700">View {count} product{count === 1 ? "" : "s"} →</p></div><div onClick={(event) => event.stopPropagation()}><RowActions onEdit={() => openCategory(category)} onDelete={() => removeCategory(category)} /></div></div>
                </article>;
              })}</div><AdminPagination {...pagedCategories} onPageChange={setCategoryPage} /></div>
          ) : null}

          {section === "users" ? (
            <div className="space-y-4"><ExplorerBar title="Explore customers" description="Find an account, its activity, and access information." count={`${visibleUsers.length} account${visibleUsers.length > 1 ? "s" : ""}`} query={query} placeholder="Name, email, or role…" onQueryChange={(value) => { setQuery(value); setUserPage(1); }} onReset={() => { setQuery(""); setUserRoleFilter("all"); setUserPage(1); }} active={Boolean(query || userRoleFilter !== "all")}><FilterSelect label="Role" value={userRoleFilter} onChange={(value) => { setUserRoleFilter(value as typeof userRoleFilter); setUserPage(1); }}><option value="all">All roles</option><option value="customer">Customers</option><option value="admin">Administrators</option></FilterSelect></ExplorerBar><DataPanel title="Customer directory" detail={`${pagedUsers.from}–${pagedUsers.to} of ${visibleUsers.length} account${visibleUsers.length > 1 ? "s" : ""}`}>
              <AdminTable headers={["Customer", "Joined", "Cart", "Saved", "Access", "Status", ""]}>
                {pagedUsers.items.map((user) => <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid size-10 place-items-center rounded-md text-sm font-bold ${user.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{user.name.slice(0, 2).toUpperCase()}</span><div><p className="font-semibold">{user.name}</p><PrivateEmail email={user.email} /></div></div></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(user.createdAt))}</td>
                  <td className="px-5 py-4"><CommerceCount icon={ShoppingCart} value={userCommerce.find((item) => item.userId === user.id)?.cart.reduce((total, item) => total + item.quantity, 0) ?? 0} /></td>
                  <td className="px-5 py-4"><CommerceCount icon={Heart} value={userCommerce.find((item) => item.userId === user.id)?.wishlist.length ?? 0} /></td>
                  <td className="px-5 py-4"><select value={user.role} disabled={user.id === currentUser.id} onChange={(event) => changeRole(user, event.target.value as UserRole)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-emerald-600 disabled:bg-slate-50 disabled:text-slate-400"><option value="customer">Customer</option><option value="admin">Administrator</option></select></td>
                  <td className="px-5 py-4"><UserPresence lastActiveAt={user.lastActiveAt} /></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" onClick={() => openUser(user)} className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50">View</button><button type="button" disabled={user.id === currentUser.id} onClick={() => removeUser(user)} className="grid size-9 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-20" title="Delete account" aria-label={`Delete ${user.name}`}><Trash2 size={17} /></button></div></td>
                </tr>)}
              </AdminTable>
              <AdminPagination {...pagedUsers} onPageChange={setUserPage} /></DataPanel></div>
          ) : null}
        </main>
      </div>

      {productDraft ? (
        <Editor wide title={productId ? productDraft.name || "Edit product" : "Create a product"} subtitle={productId ? "Update the product details, inventory, and AI suggestions in one place." : "Upload a photo, let AI propose the product details, then refine them."} onClose={() => { productGeneration.current += 1; setProductDraft(null); setAiGenerating(false); }}>
          <form onSubmit={saveProduct} className="grid items-start gap-4 md:grid-cols-[.7fr_1.3fr]">
            <fieldset disabled={aiGenerating || busy} className="min-w-0 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">01 · Your photo</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight">It starts with an image</h3>
              <p className="mb-3 mt-1 text-xs leading-5 text-slate-500">AI suggests the name, category, description, and tags.</p>
              <CloudinaryImageField largePreview inputClassName={inputClass} value={productDraft.imageUrl} onChange={(imageUrl) => { setAiReady(false); setProductDraft((current) => current ? { ...current, imageUrl } : current); }} onUploaded={(imageUrl) => void generateProductDetails(imageUrl)} />
              <button type="button" disabled={!productDraft.imageUrl || aiGenerating} onClick={() => void generateProductDetails()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-50"><WandSparkles size={18} className={aiGenerating ? "animate-pulse" : ""} />{aiGenerating ? "AI is analyzing your product…" : aiReady ? "Generate details again with AI" : "Turn photo into product details"}</button>
            </fieldset>
            <fieldset disabled={aiGenerating || busy} className="min-w-0 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-600">02 · Your listing</p><p className="mt-1 text-xs leading-5 text-slate-500">{aiReady ? "Review the AI suggestion, then confirm price and stock." : "Every field stays editable. Add price and inventory before saving."}</p>{aiGenerating ? <div role="status" className="mt-3 space-y-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-700"><span className="inline-flex items-center gap-2"><Sparkles size={16} className="animate-pulse" />Analyzing the image and drafting details…</span><div className="h-2 animate-pulse rounded-full bg-violet-200" /></div> : null}{message ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{message}</p> : null}</div>
            <Field label="Product name"><input required className={inputClass} value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} /></Field>
            <Field label="Product URL slug"><input required className={inputClass} value={productDraft.slug} onChange={(e) => setProductDraft({ ...productDraft, slug: e.target.value })} /></Field>
            <Field label="Category"><select required className={inputClass} value={productDraft.categoryId} onChange={(e) => setProductDraft({ ...productDraft, categoryId: e.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
            <Field label="Price"><input required type="number" min="0" step="0.01" className={inputClass} value={editableNumber(productDraft.price)} onChange={(e) => setProductDraft({ ...productDraft, price: parseEditableNumber(e.target.value) })} /></Field>
            <Field label="Stock"><input required type="number" min="0" className={inputClass} value={productDraft.stock} onChange={(e) => setProductDraft({ ...productDraft, stock: parseEditableNumber(e.target.value) })} /></Field>
            <Field label="Rating"><input required type="number" min="0" max="5" step="0.1" className={inputClass} value={editableNumber(productDraft.rating)} onChange={(e) => setProductDraft({ ...productDraft, rating: parseEditableNumber(e.target.value) })} /></Field>
            <Field label="Tags"><input className={inputClass} value={productDraft.tags.join(", ")} onChange={(e) => setProductDraft({ ...productDraft, tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /></Field>
            <div className="sm:col-span-2"><Field label="Description"><textarea required minLength={10} rows={4} className={`${inputClass} py-3`} value={productDraft.description} onChange={(e) => setProductDraft({ ...productDraft, description: e.target.value })} /></Field></div>
            {productDraft.tags.length ? <div className="flex flex-wrap gap-2 sm:col-span-2">{productDraft.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">#{tag}</span>)}</div> : null}
            <FormActions busy={busy || aiGenerating} onCancel={() => { productGeneration.current += 1; setProductDraft(null); setAiGenerating(false); }} />
            </fieldset>
          </form>
        </Editor>
      ) : null}
      {categoryDraft ? <Editor title={categoryId ? "Edit category" : "Add a category"} subtitle="Organize the catalog into clear storefront collections." onClose={() => setCategoryDraft(null)}><form onSubmit={saveCategory} className="grid gap-4"><Field label="Category name"><input required className={inputClass} value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value, slug: categoryId ? categoryDraft.slug : toSlug(e.target.value) })} /></Field><Field label="URL slug"><input required className={inputClass} value={categoryDraft.slug} onChange={(e) => setCategoryDraft({ ...categoryDraft, slug: toSlug(e.target.value) })} /><p className="mt-1 text-xs text-slate-500">Created automatically from the category name. You can edit it.</p></Field><Field label="Cover image"><CloudinaryImageField inputClassName={inputClass} value={categoryDraft.imageUrl} onChange={(imageUrl) => setCategoryDraft({ ...categoryDraft, imageUrl })} /></Field><Field label="Description"><textarea required minLength={5} rows={4} className={`${inputClass} py-3`} value={categoryDraft.description} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} /></Field><FormActions busy={busy} onCancel={() => setCategoryDraft(null)} /></form></Editor> : null}
      {categoryProductsId ? <CategoryProducts category={categories.find((category) => category.id === categoryProductsId) ?? null} products={products.filter((product) => product.categoryId === categoryProductsId)} onDelete={removeProduct} onClose={() => setCategoryProductsId(null)} /> : null}
      {userDraft && userId ? <UserEditor user={users.find((user) => user.id === userId) ?? null} commerce={userCommerce.find((item) => item.userId === userId)} currentUserId={currentUser.id} draft={userDraft} busy={busy} onDraftChange={setUserDraft} onClose={() => { setUserDraft(null); setUserId(null); }} onSubmit={saveUser} /> : null}
    </div>
  );
}

function Overview({ products, categories, users, userCommerce, inventoryValue, totalStock, cartItemCount, wishlistItemCount, audit, auditBusy, onAudit, onNavigate }: { products: Product[]; categories: Category[]; users: User[]; userCommerce: UserCommerce[]; inventoryValue: number; totalStock: number; cartItemCount: number; wishlistItemCount: number; audit: AdminAuditReport | null; auditBusy: boolean; onAudit: () => void; onNavigate: (section: Section) => void }) {
  const lowStock = products.filter((item) => item.stock < 10);
  const availableProducts = products.filter((item) => item.stock > 0).length;
  const healthScore = products.length ? Math.round((availableProducts / products.length) * 65 + (lowStock.length === 0 ? 35 : Math.max(5, 35 - lowStock.length * 8))) : 0;
  const intentScore = Math.min(100, cartItemCount * 12 + wishlistItemCount * 6);
  const campaignReadiness = Math.round((availableProducts / Math.max(products.length, 1)) * 100);
  const stats = [
    { label: "Catalog health", value: `${healthScore}%`, note: `${lowStock.length} product${lowStock.length > 1 ? "s" : ""} need attention`, icon: Activity, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Customer intent", value: `${intentScore}%`, note: `${cartItemCount} in carts · ${wishlistItemCount} saved`, icon: Heart, tone: "bg-rose-50 text-rose-700" },
    { label: "Campaign ready", value: `${campaignReadiness}%`, note: `${availableProducts} products available`, icon: Sparkles, tone: "bg-violet-50 text-violet-700" },
    { label: "Inventory value", value: `$${integerFormatter.format(inventoryValue)}`, note: `${totalStock} units in catalog`, icon: Boxes, tone: "bg-sky-50 text-sky-700" }
  ];
  return <div className="space-y-7">
    <section className="relative overflow-hidden rounded-3xl bg-[#172033] p-6 text-white shadow-xl shadow-slate-900/15 sm:p-8">
      <div className="absolute -right-20 -top-24 size-80 rounded-full bg-emerald-400/10 blur-3xl" /><div className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_auto]"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">Store snapshot</p><h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">See where your store can grow today.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">This dashboard combines inventory, customer interest, and catalog data into clear next actions.</p><button onClick={() => onNavigate("campaigns")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ef8354] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#dd6e41]"><Sparkles size={17} />Create an AI opportunity</button></div><div className="grid grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-xl shadow-black/10"><div className="min-w-24 px-4 py-4 text-center sm:px-6"><p className="text-2xl font-bold text-white">{products.length}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-300">Products</p></div><div className="min-w-24 px-4 py-4 text-center sm:px-6"><p className="text-2xl font-bold text-white">{categories.length}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-300">Categories</p></div><div className="min-w-24 px-4 py-4 text-center sm:px-6"><p className="text-2xl font-bold text-white">{users.length}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-300">Users</p></div></div></div>
    </section>
    <section><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">Smart metrics</p><h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">Signals that matter</h2></div><p className="hidden text-xs font-medium text-slate-500 sm:block">Updated from your catalog and customer activity</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"><div className={`absolute inset-x-0 top-0 h-1 ${tone.split(" ")[0]}`} /><span className={`grid size-11 place-items-center rounded-2xl ${tone}`}><Icon size={20} /></span><p className="mt-6 text-sm font-semibold text-slate-500">{label}</p><p className="mt-1.5 text-3xl font-bold tracking-tight">{value}</p><p className="mt-2 text-xs font-medium text-slate-400">{note}</p></article>)}</div></section>
    <StoreAuditor report={audit} products={products} userCommerce={userCommerce} busy={auditBusy} onAudit={onAudit} onNavigate={onNavigate} />
  </div>;
}

function CategoryProducts({ category, products, onDelete, onClose }: { category: Category | null; products: Product[]; onDelete: (product: Product) => Promise<void>; onClose: () => void }) {
  if (!category) return null;
  return <Editor title={category.name} subtitle={`${products.length} product${products.length === 1 ? "" : "s"} in this category`} onClose={onClose}>
    {products.length ? <div className="grid gap-3 sm:grid-cols-2">{products.map((product) => <div key={product.id} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:shadow-sm"><Link href={`/products/${product.slug}`} target="_blank" className="flex min-w-0 flex-1 items-center gap-3"><Image src={product.imageUrl} alt="" width={56} height={56} className="size-14 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{product.name}</p><p className="mt-1 text-xs text-slate-500">${product.price.toFixed(2)} · {product.stock} in stock</p><p className="mt-2 text-xs font-bold text-emerald-700">Open product →</p></div></Link><button type="button" onClick={() => void onDelete(product)} title={`Delete ${product.name}`} aria-label={`Delete ${product.name}`} className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center"><p className="font-bold text-slate-800">No products in this category yet.</p><p className="mt-2 text-sm text-slate-500">Add products from the Products workspace to see them here.</p></div>}
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
function StoreAuditor({ report, products, userCommerce, busy, onAudit, onNavigate }: { report: AdminAuditReport | null; products: Product[]; userCommerce: UserCommerce[]; busy: boolean; onAudit: () => void; onNavigate: (section: Section) => void }) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  async function downloadReport() {
    if (!report) return;
    setExporting(true); setExportError(null);
    try {
      const { createAuditPdf } = await import("@/lib/audit-pdf");
      createAuditPdf(report, products, userCommerce).save("commercecraft-diagnostic.pdf");
    } catch { setExportError("Le PDF n'a pas pu etre genere. Reessayez."); }
    finally { setExporting(false); }
  }
  return <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-violet-100 bg-[linear-gradient(110deg,#f7f2ff,#ffffff_62%)] px-6 py-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-900/20"><BrainCircuit size={21} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-violet-700">Admin assistant</p><h2 className="mt-0.5 font-bold tracking-tight text-slate-900">AI Store Auditor</h2><p className="mt-1 text-xs font-medium text-slate-500">It detects catalog issues and opportunities worth acting on.</p></div></div><button type="button" disabled={busy} onClick={onAudit} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white shadow-lg shadow-violet-900/15 transition hover:-translate-y-0.5 hover:bg-violet-800 disabled:cursor-wait disabled:opacity-60"><Sparkles size={16} />{busy ? "Analyzing…" : report ? "Run audit again" : "Analyze my store"}</button></div>
    {report ? <div className="p-5"><div className="mb-5 flex flex-wrap items-center justify-end gap-3"><button type="button" disabled={busy || exporting} onClick={() => void downloadReport()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-bold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"><Download size={17} />{exporting ? "Preparing PDF…" : "Download PDF report"}</button></div>{exportError ? <p role="alert" className="mb-4 text-sm text-rose-600">{exportError}</p> : null}<AuditVisualBrief narrative={report.narrative} products={products} userCommerce={userCommerce} onProducts={() => onNavigate("products")} onCampaign={() => onNavigate("campaigns")} /><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={() => onNavigate("products")} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200">View products →</button><button type="button" onClick={() => onNavigate("categories")} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200">View categories →</button><button type="button" onClick={() => onNavigate("campaigns")} className="rounded-lg bg-violet-100 px-3 py-2 text-xs font-bold text-violet-800 transition hover:bg-violet-200">Create campaign →</button></div><p className="mt-4 text-right text-[11px] font-medium text-slate-400">Analysis generated by {report.source === "anthropic" ? "Claude AI" : "Groq AI"} from anonymized data</p></div> : <div className="flex items-center gap-4 px-6 py-6 text-sm text-slate-600"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><TrendingUp size={18} /></span><p>Click once: AI checks descriptions, inventory, categories, and interest signals without exposing customer personal data.</p></div>}
  </section>;
}

function DataPanel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) { return <section className="overflow-hidden rounded-2xl border border-white bg-white/90 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6 sm:py-5"><div className="min-w-0"><h2 className="font-bold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-xs font-medium text-slate-400">{detail}</p></div></div>{children}</section>; }
function ExplorerBar({ title, description, count, query, placeholder, onQueryChange, onReset, active, children }: { title: string; description: string; count: string; query: string; placeholder: string; onQueryChange: (value: string) => void; onReset: () => void; active: boolean; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]"><div className="flex flex-wrap items-center justify-between gap-4 px-5 pb-4 pt-5 sm:px-6"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><SlidersHorizontal size={18} /></span><div className="min-w-0"><h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2><p className="mt-0.5 truncate text-xs text-slate-500">{description}</p></div></div><span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{count}</span></div><div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 sm:px-6"><label className="relative min-w-[220px] flex-1"><span className="sr-only">Search</span><Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" /></label><div className="flex flex-wrap items-center gap-2"><span className="hidden text-[10px] font-bold uppercase tracking-[.14em] text-slate-400 xl:inline">Filters</span>{children}{active ? <button type="button" onClick={onReset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"><RotateCcw size={14} />Reset</button> : null}</div></div></section>;
}
function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <label className="relative"><span className="sr-only">{label}</span><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400" size={14} /><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:border-emerald-300 hover:bg-emerald-50/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10">{children}</select><ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-slate-500" size={15} /></label>; }
function AdminPagination({ page, pageCount, from, to, onPageChange }: { page: number; pageCount: number; from: number; to: number; onPageChange: (page: number) => void }) {
  const scrollPosition = useRef<{ x: number; y: number } | null>(null);
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  function rememberScrollPosition() { scrollPosition.current = { x: window.scrollX, y: window.scrollY }; }
  function changePage(nextPage: number) {
    const position = scrollPosition.current ?? { x: window.scrollX, y: window.scrollY };
    onPageChange(nextPage);
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(position.x, position.y)));
  }
  return <nav aria-label="Pagination" onPointerDownCapture={rememberScrollPosition} onKeyDownCapture={rememberScrollPosition} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3.5"><p className="text-xs font-medium text-slate-500"><span className="font-bold text-slate-700">{from}–{to}</span> of results</p><div className="flex items-center gap-1.5"><button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => changePage(page - 1)} className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={17} /></button>{pages.map(number => <button key={number} type="button" onClick={() => changePage(number)} aria-label={`Page ${number}`} aria-current={number === page ? "page" : undefined} className={`grid size-9 place-items-center rounded-xl text-xs font-bold transition ${number === page ? "bg-emerald-700 text-white shadow-md shadow-emerald-900/20" : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-emerald-300 hover:text-emerald-700"}`}>{number}</button>)}<button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => changePage(page + 1)} className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={17} /></button></div></nav>;
}
function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) { return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-[0.12em] text-slate-400"><tr>{headers.map((header) => <th key={header} className="px-5 py-3.5 font-bold">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function StockBadge({ stock }: { stock: number }) { const style = stock === 0 ? "bg-red-50 text-red-700" : stock < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{stock === 0 ? "Out of stock" : `${stock} in stock`}</span>; }
function UserPresence({ lastActiveAt }: { lastActiveAt?: string }) {
  const elapsed = lastActiveAt ? Date.now() - Date.parse(lastActiveAt) : Number.POSITIVE_INFINITY;
  if (Number.isFinite(elapsed) && elapsed < 2 * 60_000) return <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"><span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />Online now</span>;
  if (Number.isFinite(elapsed) && elapsed < 60 * 60_000) return <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700"><span className="size-2 rounded-full bg-amber-500" />Active recently</span>;
  return <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><span className="size-2 rounded-full bg-slate-300" />Offline</span>;
}
function PrivateEmail({ email }: { email: string }) {
  const [visible, setVisible] = useState(false);
  return <button type="button" onClick={() => setVisible((current) => !current)} aria-pressed={visible} aria-label={visible ? "Hide email address" : "Reveal email address"} title={visible ? "Hide email address" : "Reveal email address"} className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded px-1 -ml-1 text-left text-xs text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"><span className={`truncate transition duration-200 ${visible ? "blur-0" : "select-none blur-[5px]"}`}>{email}</span>{visible ? <EyeOff className="shrink-0" size={13} /> : <Eye className="shrink-0" size={13} />}</button>;
}
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <div className="flex justify-end gap-1"><button type="button" title="Edit" aria-label="Edit" onClick={onEdit} className="grid size-9 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><Pencil size={17} /></button><button type="button" title="Delete" aria-label="Delete" onClick={onDelete} className="grid size-9 place-items-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button></div>; }
function Editor({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-3 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true" aria-label={title}><div className={`flex max-h-[calc(100dvh-1.5rem)] w-full ${wide ? "max-w-5xl" : "max-w-xl"} flex-col overflow-hidden rounded-2xl bg-[#f8fafc] shadow-2xl shadow-slate-950/30 sm:max-h-[calc(100dvh-2.5rem)]`}><div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-white px-4 py-3"><div className="min-w-0 pr-2"><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Catalog editor</p><h2 className="truncate text-lg font-bold tracking-tight" title={title}>{title}</h2><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{subtitle}</p></div><button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={18} /></button></div><div className="overflow-y-auto p-3 sm:p-4">{children}</div></div></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>{children}</label>; }
function FormActions({ busy, onCancel }: { busy: boolean; onCancel: () => void }) { return <div className="flex justify-end gap-3 border-t border-slate-200 pt-6 sm:col-span-2"><button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancel</button><button disabled={busy} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-50">{busy ? "Saving..." : "Save changes"}</button></div>; }
