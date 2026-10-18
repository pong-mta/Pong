
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminNotificationController extends Controller
{
    /**
     * Display the admin notifications index.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $admin = $request->user('admin');

        $notifications = $admin->notifications()
            ->latest()
            ->paginate(20)
            ->through(fn($notification) => [
                'id' => $notification->id,
                'data' => $notification->data,
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ]);

        $unreadCount = $admin->unreadNotifications()->count();

        // Preserve JSON responses for explicit API-style requests.
        if ($request->expectsJson()) {
            return response()->json([
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ]);
        }

        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
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
