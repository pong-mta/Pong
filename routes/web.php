<?php

use App\Http\Controllers\Admin\Auth\AdminAuthenticatedSessionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\StoreOwnerApplicationController;
use App\Http\Controllers\Admin\UserLocationController as AdminUserLocationController;
use App\Http\Controllers\Admin\SmsMessageController;
use App\Http\Controllers\Admin\FcmNotificationController;
use App\Http\Controllers\Admin\StoreController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

/*
|--------------------------------------------------------------------------
| PONG Admin Authentication
|--------------------------------------------------------------------------
*/

Route::middleware('guest:admin')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [
        AdminAuthenticatedSessionController::class,
        'create',
    ])->name('login');

    Route::post('/login', [
        AdminAuthenticatedSessionController::class,
        'store',
    ])->middleware('throttle:5,1')->name('login.store');
});

Route::middleware('auth:admin')->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)
        ->name('dashboard');

    Route::post('/logout', [
        AdminAuthenticatedSessionController::class,
        'destroy',
    ])->name('logout');



    Route::get('/applications', [
        StoreOwnerApplicationController::class,
        'index',
    ])->name('applications.index');

    Route::post('/applications/{application}/approve', [
        StoreOwnerApplicationController::class,
        'approve',
    ])->name('applications.approve');

    Route::post('/applications/{application}/reject', [
        StoreOwnerApplicationController::class,
        'reject',
    ])->name('applications.reject');


    Route::get('/user-locations', [
        AdminUserLocationController::class,
        'index',
    ])->name('user-locations.index');

    Route::get('/sms-messages', [
        SmsMessageController::class,
        'index',
    ])->name('sms-messages.index');

    Route::post('/sms-messages', [
        SmsMessageController::class,
        'store',
    ])->middleware('throttle:10,1')->name('sms-messages.store');

    Route::get('/fcm-notifications', [
        FcmNotificationController::class,
        'index',
    ])->name('fcm-notifications.index');

    Route::post('/fcm-notifications', [
        FcmNotificationController::class,
        'store',
    ])->middleware('throttle:10,1')->name('fcm-notifications.store');

    Route::get('/stores', [StoreController::class, 'index'])
        ->name('stores.index');

    Route::get('/stores/{store}', [StoreController::class, 'show'])
        ->name('stores.show');

    Route::patch(
        '/stores/{store}/toggle-status',
        [StoreController::class, 'toggleStatus']
    )->name('stores.toggle-status');

    Route::delete('/stores/{store}', [StoreController::class, 'destroy'])
        ->name('stores.destroy');

    Route::patch('/stores/{store}/restore', [StoreController::class, 'restore'])
        ->name('stores.restore');
});

/*
|--------------------------------------------------------------------------
| Existing Regular Web Authentication
|--------------------------------------------------------------------------
*/

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
