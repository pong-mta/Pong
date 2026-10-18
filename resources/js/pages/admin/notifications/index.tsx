
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    Store,
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

type PaginatedNotifications = {
    data: AdminNotification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

type Props = {
    notifications: PaginatedNotifications;
    unreadCount: number;
};

function formatDate(date: string) {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function getNotificationUrl(notification: AdminNotification) {
    const url = notification.data.url;

    // Only allow internal application links.
    if (url?.startsWith('/') && !url.startsWith('//')) {
        return url;
    }

    return '/admin/applications';
}

export default function NotificationsIndex({
    notifications,
    unreadCount,
}: Props) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    const items = notifications?.data ?? [];

    function markAsRead(notification: AdminNotification) {
        if (notification.read_at || processingId) {
            return;
        }

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
        if (markingAll || unreadCount === 0) {
            return;
        }

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

    function openNotification(notification: AdminNotification) {
        if (!notification.read_at) {
            markAsRead(notification);
        }

        router.visit(getNotificationUrl(notification));
    }

    return (
        <>
            <Head title="Notifications" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                <Bell className="size-6" />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Notifications
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Stay updated on activity across PONG.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={markAllAsRead}
                        disabled={markingAll || unreadCount === 0}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <CheckCheck className="size-4" />
                        {markingAll
                            ? 'Marking as read...'
                            : 'Mark all as read'}
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
                            Unread notifications
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
                            {notifications.current_page} /{' '}
                            {notifications.last_page}
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <div>
                            <h2 className="font-semibold">
                                Recent activity
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {notifications.total === 0
                                    ? 'No notifications yet.'
                                    : `Showing ${notifications.from ?? 0}–${notifications.to ?? 0} of ${notifications.total}`}
                            </p>
                        </div>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                                <Bell className="size-7 text-muted-foreground" />
                            </div>

                            <h3 className="text-lg font-semibold">
                                You're all caught up
                            </h3>

                            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                New store applications and other admin
                                activities will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {items.map((notification) => {
                                const data = notification.data ?? {};
                                const isUnread = !notification.read_at;
                                const title =
                                    data.title || 'Admin notification';
                                const message =
                                    data.message ||
                                    'There is a new update that may need your attention.';

                                return (
                                    <div
                                        key={notification.id}
                                        className={`flex flex-col gap-4 p-5 transition hover:bg-muted/40 sm:flex-row sm:items-start ${
                                            isUnread
                                                ? 'bg-orange-50/60 dark:bg-orange-950/10'
                                                : ''
                                        }`}
                                    >
                                        <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                                            <Store className="size-5 text-muted-foreground" />

                                            {isUnread && (
                                                <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background bg-orange-500" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold">
                                                    {title}
                                                </h3>

                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        isUnread
                                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                                                            : 'bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    {isUnread
                                                        ? 'Unread'
                                                        : 'Read'}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                {message}
                                            </p>

                                            {data.business_name && (
                                                <p className="mt-2 text-sm font-medium">
                                                    Store: {data.business_name}
                                                </p>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="size-3.5" />
                                                    {formatDate(
                                                        notification.created_at,
                                                    )}
                                                </span>

                                                {data.business_type && (
                                                    <span className="capitalize">
                                                        {data.business_type}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <Link
                                                    href={getNotificationUrl(
                                                        notification,
                                                    )}
                                                    onClick={() => {
                                                        if (isUnread) {
                                                            markAsRead(
                                                                notification,
                                                            );
                                                        }
                                                    }}
                                                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-orange-600 px-3 text-sm font-medium text-white transition hover:bg-orange-700"
                                                >
                                                    View details
                                                    <ExternalLink className="size-4" />
                                                </Link>

                                                {isUnread && (
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            processingId ===
                                                            notification.id
                                                        }
                                                        onClick={() =>
                                                            markAsRead(
                                                                notification,
                                                            )
                                                        }
                                                        className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                                                    >
                                                        <Check className="size-4" />
                                                        {processingId ===
                                                        notification.id
                                                            ? 'Updating...'
                                                            : 'Mark as read'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {notifications.last_page > 1 && (
                        <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Page {notifications.current_page} of{' '}
                                {notifications.last_page}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                {notifications.links.map((link, index) => {
                                    const label = link.label
                                        .replace('&laquo;', '«')
                                        .replace('&raquo;', '»')
                                        .replace(/<[^>]*>/g, '');

                                    if (
                                        label === '«' ||
                                        label === 'Previous'
                                    ) {
                                        return (
                                            <button
                                                key={`prev-${index}`}
                                                type="button"
                                                disabled={!link.url}
                                                onClick={() =>
                                                    link.url &&
                                                    router.visit(link.url, {
                                                        preserveScroll: true,
                                                    })
                                                }
                                                className="inline-flex size-9 items-center justify-center rounded-lg border disabled:opacity-40"
                                                aria-label="Previous page"
                                            >
                                                <ChevronLeft className="size-4" />
                                            </button>
                                        );
                                    }

                                    if (
                                        label === '»' ||
                                        label === 'Next'
                                    ) {
                                        return (
                                            <button
                                                key={`next-${index}`}
                                                type="button"
                                                disabled={!link.url}
                                                onClick={() =>
                                                    link.url &&
                                                    router.visit(link.url, {
                                                        preserveScroll: true,
                                                    })
                                                }
                                                className="inline-flex size-9 items-center justify-center rounded-lg border disabled:opacity-40"
                                                aria-label="Next page"
                                            >
                                                <ChevronRight className="size-4" />
                                            </button>
                                        );
                                    }

                                    if (!link.url || label === '...') {
                                        return null;
                                    }

                                    return (
                                        <button
                                            key={`page-${index}`}
                                            type="button"
                                            onClick={() =>
                                                router.visit(link.url!, {
                                                    preserveScroll: true,
                                                })
                                            }
                                            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm ${
                                                link.active
                                                    ? 'border-orange-600 bg-orange-600 text-white'
                                                    : 'hover:bg-muted'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
