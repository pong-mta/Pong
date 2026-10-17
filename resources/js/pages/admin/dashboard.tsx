
import { useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    Clock,
    RefreshCw,
    ShieldCheck,
    Store,
    Users,
    XCircle,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface DashboardStats {
    totalUsers: number;
    totalStores: number;
    pendingApplications: number;
    totalAdmins: number;
    approvedApplications: number;
    rejectedApplications: number;
}

interface RecentApplication {
    id: number;
    business_name: string;
    business_type: string | null;
    status: 'pending' | 'approved' | 'rejected' | string;
    created_at: string;
    user: {
        name: string;
        phone: string | null;
    } | null;
}

interface DashboardProps {
    stats: DashboardStats;
    recentApplications: RecentApplication[];
    lastUpdated: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function formatNumber(value: number): string {
    return new Intl.NumberFormat().format(value);
}

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
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                styles[status] ??
                'bg-muted text-muted-foreground'
            }`}
        >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

export default function AdminDashboard({
    stats,
    recentApplications,
    lastUpdated,
}: DashboardProps) {
    useEffect(() => {
        const interval = window.setInterval(() => {
            router.reload({
                only: ['stats', 'recentApplications', 'lastUpdated'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 30_000);

        return () => window.clearInterval(interval);
    }, []);

    const cards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            description: 'Registered platform users',
            icon: Users,
        },
        {
            title: 'Registered Stores',
            value: stats.totalStores,
            description: 'Stores in the database',
            icon: Store,
        },
        {
            title: 'Pending Applications',
            value: stats.pendingApplications,
            description: 'Applications awaiting review',
            icon: Clock,
        },
        {
            title: 'Administrators',
            value: stats.totalAdmins,
            description: 'Admin accounts',
            icon: ShieldCheck,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PONG Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            PONG Overview
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Monitor users, stores, and store-owner
                            applications.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            router.reload({
                                only: [
                                    'stats',
                                    'recentApplications',
                                    'lastUpdated',
                                ],
                            })
                        }
                        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.title}
                                className="rounded-xl border bg-card p-5 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {card.title}
                                    </p>
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <p className="mt-4 text-3xl font-bold">
                                    {formatNumber(card.value)}
                                </p>

                                <p className="mt-1 text-xs text-muted-foreground">
                                    {card.description}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Approved Applications
                            </p>
                            <p className="text-xl font-bold">
                                {formatNumber(stats.approvedApplications)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
                        <Clock className="h-8 w-8 text-amber-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Awaiting Review
                            </p>
                            <p className="text-xl font-bold">
                                {formatNumber(stats.pendingApplications)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Rejected Applications
                            </p>
                            <p className="text-xl font-bold">
                                {formatNumber(stats.rejectedApplications)}
                            </p>
                        </div>
                    </div>
                </div>

                <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                        <div>
                            <h2 className="font-semibold">
                                Recent Store-Owner Applications
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                The latest eight applications received.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Activity className="h-4 w-4" />
                            Auto-refreshes every 30 seconds
                        </div>
                    </div>

                    {recentApplications.length === 0 ? (
                        <div className="p-10 text-center">
                            <Store className="mx-auto h-10 w-10 text-muted-foreground" />
                            <h3 className="mt-3 font-medium">
                                No applications yet
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                New store-owner applications will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">
                                            Business
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Applicant
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Submitted
                                        </th>
                                        <th className="px-5 py-3 font-medium">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {recentApplications.map((application) => (
                                        <tr
                                            key={application.id}
                                            className="hover:bg-muted/30"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-medium">
                                                    {application.business_name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {application.business_type ||
                                                        'Business type not specified'}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p>
                                                    {application.user?.name ??
                                                        'Unknown user'}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {application.user?.phone ??
                                                        'No phone number'}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                {formatDate(
                                                    application.created_at,
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={application.status}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <p className="text-xs text-muted-foreground">
                    Last updated: {formatDate(lastUpdated)}
                </p>
            </div>
        </AppLayout>
    );
}
