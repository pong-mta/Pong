import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

type SmsUser = {
    id: number;
    name: string;
    phone: string;
};

type SmsMessage = {
    id: number;
    target: string;
    message: string;
    recipient_count: number;
    queued_count: number;
    failed_count: number;
    status: string;
    queued_recipients_count: number;
    failed_recipients_count: number;
    created_at: string;
};

type PaginatedMessages = {
    data: SmsMessage[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    users: SmsUser[];
    messages: PaginatedMessages;
};

const breadcrumbs = [
    { title: 'Dashboard', href: '/admin/dashboard' },
    { title: 'SMS Messages', href: '/admin/sms-messages' },
];

export default function SmsMessages({ users, messages }: Props) {
    const { flash } = usePage<{
        flash?: {
            success?: string;
            warning?: string;
            error?: string;
        };
    }>().props as {
        flash?: {
            success?: string;
            warning?: string;
            error?: string;
        };
    };

    const form = useForm({
        target: 'manual',
        phone: '',
        user_id: '',
        message: '',
    });

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        form.post('/admin/sms-messages', {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('phone', 'user_id', 'message');
                form.setData('target', 'manual');
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="SMS Messages" />

            <div className="space-y-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">
                        SMS Messages
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Send SMS using your PONG SMS API and review previous attempts.
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
                        Compose SMS
                    </h2>

                    <form onSubmit={submit} className="mt-5 space-y-5">
                        <div>
                            <label
                                htmlFor="target"
                                className="mb-2 block text-sm font-medium"
                            >
                                Recipient
                            </label>

                            <select
                                id="target"
                                value={form.data.target}
                                onChange={(e) => {
                                    form.setData('target', e.target.value);
                                    form.clearErrors();
                                }}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="manual">
                                    Enter phone number
                                </option>
                                <option value="user">
                                    Select a verified user
                                </option>
                                <option value="all_verified">
                                    All verified users
                                </option>
                            </select>

                            {form.errors.target && (
                                <p className="mt-1 text-sm text-red-600">
                                    {form.errors.target}
                                </p>
                            )}
                        </div>

                        {form.data.target === 'manual' && (
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Mobile number
                                </label>

                                <input
                                    id="phone"
                                    type="tel"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                    placeholder="+639XXXXXXXXX"
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />

                                {form.errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {form.errors.phone}
                                    </p>
                                )}
                            </div>
                        )}

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
                                    onChange={(e) =>
                                        form.setData('user_id', e.target.value)
                                    }
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                                >
                                    <option value="">
                                        Choose a verified user
                                    </option>

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

                                {users.length === 0 && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        No verified users are available.
                                    </p>
                                )}
                            </div>
                        )}

                        {form.data.target === 'all_verified' && (
                            <div className="rounded-md border p-3 text-sm">
                                This will send to all {users.length} verified
                                user(s) currently listed. The server checks
                                the recipient list again when sending.
                            </div>
                        )}

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label
                                    htmlFor="message"
                                    className="text-sm font-medium"
                                >
                                    Message
                                </label>

                                <span className="text-xs text-muted-foreground">
                                    {form.data.message.length}/1000
                                </span>
                            </div>

                            <textarea
                                id="message"
                                rows={5}
                                maxLength={1000}
                                value={form.data.message}
                                onChange={(e) =>
                                    form.setData('message', e.target.value)
                                }
                                placeholder="Type your SMS message..."
                                className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                            />

                            {form.errors.message && (
                                <p className="mt-1 text-sm text-red-600">
                                    {form.errors.message}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing ? 'Sending...' : 'Send SMS'}
                        </button>

                        <p className="text-xs text-muted-foreground">
                            Only send messages to recipients who have agreed
                            to receive them. API queueing does not guarantee
                            delivery to the handset.
                        </p>
                    </form>
                </section>

                <section className="rounded-xl border bg-card">
                    <div className="border-b p-5">
                        <h2 className="text-lg font-semibold">
                            SMS History
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Previous campaigns and SMS API results.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Target
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Message
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Recipients
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Queued
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Failed
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {messages.data.map((item) => (
                                    <tr key={item.id}>
                                        <td className="whitespace-nowrap px-4 py-3">
                                            {new Date(
                                                item.created_at,
                                            ).toLocaleString()}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-3">
                                            {item.target === 'all_verified'
                                                ? 'All verified'
                                                : item.target === 'user'
                                                  ? 'Selected user'
                                                  : 'Manual number'}
                                        </td>

                                        <td className="max-w-xs px-4 py-3">
                                            <p className="line-clamp-3">
                                                {item.message}
                                            </p>
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.recipient_count}
                                        </td>

                                        <td className="px-4 py-3 text-green-700">
                                            {item.queued_recipients_count}
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

                                {messages.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-muted-foreground"
                                        >
                                            No SMS messages sent yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t p-4">
                        <span className="text-sm text-muted-foreground">
                            Page {messages.current_page} of {messages.last_page}
                        </span>

                        <div className="flex gap-2">
                            {messages.prev_page_url && (
                                <a
                                    href={messages.prev_page_url}
                                    className="rounded-md border px-3 py-2 text-sm"
                                >
                                    Previous
                                </a>
                            )}

                            {messages.next_page_url && (
                                <a
                                    href={messages.next_page_url}
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
