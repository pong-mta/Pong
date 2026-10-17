
import { Head, useForm } from '@inertiajs/react';
import { LogOut, ShieldCheck, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
    const { post, processing } = useForm({});

    const logout = () => {
        post(route('admin.logout'));
    };

    return (
        <>
            <Head title="PONG Admin Dashboard" />

            <div className="min-h-screen bg-muted/30">
                <header className="border-b bg-background">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
                                <ShieldCheck className="h-6 w-6" />
                            </div>

                            <div>
                                <h1 className="text-lg font-bold">
                                    PONG Administration
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Web administrator panel
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={logout}
                            disabled={processing}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </Button>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-6 py-10">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold tracking-tight">
                            Dashboard
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Welcome to the PONG web administration panel.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border bg-background p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold">
                                    Administrator access
                                </h3>
                                <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>

                            <p className="text-sm text-muted-foreground">
                                You are viewing the protected admin dashboard.
                                Only authenticated administrators can access
                                this page.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-background p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-semibold">
                                    Store management
                                </h3>
                                <Users className="h-5 w-5 text-primary" />
                            </div>

                            <p className="text-sm text-muted-foreground">
                                The store-owner application API routes are
                                registered. Their admin authorization and
                                interface will be handled separately.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-background p-6 shadow-sm">
                            <h3 className="mb-4 font-semibold">
                                Authentication status
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Web admin authentication uses the separate
                                admins table and admin session guard, without
                                replacing mobile user authentication.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
