<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Store;
use App\Models\StoreOwnerApplication;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(): Response
    {
        $stats = [
            'totalUsers' => User::count(),
            'totalStores' => Store::count(),
            'pendingApplications' => StoreOwnerApplication::where(
                'status',
                'pending'
            )->count(),
            'totalAdmins' => Admin::count(),
            'approvedApplications' => StoreOwnerApplication::where(
                'status',
                'approved'
            )->count(),
            'rejectedApplications' => StoreOwnerApplication::where(
                'status',
                'rejected'
            )->count(),
        ];

        $recentApplications = StoreOwnerApplication::query()
            ->with('user:id,name,phone')
            ->latest()
            ->limit(8)
            ->get([
                'id',
                'user_id',
                'business_name',
                'business_type',
                'status',
                'created_at',
            ])
            ->map(fn(StoreOwnerApplication $application) => [
                'id' => $application->id,
                'business_name' => $application->business_name,
                'business_type' => $application->business_type,
                'status' => $application->status,
                'created_at' => $application->created_at,
                'user' => $application->user
                    ? [
                        'name' => $application->user->name,
                        'phone' => $application->user->phone,
                    ]
                    : null,
            ]);

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recentApplications' => $recentApplications,
            'lastUpdated' => now()->toIso8601String(),
        ]);
    }
}
