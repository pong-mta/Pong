<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

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
            ->with([
                'owner:id,name,phone',
            ])
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
     * Activate or deactivate a store without deleting its data.
     */
    public function toggleStatus(Store $store): RedirectResponse
    {
        $store->update([
            'is_active' => ! $store->is_active,
        ]);

        $status = $store->is_active ? 'activated' : 'deactivated';

        return back()->with(
            'success',
            "Store {$store->name} has been {$status}."
        );
    }
}
