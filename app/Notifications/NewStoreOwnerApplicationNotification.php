<?php

namespace App\Notifications;

use App\Models\StoreOwnerApplication;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewStoreOwnerApplicationNotification extends Notification
{
    use Queueable;

    public function __construct(
        public StoreOwnerApplication $application
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'new_store_owner_application',
            'title' => 'New Store Owner Application',
            'message' => $this->application->business_name
                . ' has submitted a store owner application.',
            'application_id' => $this->application->id,
            'business_name' => $this->application->business_name,
            'business_type' => $this->application->business_type,
            'status' => $this->application->status,
            'url' => '/admin/applications',
        ];
    }
}
