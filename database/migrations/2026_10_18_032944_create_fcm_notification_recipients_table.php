<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('fcm_notification_recipients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('fcm_notification_id')
                ->constrained('fcm_notifications')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('device_token_id')
                ->nullable()
                ->constrained('device_tokens')
                ->nullOnDelete();

            $table->string('platform', 20)->default('android');
            $table->string('status')->default('pending');
            $table->string('fcm_message_name')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index(['fcm_notification_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fcm_notification_recipients');
    }
};
