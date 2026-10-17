<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreOwnerApplication;
use App\Services\StoreOwnerApplicationNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StoreOwnerApplicationController extends Controller
{
    /**
     * Display store-owner applications.
     */
    public function index(): Response
    {
        $applications = StoreOwnerApplication::query()
            ->with('user:id,name,phone')
            ->latest()
            ->get([
                'id',
                'user_id',
                'business_name',
                'business_type',
                'description',
                'phone',
                'address',
                'latitude',
                'longitude',
                'status',
                'admin_notes',
                'created_at',
            ])
            ->map(fn($application) => [
                'id' => $application->id,
                'business_name' => $application->business_name,
                'business_type' => $application->business_type,
                'description' => $application->description,
                'phone' => $application->phone,
                'address' => $application->address,
                'latitude' => $application->latitude,
                'longitude' => $application->longitude,
                'status' => $application->status,
                'admin_notes' => $application->admin_notes,
                'created_at' => $application->created_at?->toIso8601String(),
                'user' => $application->user ? [
                    'id' => $application->user->id,
                    'name' => $application->user->name,
                    'phone' => $application->user->phone,
                ] : null,
            ])
            ->values();

        return Inertia::render('admin/applications', [
            'applications' => $applications,
        ]);
    }

    /**
     * Approve a pending application and create a store.
     */
    public function approve(
        StoreOwnerApplication $application,
        StoreOwnerApplicationNotificationService $notificationService
    ): RedirectResponse {
        $approvedApplication = DB::transaction(function () use ($application) {
            $application = StoreOwnerApplication::query()
                ->whereKey($application->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($application->status !== 'pending') {
                throw ValidationException::withMessages([
                    'application' => 'Only pending applications can be approved.',
                ]);
            }

            $application->load('user');
            $user = $application->user;

            if (!$user) {
                throw ValidationException::withMessages([
                    'application' => 'The applicant account could not be found.',
                ]);
            }

            $roleId = DB::table('roles')
                ->where('name', 'store_owner')
                ->value('id');

            if (!$roleId) {
                throw ValidationException::withMessages([
                    'application' => 'The store_owner role does not exist.',
                ]);
            }

            // Add the role without removing the user's existing roles.
            $user->roles()->syncWithoutDetaching([(int) $roleId]);

            // Generate a unique slug for this store.
            $baseSlug = Str::slug($application->business_name) ?: 'store';
            $slug = $baseSlug;
            $counter = 2;

            while (Store::where('slug', $slug)->exists()) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }

            Store::create([
                'owner_id' => $user->id,
                'name' => $application->business_name,
                'business_type' => $application->business_type,
                'slug' => $slug,
                'description' => $application->description,
                'phone' => $application->phone,
                'address' => $application->address,
                'latitude' => $application->latitude,
                'longitude' => $application->longitude,
                'is_active' => true,
            ]);

            $application->update([
                'status' => 'approved',
                'reviewed_at' => now(),
                'admin_notes' => null,
            ]);

            return $application->fresh(['user']);
        });

        // Keep a successful approval even if notification delivery fails.
        try {
            $notificationService->approved($approvedApplication);
        } catch (\Throwable $e) {
            Log::error('Store-owner approval notification failed.', [
                'application_id' => $approvedApplication->id,
                'error' => $e->getMessage(),
            ]);
        }

        return back()->with(
            'success',
            'Application approved and store created successfully.'
        );
    }

    /**
     * Reject a pending application.
     */
    public function reject(
        Request $request,
        StoreOwnerApplication $application
    ): RedirectResponse {
        $validated = $request->validate([
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $updated = DB::transaction(function () use ($application, $validated) {
            $application = StoreOwnerApplication::query()
                ->whereKey($application->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($application->status !== 'pending') {
                throw ValidationException::withMessages([
                    'application' => 'Only pending applications can be rejected.',
                ]);
            }

            $application->update([
                'status' => 'rejected',
                'admin_notes' => $validated['admin_notes'] ?? null,
                'reviewed_at' => now(),
            ]);

            return true;
        });

        return back()->with('success', 'Application rejected.');
    }
}
