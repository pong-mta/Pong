<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryOrderController extends Controller
{
    /**
     * Get the authenticated user's grocery orders.
     */
    public function index(
        Request $request
    ): JsonResponse {
        $orders = Order::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->with([
                'store:id,name,slug,logo',
                'items',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,

            'orders' => $orders->map(
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
            )->values(),
        ]);
    }


    /**
     * Get one order belonging to the
     * authenticated user.
     */
    public function show(
        Request $request,
        Order $order
    ): JsonResponse {

        /*
         * IMPORTANT:
         *
         * Never allow a customer to view
         * another customer's order.
         */
        if (
            (int) $order->user_id
            !==
            (int) $request->user()->id
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                'Order not found.',
            ], 404);
        }


        $order->load([
            'store:id,name,slug,logo',
            'items',
        ]);


        return response()->json([
            'success' => true,

            'order' => [
                'id' =>
                $order->id,

                'order_number' =>
                $order->order_number,

                'status' =>
                $order->status,

                'fulfillment_type' =>
                $order->fulfillment_type,

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
            ],
        ]);
    }
}
