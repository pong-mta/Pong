import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import {
    Building2,
    CheckCircle2,
    Clock3,
    MapPin,
    Phone,
    XCircle,
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
        pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
        approved: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
        rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
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

export default function ApplicationsPage({
    applications,
}: ApplicationsPageProps) {
    const [filter, setFilter] = useState('all');
    const [busyId, setBusyId] = useState<number | null>(null);
    const { errors } = usePage().props;

    const visibleApplications = applications.filter(
        (application) =>
            filter === 'all' || application.status === filter,
    );

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

        // Cancel means do not reject.
        if (notes === null) {
            return;
        }

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
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Store Owner Applications
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Review applications and approve or reject requests
                        to register a store.
                    </p>
                </div>

                {typeof errors.application === 'string' && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                        {errors.application}
                    </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        {
                            label: 'All applications',
                            value: applications.length,
                            key: 'all',
                            icon: Building2,
                        },
                        {
                            label: 'Pending',
                            value: applications.filter(
                                (a) => a.status === 'pending',
                            ).length,
                            key: 'pending',
                            icon: Clock3,
                        },
                        {
                            label: 'Approved',
                            value: applications.filter(
                                (a) => a.status === 'approved',
                            ).length,
                            key: 'approved',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Rejected',
                            value: applications.filter(
                                (a) => a.status === 'rejected',
                            ).length,
                            key: 'rejected',
                            icon: XCircle,
                        },
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => setFilter(item.key)}
                                className={`rounded-xl border p-4 text-left transition hover:bg-muted/50 ${
                                    filter === item.key
                                        ? 'border-primary ring-1 ring-primary'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between">
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

                <div className="overflow-hidden rounded-xl border">
                    <div className="border-b p-4">
                        <h2 className="font-semibold">Applications</h2>
                        <p className="text-sm text-muted-foreground">
                            Showing {visibleApplications.length} application(s)
                        </p>
                    </div>

                    {visibleApplications.length === 0 ? (
                        <div className="p-10 text-center text-sm text-muted-foreground">
                            No applications found for this filter.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {visibleApplications.map((application) => (
                                <article
                                    key={application.id}
                                    className="space-y-4 p-4 md:p-5"
                                >
                                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-lg font-semibold">
                                                    {application.business_name}
                                                </h3>
                                                <StatusBadge
                                                    status={application.status}
                                                />
                                            </div>

                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {application.business_type ||
                                                    'Business type not specified'}
                                            </p>

                                            <p className="mt-2 text-sm">
                                                Applicant:{' '}
                                                <span className="font-medium">
                                                    {application.user?.name ??
                                                        'User account unavailable'}
                                                </span>
                                            </p>
                                        </div>

                                        {application.status === 'pending' && (
                                            <div className="flex shrink-0 gap-2">
                                                <button
                                                    type="button"
                                                    disabled={busyId !== null}
                                                    onClick={() =>
                                                        approve(application)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
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
                                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    <XCircle className="size-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {application.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {application.description}
                                        </p>
                                    )}

                                    <div className="grid gap-2 text-sm md:grid-cols-2">
                                        <div className="flex items-start gap-2">
                                            <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <span>
                                                {application.phone ||
                                                    application.user?.phone ||
                                                    'No phone provided'}
                                            </span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                            <span>
                                                {application.address ||
                                                    'No address provided'}
                                            </span>
                                        </div>
                                    </div>

                                    {(application.latitude !== null ||
                                        application.longitude !== null) && (
                                        <p className="text-xs text-muted-foreground">
                                            Coordinates: {application.latitude ?? '—'},{' '}
                                            {application.longitude ?? '—'}
                                        </p>
                                    )}

                                    {application.admin_notes && (
                                        <p className="rounded-lg bg-muted p-3 text-sm">
                                            <strong>Admin notes:</strong>{' '}
                                            {application.admin_notes}
                                        </p>
                                    )}

                                    <p className="text-xs text-muted-foreground">
                                        Submitted:{' '}
                                        {application.created_at
                                            ? new Date(
                                                  application.created_at,
                                              ).toLocaleString()
                                            : 'Unknown'}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}