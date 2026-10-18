<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use App\Models\FcmNotification;
use App\Models\User;
use App\Services\FCMService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FcmNotificationController extends Controller
{
    /**
     * Display the FCM composer and notification history.
     */
    public function index(): Response
    {
        $users = User::query()
            ->whereHas('deviceTokens', function ($query) {
                $query->whereNotNull('token')
                    ->where('token', '!=', '');
            })
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'phone',
            ]);

        $notifications = FcmNotification::query()
            ->withCount([
                'recipients as accepted_recipients_count' =>
                fn($query) => $query->where('status', 'accepted'),

                'recipients as failed_recipients_count' =>
                fn($query) => $query->where('status', 'failed'),
            ])
            ->latest()
            ->paginate(10);

        return Inertia::render('admin/fcm-notifications', [
            'users' => $users,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Send a notification to one user or all registered devices.
     */
    public function store(
        Request $request,
        FCMService $fcmService
    ): RedirectResponse {
        $validated = $request->validate([
            'target' => [
                'required',
                Rule::in(['user', 'all']),
            ],

            'user_id' => [
                'nullable',
                'required_if:target,user',
                'integer',
                Rule::exists('users', 'id'),
            ],

            'title' => [
                'required',
                'string',
                'max:150',
            ],

            'body' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        /*
         * Build the registered-device recipient query.
         */
        $tokensQuery = DeviceToken::query()
            ->whereNotNull('token')
            ->where('token', '!=', '');

        if ($validated['target'] === 'user') {
            $tokensQuery->where(
                'user_id',
                $validated['user_id']
            );
        }

        /*
         * Limit synchronous campaigns to 500 devices.
         * Fetch one extra row to detect an oversized campaign.
         */
        $tokens = $tokensQuery
            ->orderBy('id')
            ->limit(501)
            ->get([
                'id',
                'user_id',
                'token',
                'platform',
            ]);

        if ($tokens->isEmpty()) {
            return back()->withErrors([
                'target' => 'No registered FCM devices were found for this recipient.',
            ]);
        }

        if ($tokens->count() > 500) {
            return back()->withErrors([
                'target' => 'This campaign exceeds 500 devices. Use smaller batches or implement queued sending.',
            ]);
        }

        /*
         * Create the campaign and recipient history before sending.
         */
        $campaign = DB::transaction(function () use (
            $request,
            $validated,
            $tokens
        ) {
            $campaign = FcmNotification::create([
                'created_by' => $request
                    ->user('admin')
                    ?->getAuthIdentifier(),

                'target' => $validated['target'],
                'title' => $validated['title'],
                'body' => $validated['body'],

                'recipient_count' => $tokens->count(),
                'accepted_count' => 0,
                'failed_count' => 0,
                'status' => 'pending',
            ]);

            foreach ($tokens as $device) {
                $campaign->recipients()->create([
                    'user_id' => $device->user_id,
                    'device_token_id' => $device->id,
                    'platform' => $device->platform ?: 'android',
                    'status' => 'pending',
                ]);
            }

            return $campaign;
        });

        $accepted = 0;
        $failed = 0;

        /*
         * Send to each registered device using the existing FCMService.
         */
        $recipients = $campaign->recipients()
            ->with('deviceToken')
            ->orderBy('id')
            ->get();

        foreach ($recipients as $recipient) {
            $device = $recipient->deviceToken;

            if (! $device || ! $device->token) {
                $recipient->update([
                    'status' => 'failed',
                    'error' => 'Device token is no longer available.',
                ]);

                $failed++;

                continue;
            }

            $success = $fcmService->sendToToken(
                $device->token,
                $campaign->title,
                $campaign->body,
                [
                    'type' => 'admin_notification',
                    'notification_id' => (string) $campaign->id,
                ]
            );

            if ($success) {
                $recipient->update([
                    'status' => 'accepted',
                    'error' => null,
                ]);

                $device->update([
                    'last_used_at' => now(),
                ]);

                $accepted++;
            } else {
                $recipient->update([
                    'status' => 'failed',
                    'error' => 'FCMService did not confirm successful sending. Check Laravel logs.',
                ]);

                $failed++;
            }
        }

        /*
         * Update campaign totals and final status.
         */
        $campaign->update([
            'accepted_count' => $accepted,
            'failed_count' => $failed,

            'status' => match (true) {
                $failed === 0 => 'accepted',
                $accepted === 0 => 'failed',
                default => 'partial',
            },
        ]);

        if ($accepted > 0 && $failed > 0) {
            return redirect()
                ->route('admin.fcm-notifications.index')
                ->with(
                    'warning',
                    "Firebase accepted {$accepted} notification(s); {$failed} failed."
                );
        }

        if ($failed > 0) {
            return redirect()
                ->route('admin.fcm-notifications.index')
                ->with(
                    'error',
                    "All {$failed} notification attempt(s) failed. Check your Firebase configuration and Laravel logs."
                );
        }

        return redirect()
            ->route('admin.fcm-notifications.index')
            ->with(
                'success',
                "Firebase accepted {$accepted} notification(s)."
            );
    }
}
