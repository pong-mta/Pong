<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Services\FCMService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StoreController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                Rule::in(['all', 'active', 'inactive', 'deleted']),
            ],
        ]);

        $search = trim($validated['search'] ?? '');
        $status = $validated['status'] ?? 'all';

        $query = Store::query()
            ->with(['owner:id,name,phone'])
            ->when($status === 'deleted', function ($query) {
                $query->onlyTrashed();
            })
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
            ->when(
                $status === 'active',
                fn($query) => $query->where('is_active', true)
            )
            ->when(
                $status === 'inactive',
                fn($query) => $query->where('is_active', false)
            );

        $stores = $query
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Normal store counts exclude soft-deleted records.
        $counts = [
            'all' => Store::count(),
            'active' => Store::where('is_active', true)->count(),
            'inactive' => Store::where('is_active', false)->count(),
            'deleted' => Store::onlyTrashed()->count(),
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

    public function show(Store $store): Response
    {
        $store->load(['owner:id,name,phone,created_at']);

        return Inertia::render('admin/stores/show', [
            'store' => $store,
        ]);
    }

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

        // Notify only when changing from active to inactive.
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

    /**
     * Soft-delete a store while retaining its database records.
     */
    public function destroy(
        Store $store,
        FCMService $fcmService
    ): RedirectResponse {
        $storeId = $store->id;
        $storeName = $store->name;
        $ownerId = $store->owner_id;

        // Keep restored stores inactive for safety.
        $store->update(['is_active' => false]);

        // Sets deleted_at; does not physically remove the row.
        $store->delete();

        // Tell the owner the store has been removed from customer listings.
        if ($ownerId) {
            try {
                $sent = $fcmService->sendToUser(
                    (int) $ownerId,
                    'Store Removed',
                    "Your store \"{$storeName}\" has been removed from PONG by administration. It is hidden from customers. Please contact PONG administration if you believe this was a mistake.",
                    [
                        'type' => 'store_deleted',
                        'store_id' => (string) $storeId,
                        'store_name' => (string) $storeName,
                    ]
                );

                Log::info('PONG STORE DELETION NOTIFICATION', [
                    'store_id' => $storeId,
                    'owner_id' => $ownerId,
                    'devices_notified' => $sent,
                ]);
            } catch (Throwable $e) {
                // A notification failure must not undo the deletion.
                Log::error('PONG STORE DELETION NOTIFICATION FAILED', [
                    'store_id' => $storeId,
                    'owner_id' => $ownerId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return redirect()
            ->route('admin.stores.index')
            ->with(
                'success',
                "Store {$storeName} was removed. You can restore it from the Deleted filter."
            );
    }

    /**
     * Restore a soft-deleted store.
     * Restored stores remain inactive until an admin activates them.
     */
    public function restore(int $store): RedirectResponse
    {
        $deletedStore = Store::onlyTrashed()->findOrFail($store);

        $deletedStore->restore();

        $deletedStore->update([
            'is_active' => false,
        ]);

        return redirect()
            ->route('admin.stores.index', ['status' => 'deleted'])
            ->with(
                'success',
                "Store {$deletedStore->name} has been restored and remains inactive."
            );
    }
}
