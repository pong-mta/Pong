import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
    ArrowLeft,
    MapPin,
    Phone,
    UserRound,
    Store as StoreIcon,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Power,
    Search,
    Package,
    Folder,
} from 'lucide-react';

type StoreOwner = {
    id: number;
    name: string;
    phone: string | null;
    created_at?: string;
};

type ProductVariant = {
    id: number;
    name?: string | null;
    title?: string | null;
    price?: number | string | null;
    sale_price?: number | string | null;
    stock?: number | string | null;
    quantity?: number | string | null;
    is_active?: boolean | number | string | null;
};

type StoreCategory = {
    id: number;
    store_id?: number;
    name: string;
    slug?: string | null;
    description?: string | null;
    image?: string | null;
    is_active?: boolean | number | string | null;
    sort_order?: number | null;
};

type StoreProduct = {
    id: number;
    store_id?: number;
    category_id?: number | null;
    name: string;
    slug?: string | null;
    description?: string | null;
    price?: number | string | null;
    sale_price?: number | string | null;
    stock?: number | string | null;
    quantity?: number | string | null;
    sku?: string | null;
    image?: string | null;
    image_url?: string | null;
    is_active?: boolean | number | null;
    created_at?: string | null;
    category?: StoreCategory | null;
    variants?: ProductVariant[];
};

type StoreRecord = {
    id: number;
    owner_id: number;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    logo: string | null;
    is_active: boolean | number;
    created_at: string;
    updated_at?: string;
    owner: StoreOwner | null;
    categories?: StoreCategory[];
    products?: StoreProduct[];
};

type Props = {
    store: StoreRecord;
};

function isEnabled(value: boolean | number | string | null | undefined): boolean {
    return value === true || value === 1 || value === '1';
}

function formatPrice(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '—';
    const amount = Number(value);
    if (Number.isNaN(amount)) return String(value);
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
}

function numericValue(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
}

/** Prefer variant prices when available; otherwise use the product's price. */
function getProductDisplayPrice(product: StoreProduct): number | null {
    const variantPrices = (product.variants ?? [])
        .map((variant) => numericValue(variant.sale_price) ?? numericValue(variant.price))
        .filter((price): price is number => price !== null);

    if (variantPrices.length > 0) return Math.min(...variantPrices);
    return numericValue(product.sale_price) ?? numericValue(product.price);
}

/** Sum per-variant stock when available, otherwise fall back to product stock. */
function getProductDisplayStock(product: StoreProduct): number | null {
    const variants = product.variants ?? [];
    const variantStockValues = variants.map(
        (variant) => numericValue(variant.stock) ?? numericValue(variant.quantity),
    );

    if (variantStockValues.some((stock) => stock !== null)) {
        return variantStockValues.reduce((total, stock) => total + (stock ?? 0), 0);
    }

    return numericValue(product.stock) ?? numericValue(product.quantity);
}

function formatDate(value?: string | null): string {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

function imageUrl(value?: string | null): string | null {
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return value;
    return `/storage/${value.replace(/^storage\//, '').replace(/^\/+/, '')}`;
}

function Detail({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: ReactNode;
}) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <div className="flex items-start gap-2 text-sm">
                {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
                <span className="break-words">{value}</span>
            </div>
        </div>
    );
}

