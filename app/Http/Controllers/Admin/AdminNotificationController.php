<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class AdminNotificationController extends Controller
{
    /**
     * List notifications for the authenticated admin.
     */
    public function index(Request $request): JsonResponse
    {
        $admin = $request->user('admin');

        $notifications = $admin->notifications()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn($notification) => [
                'id' => $notification->id,
                'data' => $notification->data,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $admin->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark one notification as read.
     */
    public function markAsRead(
        Request $request,
        string $notification
    ): JsonResponse {
        $admin = $request->user('admin');

        $record = $admin->notifications()
            ->where('id', $notification)
            ->firstOrFail();

        $record->markAsRead();

        return response()->json([
            'success' => true,
            'unread_count' => $admin->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $admin = $request->user('admin');

        $admin->unreadNotifications()->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'unread_count' => 0,
        ]);
    }
}
