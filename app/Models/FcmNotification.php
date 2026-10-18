<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FcmNotification extends Model
{
    protected $fillable = [
        'created_by',
        'target',
        'title',
        'body',
        'recipient_count',
        'accepted_count',
        'failed_count',
        'status',
    ];

    public function recipients(): HasMany
    {
        return $this->hasMany(FcmNotificationRecipient::class);
    }
}
