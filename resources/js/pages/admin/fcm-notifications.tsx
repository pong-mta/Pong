import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';

type FcmUser = {
    id: number;
    name: string;
    phone: string;
};

type FcmNotification = {
    id: number;
    target: string;
    title: string;
    body: string;
    recipient_count: number;
    accepted_count: number;
    failed_count: number;
    status: string;
    accepted_recipients_count: number;
    failed_recipients_count: number;
    created_at: string;
};

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    users: FcmUser[];
    notifications: Pagination<FcmNotification>;
    flash?: {
        success?: string;
        warning?: string;
        error?: string;
    };
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'FCM Notifications', href: '/admin/fcm-notifications' },
];

export default function FcmNotifications({
    users,
    notifications,
}: Props) {
    const { flash } = usePage<Props>().props;

    const form = useForm({
        target: 'all',
        user_id: '',
        title: '',
        body: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (
            form.data.target === 'all' &&
            !window.confirm(
                'Send this push notification to every registered device?'
            )
        ) {
            return;
        }

        form.post('/admin/fcm-notifications', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('user_id', 'title', 'body');
                form.setData('target', 'all');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="FCM Notifications" />

            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        FCM Notifications
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Send push notifications to registered PONG mobile devices.
                    </p>
                </div>

                {flash?.success && (
                    <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
                        {flash.success}
                    </div>
                )}

                {flash?.warning && (
                    <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
                        {flash.warning}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
                        {flash.error}
                    </div>
                )}

                <section className="rounded-xl border bg-card p-5">
                    <h2 className="text-lg font-semibold">
                        Compose notification
                    </h2>

                    <form onSubmit={submit} className="mt-5 space-y-5">
                        <div>
                            <label
                                htmlFor="target"
                                className="mb-2 block text-sm font-medium"
                            >
                                Recipients
                            </label>

                            <select
                                id="target"
                                value={form.data.target}
                                onChange={(event) => {
                                    form.setData('target', event.target.value);
                                    form.clearErrors();
                                }}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="all">
                                    All registered devices
                                </option>
                                <option value="user">
                                    One user (all their devices)
                                </option>
                            </select>

                            {form.errors.target && (
                                <p className="mt-1 text-sm text-red-600">
                                    {form.errors.target}
                                </p>
                            )}
                        </div>

                        {form.data.target === 'user' && (
                            <div>
                                <label
                                    htmlFor="user_id"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Select user
                                </label>

                                <select
                                    id="user_id"
                                    value={form.data.user_id}
                                    onChange={(event) =>
                                        form.setData('user_id', event.target.value)
                                    }
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">Choose a user</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} — {user.phone}
                                        </option>
                                    ))}
                                </select>

                                {form.errors.user_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {form.errors.user_id}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="title"
                                className="mb-2 block text-sm font-medium"
                            >
                                Notification title
                            </label>

                            <input
                                id="title"
                                value={form.data.title}
                                maxLength={150}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                placeholder="PONG notification"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            />

                            {form.errors.title && (
                                <p className="mt-1 text-sm text-red-600">
                                    {form.errors.title}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="body"
                                className="mb-2 block text-sm font-medium"
                            >
                                Message
                            </label>

                            <textarea
                                id="body"
                                rows={4}
                                maxLength={2000}
                                value={form.data.body}
                                onChange={(event) =>
                                    form.setData('body', event.target.value)
                                }
                                placeholder="Type your push notification..."
                                className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                            />

                            {form.errors.body && (
                                <p className="mt-1 text-sm text-red-600">
                                    {form.errors.body}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                        >
                            {form.processing
                                ? 'Sending notification...'
                                : 'Send push notification'}
                        </button>

                        <p className="text-xs text-muted-foreground">
                            Firebase acceptance does not guarantee that a
                            device displayed the notification. Device
                            permissions, connectivity, and app behavior affect
                            delivery and display.
                        </p>
                    </form>
                </section>

                <section className="overflow-hidden rounded-xl border bg-card">
                    <div className="border-b p-5">
                        <h2 className="text-lg font-semibold">
                            Notification history
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Target</th>
                                    <th className="px-4 py-3">Notification</th>
                                    <th className="px-4 py-3">Devices</th>
                                    <th className="px-4 py-3">Accepted</th>
                                    <th className="px-4 py-3">Failed</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {notifications.data.map((item) => (
                                    <tr key={item.id}>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {new Date(item.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.target === 'all'
                                                ? 'All devices'
                                                : 'Selected user'}
                                        </td>
                                        <td className="max-w-xs px-4 py-3">
                                            <p className="font-medium">
                                                {item.title}
                                            </p>
                                            <p className="line-clamp-2 text-muted-foreground">
                                                {item.body}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.recipient_count}
                                        </td>
                                        <td className="px-4 py-3 text-green-700">
                                            {item.accepted_recipients_count}
                                        </td>
                                        <td className="px-4 py-3 text-red-600">
                                            {item.failed_recipients_count}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full border px-2 py-1 text-xs">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {notifications.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No push notifications sent yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t p-4">
                        <span className="text-sm text-muted-foreground">
                            Page {notifications.current_page} of {notifications.last_page}
                        </span>

                        <div className="flex gap-2">
                            {notifications.prev_page_url && (
                                <a
                                    href={notifications.prev_page_url}
                                    className="rounded-md border px-3 py-2 text-sm"
                                >
                                    Previous
                                </a>
                            )}
                            {notifications.next_page_url && (
                                <a
                                    href={notifications.next_page_url}
                                    className="rounded-md border px-3 py-2 text-sm"
                                >
                                    Next
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
