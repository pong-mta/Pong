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
        Schema::create('sms_message_recipients', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sms_message_id')
                ->constrained('sms_messages')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('phone');
            $table->string('status')->default('pending');
            $table->text('error')->nullable();
            $table->timestamps();

            $table->index(['sms_message_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_message_recipients');
    }
};
