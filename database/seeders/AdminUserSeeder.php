<?php

namespace Database\Seeders;


use App\Models\Admin;
use Illuminate\Database\Seeder;
use RuntimeException;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the PONG web administrator.
     */
    public function run(): void
    {
        $name = config('admin.initial_admin.name');
        $email = config('admin.initial_admin.email');
        $password = config('admin.initial_admin.password');

        if (blank($email) || blank($password)) {
            throw new RuntimeException(
                'Set PONG_ADMIN_EMAIL and PONG_ADMIN_PASSWORD in .env.'
            );
        }

        Admin::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name ?: 'PONG Administrator',
                'password' => $password,
                'is_active' => true,
            ]
        );

        $this->command?->info(
            "PONG web administrator verified: {$email}"
        );
    }
}
