import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import {
    ArrowLeft,
    MapPin,
    Phone,
    UserRound,
    Store as StoreIcon,
    Globe,
    CalendarDays,
    CheckCircle2,
    XCircle,
    Power,
} from 'lucide-react';

type StoreOwner = {
    id: number;
    name: string;
    phone: string | null;
    created_at?: string;
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
};

type Props = {
    store: StoreRecord;
};

function isActive(store: StoreRecord) {
    return store.is_active === true || store.is_active === 1;
}

function getLogoUrl(logo: string | null) {
    if (!logo) return null;
    if (/^https?:\/\//i.test(logo)) return logo;
    return `/storage/${logo.replace(/^\/?storage\//, '').replace(/^\//, '')}`;
}

function formatDate(value?: string | null) {
    if (!value) return 'Not available';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

export default function Show({ store }: Props) {
    const active = isActive(store);
    const logo = getLogoUrl(store.logo);

    function toggleStatus() {
        const nextStatus = active ? 'deactivate' : 'activate';

        if (
            !window.confirm(
                `Are you sure you want to ${nextStatus} "${store.name}"?`,
            )
        ) {
            return;
        }

        router.patch(
            `/admin/stores/${store.id}/toggle-status`,
            {},
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <AppLayout>
            <Head title={`Store: ${store.name}`} />

            <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-6">
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
                            <h1 className="text-2xl font-bold tracking-tight">
                                Store Details
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Review store information and manage its status.
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

                {/* Store header */}
                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="h-2 bg-primary" />

                    <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                        {logo ? (
                            <img
                                src={logo}
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
                                <h2 className="text-xl font-bold">
                                    {store.name}
                                </h2>

                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                        active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    }`}
                                >
                                    {active ? (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                        <XCircle className="h-3.5 w-3.5" />
                                    )}
                                    {active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <p className="mt-2 text-sm text-muted-foreground">
                                Store ID: {store.id}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Slug: {store.slug || 'Not set'}
                            </p>

                            <p className="mt-3 text-sm">
                                {store.description ||
                                    'No store description has been provided.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Store information */}
                    <section className="rounded-xl border bg-card p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <StoreIcon className="h-5 w-5 text-muted-foreground" />
                            <h2 className="font-semibold">
                                Business Information
                            </h2>
                        </div>

                        <div className="space-y-5">
                            <Detail
                                label="Store name"
                                value={store.name}
                            />

                            <Detail
                                label="Store phone"
                                value={store.phone || 'Not provided'}
                                icon={<Phone className="h-4 w-4" />}
                            />

                            <Detail
                                label="Business address"
                                value={store.address || 'Not provided'}
                                icon={<MapPin className="h-4 w-4" />}
                            />

                            <Detail
                                label="Description"
                                value={
                                    store.description ||
                                    'No description provided'
                                }
                            />

                            <Detail
                                label="Registered on"
                                value={formatDate(store.created_at)}
                                icon={<CalendarDays className="h-4 w-4" />}
                            />
                        </div>
                    </section>

                    {/* Owner information */}
                    <section className="rounded-xl border bg-card p-5 sm:p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                            <h2 className="font-semibold">
                                Store Owner
                            </h2>
                        </div>

                        {store.owner ? (
                            <div className="space-y-5">
                                <Detail
                                    label="Owner name"
                                    value={store.owner.name}
                                    icon={<UserRound className="h-4 w-4" />}
                                />

                                <Detail
                                    label="Owner phone"
                                    value={
                                        store.owner.phone || 'Not provided'
                                    }
                                    icon={<Phone className="h-4 w-4" />}
                                />

                                <Detail
                                    label="User ID"
                                    value={String(store.owner.id)}
                                />

                                <Detail
                                    label="Owner account created"
                                    value={formatDate(store.owner.created_at)}
                                    icon={<CalendarDays className="h-4 w-4" />}
                                />
                            </div>
                        ) : (
                            <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                                The associated owner account could not be found.
                            </p>
                        )}
                    </section>

                    {/* Coordinates */}
                    <section className="rounded-xl border bg-card p-5 sm:p-6 lg:col-span-2">
                        <div className="mb-5 flex items-center gap-2">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                            <h2 className="font-semibold">
                                Store Location
                            </h2>
                        </div>

                        {store.latitude != null &&
                        store.longitude != null ? (
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Detail
                                        label="Latitude"
                                        value={String(store.latitude)}
                                    />
                                    <Detail
                                        label="Longitude"
                                        value={String(store.longitude)}
                                    />
                                </div>

                                <a
                                    href={`https://www.google.com/maps?q=${encodeURIComponent(
                                        `${store.latitude},${store.longitude}`,
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                                >
                                    <MapPin className="h-4 w-4" />
                                    Open in Google Maps
                                </a>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No map coordinates have been recorded for this
                                store.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}

function Detail({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon?: React.ReactNode;
}) {
    return (
        <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
            </p>
            <div className="flex items-start gap-2 text-sm">
                {icon && (
                    <span className="mt-0.5 text-muted-foreground">
                        {icon}
                    </span>
                )}
                <span className="break-words">{value}</span>
            </div>
        </div>
    );
}
