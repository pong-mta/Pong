
import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface AdminLoginForm {
    email: string;
    password: string;
    remember: boolean;
}

export default function AdminLogin() {
    const { data, setData, post, processing, errors, reset } =
        useForm<AdminLoginForm>({
            email: '',
            password: '',
            remember: false,
        });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('admin.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="PONG Administrator"
            description="Sign in to the PONG web administration panel."
        >
            <Head title="Administrator Login" />

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="flex items-center gap-3 rounded-lg border p-4">
                    <ShieldCheck className="h-8 w-8 shrink-0 text-primary" />
                    <div>
                        <h2 className="font-semibold">Admin access</h2>
                        <p className="text-sm text-muted-foreground">
                            Use your administrator email and password.
                        </p>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="email">Administrator email</Label>
                    <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        autoFocus
                        required
                        value={data.email}
                        onChange={(event) =>
                            setData('email', event.target.value)
                        }
                        placeholder="admin@example.com"
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={data.password}
                        onChange={(event) =>
                            setData('password', event.target.value)
                        }
                        placeholder="Enter your admin password"
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center gap-3">
                    <Checkbox
                        id="remember"
                        checked={data.remember}
                        onCheckedChange={(checked) =>
                            setData('remember', checked === true)
                        }
                    />
                    <Label htmlFor="remember">Remember me</Label>
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={processing}
                >
                    {processing && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign in as administrator
                </Button>
            </form>
        </AuthLayout>
    );
}
