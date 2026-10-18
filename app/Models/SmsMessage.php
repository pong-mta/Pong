<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmsMessage extends Model
{
    protected $fillable = [
        'created_by',
        'target',
        'message',
        'recipient_count',
        'queued_count',
        'failed_count',
        'status',
    ];

    public function recipients(): HasMany
    {
        return $this->hasMany(SmsMessageRecipient::class);
    }
}
