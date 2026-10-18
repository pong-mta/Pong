<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserLocation;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class UserLocationController extends Controller
{
    public function index(): Response
    {
        // Get the latest inserted location for each user.
        $latestLocationIds = DB::table('user_locations')
            ->selectRaw('MAX(id) as id')
            ->groupBy('user_id');

        $locations = UserLocation::query()
            ->whereIn('id', $latestLocationIds)
            ->with('user:id,name,phone')
            ->orderByDesc('recorded_at')
            ->get()
            ->map(fn(UserLocation $location) => [
                'id' => $location->id,
                'user_id' => $location->user_id,
                'name' => $location->user?->name ?? 'Unknown user',
                'phone' => $location->user?->phone,
                'latitude' => (float) $location->latitude,
                'longitude' => (float) $location->longitude,
                'accuracy' => $location->accuracy !== null
                    ? (float) $location->accuracy
                    : null,
                'recorded_at' => $location->recorded_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render('admin/user-locations', [
            'locations' => $locations,
        ]);
    }
}
