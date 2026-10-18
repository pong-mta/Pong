import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import {
    Building2,
    CheckCircle2,
    Clock3,
    MapPin,
    Phone,
    Search,
    X,
    XCircle,
    ExternalLink,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

type ApplicationStatus = 'pending' | 'approved' | 'rejected';

interface Application {
    id: number;
    business_name: string;
    business_type: string | null;
    description: string | null;
    phone: string | null;
    address: string | null;
    latitude: number | string | null;
    longitude: number | string | null;
    status: ApplicationStatus | string;
    admin_notes: string | null;
    created_at: string | null;
    user: {
        id: number;
        name: string;
        phone: string | null;
    } | null;
}

interface ApplicationsPageProps {
    applications: Application[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'Applications', href: '/admin/applications' },
];

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        pending:
            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        approved:
            'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
        rejected:
            'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                styles[status] ?? 'bg-muted text-muted-foreground'
            }`}
        >
            {status}
        </span>
    );
}

function formatDate(value: string | null) {
    if (!value) return 'Unknown';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 'Unknown'
        : date.toLocaleString();
}

export default function ApplicationsPage({
    applications,
}: ApplicationsPageProps) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState<number | null>(null);
    const { errors } = usePage().props;

    const counts = {
        all: applications.length,
        pending: applications.filter((a) => a.status === 'pending').length,
        approved: applications.filter((a) => a.status === 'approved').length,
        rejected: applications.filter((a) => a.status === 'rejected').length,
    };

    const visibleApplications = useMemo(() => {
        const term = search.trim().toLowerCase();

        return applications.filter((application) => {
            const matchesStatus =
                filter === 'all' || application.status === filter;

            const matchesSearch =
                !term ||
                [
                    application.business_name,
                    application.business_type ?? '',
                    application.user?.name ?? '',
                    application.phone ?? '',
                    application.user?.phone ?? '',
                    application.address ?? '',
                    String(application.id),
                ].some((value) => value.toLowerCase().includes(term));

            return matchesStatus && matchesSearch;
        });
    }, [applications, filter, search]);

    function approve(application: Application) {
        if (
            !window.confirm(
                `Approve "${application.business_name}" and create its store?`,
            )
        ) {
            return;
        }

        setBusyId(application.id);

        router.post(
            `/admin/applications/${application.id}/approve`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    }

    function reject(application: Application) {
        const notes = window.prompt(
            `Reason for rejecting "${application.business_name}" (optional):`,
        );

        if (notes === null) return;

        setBusyId(application.id);

        router.post(
            `/admin/applications/${application.id}/reject`,
            { admin_notes: notes.trim() || null },
            {
                preserveScroll: true,
                onFinish: () => setBusyId(null),
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Store Owner Applications" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                {/* Page heading */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Store Owner Applications
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Search, review, and manage store registration requests.
                    </p>
                </div>

                {/* Server-side errors */}
                {typeof errors.application === 'string' && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                        {errors.application}
                    </div>
                )}

                {/* Status summary filters */}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: 'All Applications',
                            value: counts.all,
                            key: 'all',
                            icon: Building2,
                        },
                        {
                            label: 'Pending',
                            value: counts.pending,
                            key: 'pending',
                            icon: Clock3,
                        },
                        {
                            label: 'Approved',
                            value: counts.approved,
                            key: 'approved',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Rejected',
                            value: counts.rejected,
                            key: 'rejected',
                            icon: XCircle,
                        },
                    ].map((item) => {
                        const Icon = item.icon;
                        const active = filter === item.key;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setFilter(item.key)}
                                className={`rounded-xl border bg-background p-4 text-left transition hover:bg-muted/50 ${
                                    active
                                        ? 'border-primary ring-1 ring-primary'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {item.label}
                                    </span>
                                    <Icon className="size-5 text-muted-foreground" />
                                </div>
                                <div className="mt-2 text-2xl font-bold">
                                    {item.value}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Table panel */}
                <section className="overflow-hidden rounded-xl border bg-background">
                    <div className="flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="font-semibold">Applications</h2>
                            <p className="text-sm text-muted-foreground">
                                Showing {visibleApplications.length} of{' '}
                                {applications.length} application(s)
                            </p>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search business, applicant, phone..."
                                aria-label="Search applications"
                                className="h-10 w-full rounded-lg border bg-background pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-ring"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Responsive table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="whitespace-nowrap px-4 py-3">
                                        Business
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3">
                                        Applicant
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3">
                                        Contact
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3">
                                        Address
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3">
                                        Submitted
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3">
                                        Status
                                    </th>
                                    <th className="whitespace-nowrap px-4 py-3 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {visibleApplications.map((application) => (
                                    <tr
                                        key={application.id}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        {/* Business */}
                                        <td className="min-w-52 px-4 py-4">
                                            <div className="font-semibold">
                                                {application.business_name}
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {application.business_type ||
                                                    'Unspecified type'}
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                ID: {application.id}
                                            </div>
                                        </td>

                                        {/* Applicant */}
                                        <td className="min-w-40 px-4 py-4">
                                            <div className="font-medium">
                                                {application.user?.name ??
                                                    'Account unavailable'}
                                            </div>
                                            {application.user && (
                                                <div className="mt-1 text-xs text-muted-foreground">
                                                    User ID: {application.user.id}
                                                </div>
                                            )}
                                        </td>

                                        {/* Contact */}
                                        <td className="min-w-44 px-4 py-4">
                                            <div className="flex items-start gap-2">
                                                <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                <span>
                                                    {application.phone ||
                                                        application.user?.phone ||
                                                        'No phone provided'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Address */}
                                        <td className="min-w-48 px-4 py-4">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                                <span>
                                                    {application.address ||
                                                        'No address provided'}
                                                </span>
                                            </div>

                                            {application.latitude !== null &&
                                                application.longitude !== null && (
                                                    <a
                                                        href={`https://www.openstreetmap.org/?mlat=${application.latitude}&mlon=${application.longitude}#map=16/${application.latitude}/${application.longitude}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                    >
                                                        View coordinates
                                                        <ExternalLink className="size-3" />
                                                    </a>
                                                )}
                                        </td>

                                        {/* Date */}
                                        <td className="min-w-40 whitespace-nowrap px-4 py-4 text-muted-foreground">
                                            {formatDate(application.created_at)}
                                        </td>

                                        {/* Status */}
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <StatusBadge status={application.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="min-w-48 px-4 py-4">
                                            {application.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={busyId !== null}
                                                        onClick={() =>
                                                            approve(application)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 className="size-4" />
                                                        {busyId === application.id
                                                            ? 'Processing…'
                                                            : 'Approve'}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={busyId !== null}
                                                        onClick={() =>
                                                            reject(application)
                                                        }
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <XCircle className="size-4" />
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-right text-xs text-muted-foreground">
                                                    {application.status === 'approved'
                                                        ? 'Application approved'
                                                        : application.status === 'rejected'
                                                          ? 'Application rejected'
                                                          : 'No actions available'}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}

                                {visibleApplications.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="p-10 text-center"
                                        >
                                            <Building2 className="mx-auto size-8 text-muted-foreground" />
                                            <p className="mt-3 font-medium">
                                                No applications found
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Try another search term or status filter.
                                            </p>
                                            {(search || filter !== 'all') && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearch('');
                                                        setFilter('all');
                                                    }}
                                                    className="mt-3 text-sm font-medium text-primary hover:underline"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                        Filter by status using the summary cards. Search matches
                        business name, applicant, phone, address, business type,
                        or application ID.
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
