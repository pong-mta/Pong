
import AppLayout from '@/layouts/app/app-sidebar-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
} from 'lucide-react';
import { useState } from 'react';

type NotificationData = {
    type?: string;
    title?: string;
    message?: string;
    application_id?: number | string;
    business_name?: string;
    business_type?: string;
    status?: string;
    url?: string;
};

type AdminNotification = {
    id: string;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type PaginatedNotifications = {
    data: AdminNotification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
};

type Props = {
    notifications: PaginatedNotifications;
    unreadCount: number;
};

function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function notificationUrl(notification: AdminNotification) {
    const url = notification.data?.url;

    return url?.startsWith('/') && !url.startsWith('//')
        ? url
        : '/admin/applications';
}

export default function NotificationsIndex({
    notifications,
    unreadCount,
}: Props) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    const items = notifications?.data ?? [];

    function markAsRead(notification: AdminNotification) {
        if (notification.read_at || processingId) return;

        setProcessingId(notification.id);

        router.patch(
            `/admin/notifications/${encodeURIComponent(notification.id)}/read`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingId(null),
            },
        );
    }

    function markAllAsRead() {
        if (markingAll || unreadCount === 0) return;

        setMarkingAll(true);

        router.patch(
            '/admin/notifications/read-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setMarkingAll(false),
            },
        );
    }

    return (
        <>
            <Head title="Admin Notifications" />

            <AppLayout breadcrumbs={[{ title: 'Notifications', href: '/admin/notifications' }]}>
                <div className="flex flex-col gap-6 p-4 md:p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                <Bell className="size-6" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Notifications
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage store applications and admin activity.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={markAllAsRead}
                            disabled={markingAll || unreadCount === 0}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <CheckCheck className="size-4" />
                            {markingAll ? 'Updating...' : 'Mark all as read'}
                        </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                                Total notifications
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                                {notifications.total}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                                Unread
                            </p>
                            <p className="mt-2 text-2xl font-bold text-orange-600">
                                {unreadCount}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4">
                            <p className="text-sm text-muted-foreground">
                                Current page
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                                {notifications.current_page} / {notifications.last_page}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border bg-card">
                        <div className="border-b px-5 py-4">
                            <h2 className="font-semibold">All notifications</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {notifications.total === 0
                                    ? 'No notifications found.'
                                    : `Showing ${notifications.from ?? 0}–${notifications.to ?? 0} of ${notifications.total}`}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3 font-medium">Notification</th>
                                        <th className="px-5 py-3 font-medium">Business</th>
                                        <th className="px-5 py-3 font-medium">Type</th>
                                        <th className="px-5 py-3 font-medium">Date</th>
                                        <th className="px-5 py-3 font-medium">Status</th>
                                        <th className="px-5 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y">
                                    {items.map((notification) => {
                                        const data = notification.data ?? {};
                                        const unread = !notification.read_at;

                                        return (
                                            <tr
                                                key={notification.id}
                                                className={
                                                    unread
                                                        ? 'bg-orange-50/50 dark:bg-orange-950/10'
                                                        : 'hover:bg-muted/30'
                                                }
                                            >
                                                <td className="min-w-64 px-5 py-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                            <Bell className="size-4" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {data.title ?? 'Admin notification'}
                                                            </p>
                                                            <p className="mt-1 max-w-sm text-muted-foreground">
                                                                {data.message ?? 'A new admin update is available.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="font-medium">
                                                        {data.business_name ?? '—'}
                                                    </div>
                                                    {data.application_id && (
                                                        <div className="mt-1 text-xs text-muted-foreground">
                                                            Application #{data.application_id}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="capitalize">
                                                        {(data.business_type ?? data.type ?? 'general')
                                                            .replaceAll('_', ' ')}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                                                    {formatDate(notification.created_at)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            unread
                                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                                                : 'bg-muted text-muted-foreground'
                                                        }`}
                                                    >
                                                        {unread ? 'Unread' : 'Read'}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        {unread && (
                                                            <button
                                                                type="button"
                                                                title="Mark as read"
                                                                disabled={processingId === notification.id}
                                                                onClick={() => markAsRead(notification)}
                                                                className="inline-flex size-9 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-50"
                                                            >
                                                                <Check className="size-4" />
                                                            </button>
                                                        )}

                                                        <Link
                                                            href={notificationUrl(notification)}
                                                            title="View details"
                                                            onClick={() => {
                                                                if (unread) {
                                                                    markAsRead(notification);
                                                                }
                                                            }}
                                                            className="inline-flex size-9 items-center justify-center rounded-lg border hover:bg-muted"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-16 text-center">
                                                <Bell className="mx-auto size-8 text-muted-foreground" />
                                                <p className="mt-3 font-medium">
                                                    No notifications yet
                                                </p>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    New store applications will appear here.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {notifications.last_page > 1 && (
                            <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Page {notifications.current_page} of {notifications.last_page}
                                </p>

                                <div className="flex items-center gap-2">
                                    {notifications.links.map((link, index) => {
                                        const label = link.label
                                            .replace(/&laquo;/g, '«')
                                            .replace(/&raquo;/g, '»')
                                            .replace(/<[^>]*>/g, '');

                                        if (!link.url) return null;

                                        if (label === '...') return null;

                                        const isPrevious =
                                            label === '«' || label.toLowerCase().includes('previous');
                                        const isNext =
                                            label === '»' || label.toLowerCase().includes('next');

                                        return (
                                            <button
                                                key={`${label}-${index}`}
                                                type="button"
                                                onClick={() =>
                                                    router.visit(link.url!, {
                                                        preserveScroll: true,
                                                    })
                                                }
                                                aria-label={
                                                    isPrevious
                                                        ? 'Previous page'
                                                        : isNext
                                                          ? 'Next page'
                                                          : `Page ${label}`
                                                }
                                                className={`inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border px-3 text-sm ${
                                                    link.active
                                                        ? 'border-orange-600 bg-orange-600 text-white'
                                                        : 'hover:bg-muted'
                                                }`}
                                            >
                                                {isPrevious ? (
                                                    <ChevronLeft className="size-4" />
                                                ) : isNext ? (
                                                    <ChevronRight className="size-4" />
                                                ) : (
                                                    label
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AppLayout>
        </>
    );
}
