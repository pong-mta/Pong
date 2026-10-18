
<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use App\Models\FcmNotification;
use App\Models\FcmNotificationRecipient;
use App\Models\User;
use App\Services\FcmService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FcmNotificationController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->whereHas('deviceTokens')
            ->whereHas('deviceTokens', function ($query) {
                $query->whereNotNull('token')->where('token', '!=', '');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

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

    public function store(
        Request $request,
        FcmService $fcmService
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
            'title' => ['required', 'string', 'max:150'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $tokensQuery = DeviceToken::query()
            ->whereNotNull('token')
            ->where('token', '!=', '');

        if ($validated['target'] === 'user') {
            $tokensQuery->where('user_id', $validated['user_id']);
        }

        $tokens = $tokensQuery
            ->with('user:id,name')
            ->orderBy('id')
            ->limit(501)
            ->get();

        if ($tokens->isEmpty()) {
            return back()->withErrors([
                'target' => 'No registered FCM devices were found for this recipient.',
            ]);
        }

        if ($tokens->count() > 500) {
            return back()->withErrors([
                'target' => 'This campaign has more than 500 devices. Send smaller batches or implement queue-based delivery.',
            ]);
        }

        $campaign = DB::transaction(function () use (
            $request,
            $validated,
            $tokens
        ) {
            $campaign = FcmNotification::create([
                'created_by' => $request->user('admin')?->getAuthIdentifier(),
                'target' => $validated['target'],
                'title' => $validated['title'],
                'body' => $validated['body'],
                'recipient_count' => $tokens->count(),
                'accepted_count' => 0,
                'failed_count' => 0,
                'status' => 'pending',
            ]);

            foreach ($tokens as $token) {
                $campaign->recipients()->create([
                    'user_id' => $token->user_id,
                    'device_token_id' => $token->id,
                    'platform' => $token->platform ?: 'android',
                    'status' => 'pending',
                ]);
            }

            return $campaign;
        });

        $accepted = 0;
        $failed = 0;

        $recipients = $campaign->recipients()
            ->with('deviceToken')
            ->orderBy('id')
            ->get();

        foreach ($recipients as $recipient) {
            $token = $recipient->deviceToken?->token;

            if (! $token) {
                $recipient->update([
                    'status' => 'failed',
                    'error' => 'Device token is no longer available.',
                ]);

                $failed++;
                continue;
            }

            $result = $fcmService->sendToToken(
                $token,
                $campaign->title,
                $campaign->body
            );

            if ($result['success']) {
                $recipient->update([
                    'status' => 'accepted',
                    'fcm_message_name' => $result['message_name'],
                    'error' => null,
                ]);

                $accepted++;
            } else {
                $recipient->update([
                    'status' => 'failed',
                    'error' => $result['error'],
                ]);

                $failed++;
            }
        }

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
                ->with('warning', "Firebase accepted {$accepted} notification(s); {$failed} failed.");
        }

        if ($failed > 0) {
            return redirect()
                ->route('admin.fcm-notifications.index')
                ->with('error', "All {$failed} notification attempt(s) failed. Check Laravel logs and Firebase credentials.");
        }

        return redirect()
            ->route('admin.fcm-notifications.index')
            ->with('success', "Firebase accepted {$accepted} notification(s).");
    }
}
