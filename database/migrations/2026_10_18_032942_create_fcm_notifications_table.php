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
        Schema::create('fcm_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('target');
            $table->string('title', 150);
            $table->text('body');
            $table->unsignedInteger('recipient_count')->default(0);
            $table->unsignedInteger('accepted_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fcm_notifications');
    }
};
