import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    Search,
    Store as StoreIcon,
    MapPin,
    Phone,
    UserRound,
    Eye,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Trash2,
    RotateCcw,
} from 'lucide-react';
type StoreOwner = {
    id: number;
    name: string;
    phone: string | null;
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
    owner: StoreOwner | null;
};
type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};
type PaginatedStores = {
    data: StoreRecord[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
};
type Props = {
    stores: PaginatedStores;
    filters: {
        search: string;
        status: 'all' | 'active' | 'inactive' | 'deleted';
    };
    counts: {
        all: number;
        active: number;
        inactive: number;
        deleted: number;
    };
};
function isActive(store: StoreRecord) {
    return store.is_active === true || store.is_active === 1;
}
function getLogoUrl(logo: string | null) {
    if (!logo) return null;
    if (/^https?:\/\//i.test(logo)) return logo;
    const path = logo
        .replace(/^\/?storage\//, '')
        .replace(/^\//, '');
    return `/storage/${path}`;
}
export default function Index({
    stores,
    filters,
    counts,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    function applyFilters(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            '/admin/stores',
            {
                search: search.trim() || undefined,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }
    function changeStatus(value: 'all' | 'active' | 'inactive' | 'deleted') {
        setStatus(value);
        router.get(
            '/admin/stores',
            {
                search: search.trim() || undefined,
                status: value === 'all' ? undefined : value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }
    return (
        <AppLayout>
            <Head title="All Stores" />
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            All Stores
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View and manage stores registered on PONG.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <StoreIcon className="h-5 w-5" />
                        {counts.all} total stores
                    </div>
                </div>
                {/* Summary cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="All Stores"
                        value={counts.all}
                        icon={<StoreIcon className="h-5 w-5" />}
                        selected={status === 'all'}
                        onClick={() => changeStatus('all')}
                    />
                    <SummaryCard
                        title="Active Stores"
                        value={counts.active}
                        icon={<CheckCircle2 className="h-5 w-5" />}
                        selected={status === 'active'}
                        onClick={() => changeStatus('active')}
                    />
                    <SummaryCard
                        title="Inactive Stores"
                        value={counts.inactive}
                        icon={<XCircle className="h-5 w-5" />}
                        selected={status === 'inactive'}
                        onClick={() => changeStatus('inactive')}
                    />
                </div>
                {/* Search and filter */}
                <form
                    onSubmit={applyFilters}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row"
                >
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search store, owner, phone, or address..."
                            className="w-full rounded-lg border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={(event) =>
                            changeStatus(
                                event.target.value as
                                    | 'all'
                                    | 'active'
                                    | 'inactive'
                                    | 'deleted',
                            )
                        }
                        className="rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                        <option value="deleted">Deleted only</option>
                    </select>
                    <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        <Search className="h-4 w-4" />
                        Search
                    </button>
                </form>
                {/* Store table */}
                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-sm">
                            <thead className="border-b bg-muted/50">
                                <tr className="text-left">
                                    <th className="px-4 py-3 font-semibold">
                                        Store
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Owner
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Contact
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Address
                                    </th>
                                    <th className="px-4 py-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {stores.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-4 py-12 text-center"
                                        >
                                            <StoreIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                                            <p className="font-medium">
                                                No stores found
                                            </p>
                                            <p className="mt-1 text-muted-foreground">
                                                Try another search or status
                                                filter.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    stores.data.map((store) => {
                                        const active = isActive(store);
                                        const isDeleted = status === 'deleted';
                                        const logo = getLogoUrl(store.logo);
                                        return (
                                            <tr
                                                key={store.id}
                                                className="transition-colors hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {logo ? (
                                                            <img
                                                                src={logo}
                                                                alt={`${store.name} logo`}
                                                                className="h-11 w-11 rounded-lg border object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                                                                <StoreIcon className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold">
                                                                {store.name}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                ID: {store.id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <div>
                                                            <p>
                                                                {store.owner?.name ??
                                                                    'Unknown owner'}
                                                            </p>
                                                            <p className="mt-1 text-xs text-muted-foreground">
                                                                Owner ID:{' '}
                                                                {store.owner_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                        {store.phone ||
                                                            store.owner?.phone ||
                                                            '—'}
                                                    </div>
                                                </td>
                                                <td className="max-w-[220px] px-4 py-4">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                        <span className="line-clamp-2">
                                                            {store.address ||
                                                                'No address'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            active
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`h-1.5 w-1.5 rounded-full ${
                                                                active
                                                                    ? 'bg-green-600'
                                                                    : 'bg-red-600'
                                                            }`}
                                                        />
                                                        {active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex flex-wrap justify-end gap-2">
                                                        {!isDeleted && (
                                                            <Link
                                                                href={`/admin/stores/${store.id}`}
                                                                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                View
                                                            </Link>
                                                        )}
                                                        {isDeleted ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm(`Restore "${store.name}"? It will remain inactive until an admin activates it.`)) {
                                                                        router.patch(
                                                                            `/admin/stores/${store.id}/restore`,
                                                                            {},
                                                                            { preserveScroll: true },
                                                                        );
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                                Restore
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (window.confirm(`Soft-delete "${store.name}"? The store can be restored later from Deleted Stores.`)) {
                                                                        router.delete(
                                                                            `/admin/stores/${store.id}`,
                                                                            { preserveScroll: true },
                                                                        );
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {stores.from ?? 0}–{stores.to ?? 0} of{' '}
                            {stores.total} stores
                        </p>
                        <div className="flex flex-wrap items-center gap-1">
                            {stores.links.map((link, index) => {
                                const isPrevious =
                                    index === 0;
                                const isNext =
                                    index === stores.links.length - 1;
                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${index}-${link.label}`}
                                            className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm text-muted-foreground opacity-50"
                                        >
                                            {isPrevious ? (
                                                <ChevronLeft className="h-4 w-4" />
                                            ) : isNext ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : (
                                                <span
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                />
                                            )}
                                        </span>
                                    );
                                }
                                return (
                                    <Link
                                        key={`${index}-${link.label}`}
                                        href={link.url}
                                        preserveScroll
                                        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'border hover:bg-muted'
                                        }`}
                                    >
                                        {isPrevious ? (
                                            <ChevronLeft className="h-4 w-4" />
                                        ) : isNext ? (
                                            <ChevronRight className="h-4 w-4" />
                                        ) : (
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
function SummaryCard({
    title,
    value,
    icon,
    selected,
    onClick,
}: {
    title: string;
    value: number;
    icon: ReactNode;
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40 ${
                selected ? 'border-primary ring-1 ring-primary' : ''
            }`}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{title}</p>
                <span className="text-muted-foreground">{icon}</span>
            </div>
            <p className="mt-3 text-3xl font-bold">{value}</p>
        </button>
    );
}
