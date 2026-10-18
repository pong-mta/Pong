<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FcmNotificationRecipient extends Model
{
    protected $fillable = [
        'fcm_notification_id',
        'user_id',
        'device_token_id',
        'platform',
        'status',
        'fcm_message_name',
        'error',
    ];

    public function notification(): BelongsTo
    {
        return $this->belongsTo(FcmNotification::class, 'fcm_notification_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function deviceToken(): BelongsTo
    {
        return $this->belongsTo(DeviceToken::class);
    }
}
