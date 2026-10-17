
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin/dashboard',
    },
];

export default function AdminDashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="PONG Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Dashboard summary cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border p-5">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total Users
                            </p>
                            <h2 className="mt-2 text-3xl font-bold">—</h2>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>

                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border p-5">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Store Owners
                            </p>
                            <h2 className="mt-2 text-3xl font-bold">—</h2>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>

                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col justify-between overflow-hidden rounded-xl border p-5">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Pending Applications
                            </p>
                            <h2 className="mt-2 text-3xl font-bold">—</h2>
                        </div>
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                    </div>
                </div>

                {/* Main dashboard area */}
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[60vh] flex-1 overflow-hidden rounded-xl border p-6">
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold">
                            Welcome to PONG Administration
                        </h1>

                        <p className="mt-2 text-muted-foreground">
                            Manage users, store owners, applications, and
                            other PONG platform operations from this panel.
                        </p>
                    </div>

                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                </div>
            </div>
        </AppLayout>
    );
}
