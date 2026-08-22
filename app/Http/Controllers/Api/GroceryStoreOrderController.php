<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Services\GroceryOrderNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroceryStoreOrderController extends Controller
{
    /**
     * Get orders belonging to stores owned by
     * the authenticated user.
     */
    public function index(
        Request $request
    ): JsonResponse {

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | GET STORE IDs OWNED BY USER
        |--------------------------------------------------------------------------
        */

        $storeIds = Store::query()
            ->where(
                'owner_id',
                $user->id
            )
            ->pluck('id');

        /*
        |--------------------------------------------------------------------------
        | GET ORDERS
        |--------------------------------------------------------------------------
        */

        $orders = Order::query()
            ->whereIn(
                'store_id',
                $storeIds
            )
            ->with([
                'store:id,name,slug,logo',
                'user:id,name,phone',
                'items',
            ])
            ->latest()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | RETURN ORDERS
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'orders' =>
            $orders->map(
                function ($order) {

                    return [
                        'id' =>
                        $order->id,

                        'order_number' =>
                        $order->order_number,

                        'status' =>
                        $order->status,

                        'fulfillment_type' =>
                        $order->fulfillment_type,

                        'customer' =>
                        $order->user
                            ? [
                                'id' =>
                                $order
                                    ->user
                                    ->id,

                                'name' =>
                                $order
                                    ->user
                                    ->name,

                                'phone' =>
                                $order
                                    ->user
                                    ->phone,
                            ]
                            : null,

                        'store' =>
                        $order->store
                            ? [
                                'id' =>
                                $order
                                    ->store
                                    ->id,

                                'name' =>
                                $order
                                    ->store
                                    ->name,

                                'slug' =>
                                $order
                                    ->store
                                    ->slug,

                                'logo' =>
                                $order
                                    ->store
                                    ->logo,
                            ]
                            : null,

                        'items' =>
                        $order
                            ->items
                            ->map(
                                function ($item) {

                                    return [
                                        'id' =>
                                        $item->id,

                                        'product_variant_id' =>
                                        $item
                                            ->product_variant_id,

                                        'product_name' =>
                                        $item
                                            ->product_name,

                                        'variant_name' =>
                                        $item
                                            ->variant_name,

                                        'sku' =>
                                        $item->sku,

                                        'quantity' =>
                                        $item
                                            ->quantity,

                                        'unit_price' =>
                                        number_format(
                                            (float)
                                            $item
                                                ->unit_price,
                                            2,
                                            '.',
                                            ''
                                        ),

                                        'subtotal' =>
                                        number_format(
                                            (float)
                                            $item
                                                ->subtotal,
                                            2,
                                            '.',
                                            ''
                                        ),
                                    ];
                                }
                            )
                            ->values(),

                        'subtotal' =>
                        number_format(
                            (float)
                            $order->subtotal,
                            2,
                            '.',
                            ''
                        ),

                        'delivery_fee' =>
                        number_format(
                            (float)
                            $order->delivery_fee,
                            2,
                            '.',
                            ''
                        ),

                        'total' =>
                        number_format(
                            (float)
                            $order->total,
                            2,
                            '.',
                            ''
                        ),

                        'delivery_address' =>
                        $order
                            ->delivery_address,

                        'delivery_latitude' =>
                        $order
                            ->delivery_latitude,

                        'delivery_longitude' =>
                        $order
                            ->delivery_longitude,

                        'notes' =>
                        $order->notes,

                        'created_at' =>
                        $order->created_at,
                    ];
                }
            )
                ->values(),
        ]);
    }


    /**
     * Update the status of a grocery order.
     *
     * Only the owner of the store associated
     * with the order may update its status.
     */
    public function updateStatus(
        Request $request,
        Order $order,
        GroceryOrderNotificationService $notificationService
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | VALIDATE STATUS
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                'in:pending,confirmed,preparing,ready,out_for_delivery,delivered,cancelled',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | GET AUTHENTICATED USER
        |--------------------------------------------------------------------------
        */

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | FIND STORE
        |--------------------------------------------------------------------------
        */

        $store = Store::query()
            ->where(
                'id',
                $order->store_id
            )
            ->where(
                'owner_id',
                $user->id
            )
            ->first();

        /*
        |--------------------------------------------------------------------------
        | STORE OWNER CHECK
        |--------------------------------------------------------------------------
        */

        if (!$store) {

            return response()->json([
                'success' => false,
                'message' =>
                'You are not authorized to update this order.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | OLD STATUS
        |--------------------------------------------------------------------------
        */

        $oldStatus =
            $order->status;

        $newStatus =
            $validated['status'];

        /*
        |--------------------------------------------------------------------------
        | NO CHANGE
        |--------------------------------------------------------------------------
        */

        if (
            $oldStatus ===
            $newStatus
        ) {

            return response()->json([
                'success' => true,
                'message' =>
                'Order status is already ' .
                    $newStatus . '.',

                'order' => [
                    'id' =>
                    $order->id,

                    'order_number' =>
                    $order->order_number,

                    'status' =>
                    $order->status,
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE ORDER
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $order,
                $newStatus
            ) {

                $order->update([
                    'status' =>
                    $newStatus,
                ]);
            }
        );

        /*
        |--------------------------------------------------------------------------
        | REFRESH ORDER
        |--------------------------------------------------------------------------
        */

        $order->refresh();

        /*
        |--------------------------------------------------------------------------
        | SEND CUSTOMER NOTIFICATIONS
        |--------------------------------------------------------------------------
        */

        try {

            $notificationService
                ->statusChanged(
                    $order,
                    $oldStatus
                );
        } catch (\Throwable $e) {

            \Log::error(
                'GROCERY ORDER STATUS NOTIFICATION ERROR',
                [
                    'order_id' =>
                    $order->id,

                    'order_number' =>
                    $order->order_number,

                    'old_status' =>
                    $oldStatus,

                    'new_status' =>
                    $newStatus,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RETURN RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'message' =>
            'Order status updated successfully.',

            'order' => [
                'id' =>
                $order->id,

                'order_number' =>
                $order->order_number,

                'status' =>
                $order->status,
            ],
        ]);
    }
}
