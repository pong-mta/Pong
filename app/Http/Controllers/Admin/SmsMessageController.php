<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmsMessage;
use App\Models\SmsMessageRecipient;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SmsMessageController extends Controller
{
    public function index(): Response
    {
        $messages = SmsMessage::query()
            ->withCount([
                'recipients as queued_recipients_count' =>
                fn($query) => $query->where('status', 'queued'),

                'recipients as failed_recipients_count' =>
                fn($query) => $query->where('status', 'failed'),
            ])
            ->latest()
            ->paginate(10);

        $users = User::query()
            ->where('phone_verified', true)
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        return Inertia::render('admin/sms-messages', [
            'messages' => $messages,
            'users' => $users,
        ]);
    }

    public function store(
        Request $request,
        SmsService $smsService
    ): RedirectResponse {
        $validated = $request->validate([
            'target' => [
                'required',
                Rule::in(['manual', 'user', 'all_verified']),
            ],

            'user_id' => [
                'nullable',
                'required_if:target,user',
                'integer',
                Rule::exists('users', 'id')
                    ->where('phone_verified', true),
            ],

            'phone' => [
                'nullable',
                'required_if:target,manual',
                'string',
                'max:30',
                'regex:/^\+?[0-9][0-9\s().-]{6,25}$/',
            ],

            'message' => [
                'required',
                'string',
                'max:1000',
            ],
        ]);

        $target = $validated['target'];

        if ($target === 'manual') {
            $phone = preg_replace(
                '/[^\d+]/',
                '',
                $validated['phone']
            );

            $recipients = collect([
                [
                    'user_id' => null,
                    'phone' => $phone,
                ],
            ]);
        } elseif ($target === 'user') {
            $user = User::query()
                ->where('phone_verified', true)
                ->findOrFail($validated['user_id']);

            $recipients = collect([
                [
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                ],
            ]);
        } else {
            $recipients = User::query()
                ->where('phone_verified', true)
                ->orderBy('id')
                ->get(['id', 'phone'])
                ->map(fn(User $user) => [
                    'user_id' => $user->id,
                    'phone' => $user->phone,
                ]);
        }

        if ($recipients->isEmpty()) {
            return back()->withErrors([
                'target' => 'There are no verified users to receive this SMS.',
            ]);
        }

        // Prevent large synchronous broadcasts from timing out.
        if ($recipients->count() > 500) {
            return back()->withErrors([
                'target' => 'This broadcast exceeds 500 recipients. Use smaller batches or implement queued sending.',
            ]);
        }

        $smsMessage = DB::transaction(function () use (
            $request,
            $validated,
            $target,
            $recipients
        ) {
            $message = SmsMessage::create([
                'created_by' => $request->user('admin')?->getAuthIdentifier(),
                'target' => $target,
                'message' => $validated['message'],
                'recipient_count' => $recipients->count(),
                'queued_count' => 0,
                'failed_count' => 0,
                'status' => 'pending',
            ]);

            foreach ($recipients as $recipient) {
                $message->recipients()->create([
                    'user_id' => $recipient['user_id'],
                    'phone' => $recipient['phone'],
                    'status' => 'pending',
                ]);
            }

            return $message;
        });

        $queued = 0;
        $failed = 0;

        foreach ($smsMessage->recipients()->orderBy('id')->get() as $recipient) {
            $success = $smsService->send(
                $recipient->phone,
                $smsMessage->message
            );

            if ($success) {
                $recipient->update([
                    'status' => 'queued',
                    'error' => null,
                ]);

                $queued++;
            } else {
                $recipient->update([
                    'status' => 'failed',
                    'error' => 'SMS provider did not confirm successful queueing.',
                ]);

                $failed++;
            }
        }

        $smsMessage->update([
            'queued_count' => $queued,
            'failed_count' => $failed,
            'status' => match (true) {
                $failed === 0 => 'queued',
                $queued === 0 => 'failed',
                default => 'partial',
            },
        ]);

        if ($failed > 0 && $queued > 0) {
            return redirect()
                ->route('admin.sms-messages.index')
                ->with('warning', "SMS processing finished: {$queued} queued, {$failed} failed.");
        }

        if ($failed > 0) {
            return redirect()
                ->route('admin.sms-messages.index')
                ->with('error', "All {$failed} SMS attempts failed. Check your SMS API configuration and logs.");
        }

        return redirect()
            ->route('admin.sms-messages.index')
            ->with('success', "SMS successfully queued for {$queued} recipient(s).");
    }
}