export default function Show({ store }: Props) {
    const active = isEnabled(store.is_active);
    const products = store.products ?? [];
    const storeCategories = store.categories ?? [];
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Include categories even if they currently have no products.
    const categories = useMemo(() => {
        const names = [
            ...storeCategories.map((category) => category.name),
            ...products.map((product) => product.category?.name ?? ''),
        ].filter((name): name is string => Boolean(name));
        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    }, [storeCategories, products]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return products.filter((product) => {
            const matchesSearch =
                !query ||
                product.name.toLowerCase().includes(query) ||
                (product.description ?? '').toLowerCase().includes(query) ||
                (product.sku ?? '').toLowerCase().includes(query) ||
                (product.category?.name ?? '').toLowerCase().includes(query);
            const matchesCategory =
                categoryFilter === 'all' || product.category?.name === categoryFilter;
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && isEnabled(product.is_active)) ||
                (statusFilter === 'inactive' && !isEnabled(product.is_active));
            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, search, categoryFilter, statusFilter]);

    function toggleStatus() {
        const nextStatus = active ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${nextStatus} "${store.name}"?`)) return;
        router.patch(`/admin/stores/${store.id}/toggle-status`, {}, { preserveScroll: true });
    }

    return (
        <AppLayout>
            <Head title={`Store: ${store.name}`} />

            <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-6">
                <div>
                    <Link
                        href="/admin/stores"
                        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to All Stores
                    </Link>

                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Store Details</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Review the store profile, categories, and products for sale.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={toggleStatus}
                            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
                                active
                                    ? 'border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950'
                                    : 'bg-primary text-primary-foreground hover:opacity-90'
                            }`}
                        >
                            <Power className="h-4 w-4" />
                            {active ? 'Deactivate Store' : 'Activate Store'}
                        </button>
                    </div>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="h-2 bg-primary" />
                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                        {imageUrl(store.logo) ? (
                            <img
                                src={imageUrl(store.logo)!}
                                alt={`${store.name} logo`}
                                className="h-24 w-24 rounded-xl border object-cover"
                            />
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted">
                                <StoreIcon className="h-10 w-10 text-muted-foreground" />
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-xl font-bold">{store.name}</h2>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                    active
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                    {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                    {active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Store ID: {store.id} · Slug: {store.slug || 'Not set'}
                            </p>
                            <p className="mt-3 text-sm">{store.description || 'No store description has been provided.'}</p>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-xl border bg-card p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <StoreIcon className="h-5 w-5 text-muted-foreground" />
                            <h2 className="font-semibold">Business Information</h2>
                        </div>
                        <div className="space-y-5">
                            <Detail label="Store name" value={store.name} />
                            <Detail label="Store phone" value={store.phone || 'Not provided'} icon={<Phone className="h-4 w-4" />} />
                            <Detail label="Business address" value={store.address || 'Not provided'} icon={<MapPin className="h-4 w-4" />} />
                            <Detail label="Registered on" value={formatDate(store.created_at)} icon={<CalendarDays className="h-4 w-4" />} />
                        </div>
                    </section>

                    <section className="rounded-xl border bg-card p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                            <h2 className="font-semibold">Store Owner</h2>
                        </div>
                        {store.owner ? (
                            <div className="space-y-5">
                                <Detail label="Owner name" value={store.owner.name} icon={<UserRound className="h-4 w-4" />} />
                                <Detail label="Owner phone" value={store.owner.phone || 'Not provided'} icon={<Phone className="h-4 w-4" />} />
                                <Detail label="User ID" value={String(store.owner.id)} />
                                <Detail label="Owner account created" value={formatDate(store.owner.created_at)} icon={<CalendarDays className="h-4 w-4" />} />
                            </div>
                        ) : (
                            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                                The associated owner account could not be found.
                            </p>
                        )}
                    </section>
                </div>

                {/* Store categories: rendered independently of products. */}
                <section className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-2 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-muted-foreground" />
                            <h2 className="text-lg font-semibold">Store Categories</h2>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {storeCategories.length} categor{storeCategories.length === 1 ? 'y' : 'ies'} registered
                        </p>
                    </div>
                    {storeCategories.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                            <Folder className="mx-auto h-9 w-9 text-muted-foreground/60" />
                            <h3 className="mt-3 font-semibold">No categories found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                No categories were returned for this store. Confirm that the store has categories in the database and that the controller loads the categories relationship.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                            {storeCategories.map((category) => (
                                <div key={category.id} className="flex items-start gap-3 rounded-lg border p-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Folder className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{category.name}</p>
                                        {category.description && (
                                            <p className="mt-1 text-xs text-muted-foreground">{category.description}</p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground">Category ID: {category.id}</p>
                                    </div>
                                    {category.is_active !== undefined && (
                                        <span className={`rounded-full px-2 py-1 text-xs ${
                                            isEnabled(category.is_active)
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                : 'bg-muted text-muted-foreground'
                                        }`}>
                                            {isEnabled(category.is_active) ? 'Active' : 'Inactive'}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Products */}
                <section className="rounded-xl border bg-card">
                    <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                <h2 className="text-lg font-semibold">Products for Sale</h2>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {products.length} product{products.length === 1 ? '' : 's'} registered for this store
                                {categories.length ? ` across ${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}` : ''}.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <label className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search products..."
                                    className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm"
                                />
                            </label>
                            <select
                                value={categoryFilter}
                                onChange={(event) => setCategoryFilter(event.target.value)}
                                className="rounded-lg border bg-background px-3 py-2 text-sm"
                            >
                                <option value="all">All categories</option>
                                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="rounded-lg border bg-background px-3 py-2 text-sm"
                            >
                                <option value="all">All product statuses</option>
                                <option value="active">Active only</option>
                                <option value="inactive">Inactive only</option>
                            </select>
                        </div>
                    </div>

                    {filteredProducts.length === 0 ? (
                        <div className="px-5 py-14 text-center">
                            <Package className="mx-auto h-10 w-10 text-muted-foreground/60" />
                            <h3 className="mt-3 font-semibold">
                                {products.length ? 'No matching products' : 'No products found'}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {products.length
                                    ? 'Try changing your search or filters.'
                                    : 'This store has not added any products yet, or the backend is not loading its products.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px] text-left text-sm">
                                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Product</th>
                                        <th className="px-4 py-3 font-medium">Category</th>
                                        <th className="px-4 py-3 font-medium">Price</th>
                                        <th className="px-4 py-3 font-medium">Stock</th>
                                        <th className="px-4 py-3 font-medium">Variants</th>
                                        <th className="px-4 py-3 font-medium">Status</th>
                                        <th className="px-4 py-3 font-medium">Added</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredProducts.map((product) => {
                                        const photo = imageUrl(product.image_url || product.image);
                                        const displayPrice = getProductDisplayPrice(product);
                                        const displayStock = getProductDisplayStock(product);
                                        const variantCount = product.variants?.length ?? 0;
                                        const productActive = isEnabled(product.is_active);
                                        return (
                                            <tr key={product.id} className="align-top hover:bg-muted/30">
                                                <td className="px-5 py-4">
                                                    <div className="flex min-w-[230px] items-start gap-3">
                                                        {photo ? (
                                                            <img src={photo} alt={product.name} className="h-14 w-14 rounded-lg border object-cover" />
                                                        ) : (
                                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                                <Package className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold">{product.name}</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                ID: {product.id}{product.sku ? ` · SKU: ${product.sku}` : ''}
                                                            </p>
                                                            {product.description && (
                                                                <p className="mt-1 max-w-sm text-xs text-muted-foreground">{product.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">{product.category?.name || 'Uncategorized'}</td>
                                                <td className="whitespace-nowrap px-4 py-4 font-medium">
                                                    {formatPrice(displayPrice)}
                                                    {product.sale_price != null &&
                                                        product.price != null &&
                                                        Number(product.sale_price) < Number(product.price) &&
                                                        (product.variants?.length ?? 0) === 0 && (
                                                            <p className="mt-1 text-xs text-muted-foreground line-through">
                                                                {formatPrice(product.price)}
                                                            </p>
                                                        )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {displayStock === null ? 'Not tracked' : displayStock}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {variantCount ? (
                                                        <div className="space-y-1">
                                                            <p>{variantCount} variant{variantCount === 1 ? '' : 's'}</p>
                                                            {product.variants?.slice(0, 3).map((variant) => (
                                                                <p key={variant.id} className="text-xs text-muted-foreground">
                                                                    {variant.name || variant.title || `Variant ${variant.id}`}
                                                                    {variant.price != null ? ` · ${formatPrice(variant.price)}` : ''}
                                                                </p>
                                                            ))}
                                                            {variantCount > 3 && <p className="text-xs text-muted-foreground">+{variantCount - 3} more</p>}
                                                        </div>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        productActive
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        {productActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{formatDate(product.created_at)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="border-t px-5 py-3 text-xs text-muted-foreground">
                        Showing {filteredProducts.length} of {products.length} products.
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
