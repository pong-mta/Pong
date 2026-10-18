<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\FCMService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StoreController extends Controller
{
    /**
     * Display all stores with search and filters.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                Rule::in(['all', 'active', 'inactive']),
            ],
        ]);

        $search = trim($validated['search'] ?? '');
        $status = $validated['status'] ?? 'all';

        $stores = Store::query()
            ->with(['owner:id,name,phone'])
            ->withCount([])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhereHas('owner', function ($ownerQuery) use ($search) {
                            $ownerQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status === 'active', function ($query) {
                $query->where('is_active', true);
            })
            ->when($status === 'inactive', function ($query) {
                $query->where('is_active', false);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $counts = [
            'all' => Store::count(),
            'active' => Store::where('is_active', true)->count(),
            'inactive' => Store::where('is_active', false)->count(),
        ];

        return Inertia::render('admin/stores/index', [
            'stores' => $stores,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'counts' => $counts,
        ]);
    }

    /**
     * Display an individual store.
     */
    public function show(Store $store): Response
    {
        $store->load([
            'owner:id,name,phone,created_at',
        ]);

        return Inertia::render('admin/stores/show', [
            'store' => $store,
        ]);
    }

    /**
     * Activate or deactivate a store.
     *
     * Notify the owner only when the store changes
     * from active to inactive.
     */
    public function toggleStatus(
        Store $store,
        FCMService $fcmService
    ): RedirectResponse {
        $wasActive = (bool) $store->is_active;

        $store->update([
            'is_active' => ! $wasActive,
        ]);

        $store->refresh();

        $status = $store->is_active
            ? 'activated'
            : 'deactivated';

        /*
        |--------------------------------------------------------------------------
        | NOTIFY OWNER WHEN STORE IS DEACTIVATED
        |--------------------------------------------------------------------------
        */

        if (
            $wasActive &&
            ! $store->is_active &&
            $store->owner_id
        ) {
            try {
                $sent = $fcmService->sendToUser(
                    (int) $store->owner_id,
                    'Store Deactivated',
                    "Your store \"{$store->name}\" has been deactivated by PONG administration. It is no longer visible to customers and cannot receive new orders while inactive.",
                    [
                        'type' => 'store_deactivated',
                        'store_id' => (string) $store->id,
                        'store_name' => (string) $store->name,
                    ]
                );

                Log::info('PONG STORE DEACTIVATION NOTIFICATION', [
                    'store_id' => $store->id,
                    'owner_id' => $store->owner_id,
                    'devices_notified' => $sent,
                ]);

                if ($sent === 0) {
                    Log::warning(
                        'No device received the store deactivation notification.',
                        [
                            'store_id' => $store->id,
                            'owner_id' => $store->owner_id,
                        ]
                    );
                }
            } catch (Throwable $e) {
                // The store remains deactivated if notification delivery fails.
                Log::error(
                    'PONG STORE DEACTIVATION NOTIFICATION FAILED',
                    [
                        'store_id' => $store->id,
                        'owner_id' => $store->owner_id,
                        'error' => $e->getMessage(),
                    ]
                );
            }
        }

        return back()->with(
            'success',
            "Store {$store->name} has been {$status}."
        );
    }
}
