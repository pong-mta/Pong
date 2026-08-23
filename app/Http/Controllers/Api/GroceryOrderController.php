<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryOrderController extends Controller
{
    /**
     * Get orders for a specific store owned by
     * the authenticated store owner.
     */
    public function index(
        Request $request
    ): JsonResponse {

        /*
    |--------------------------------------------------------------------------
    | VALIDATE STORE ID
    |--------------------------------------------------------------------------
    */

        $request->validate([
            'store_id' => [
                'required',
                'integer',
            ],
        ]);


        /*
    |--------------------------------------------------------------------------
    | FIND STORE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Make sure the authenticated user actually owns
    | the requested store.
    |
    */

        $store = \App\Models\Store::query()
            ->where(
                'id',
                $request->integer('store_id')
            )
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->first();


        /*
    |--------------------------------------------------------------------------
    | STORE NOT FOUND / NOT OWNER
    |--------------------------------------------------------------------------
    */

        if (!$store) {

            return response()->json([
                'success' => false,

                'message' =>
                'Store not found or you do not own this store.',
            ], 403);
        }


        /*
    |--------------------------------------------------------------------------
    | GET ORDERS FOR THIS STORE ONLY
    |--------------------------------------------------------------------------
    */

        $orders = Order::query()
            ->where(
                'store_id',
                $store->id
            )
            ->with([
                'store:id,name,slug,logo',
                'items',
            ])
            ->latest()
            ->get();


        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        return response()->json([

            'success' => true,


            /*
        |--------------------------------------------------------------------------
        | STORE
        |--------------------------------------------------------------------------
        */

            'store' => [

                'id' =>
                $store->id,

                'name' =>
                $store->name,

                'slug' =>
                $store->slug,

                'logo' =>
                $store->logo,
            ],


            /*
        |--------------------------------------------------------------------------
        | ORDERS
        |--------------------------------------------------------------------------
        */

            'orders' =>

            $orders->map(

                function ($order) {

                    return [

                        /*
                        |--------------------------------------------------------------------------
                        | ORDER
                        |--------------------------------------------------------------------------
                        */

                        'id' =>
                        $order->id,

                        'order_number' =>
                        $order->order_number,

                        'status' =>
                        $order->status,

                        'fulfillment_type' =>
                        $order->fulfillment_type,


                        /*
                        |--------------------------------------------------------------------------
                        | CUSTOMER
                        |--------------------------------------------------------------------------
                        |
                        | If your Order model has a `customer`
                        | relationship, this will work.
                        |
                        */

                        'customer' =>
                        $order->customer
                            ? [

                                'id' =>
                                $order
                                    ->customer
                                    ->id,

                                'name' =>
                                $order
                                    ->customer
                                    ->name,

                                'phone' =>
                                $order
                                    ->customer
                                    ->phone,

                            ]
                            : null,


                        /*
                        |--------------------------------------------------------------------------
                        | STORE
                        |--------------------------------------------------------------------------
                        */

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


                        /*
                        |--------------------------------------------------------------------------
                        | ITEMS
                        |--------------------------------------------------------------------------
                        */

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


                        /*
                        |--------------------------------------------------------------------------
                        | TOTALS
                        |--------------------------------------------------------------------------
                        */

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


                        /*
                        |--------------------------------------------------------------------------
                        | DELIVERY
                        |--------------------------------------------------------------------------
                        */

                        'delivery_address' =>
                        $order
                            ->delivery_address,

                        'delivery_latitude' =>
                        $order
                            ->delivery_latitude,

                        'delivery_longitude' =>
                        $order
                            ->delivery_longitude,


                        /*
                        |--------------------------------------------------------------------------
                        | NOTES
                        |--------------------------------------------------------------------------
                        */

                        'notes' =>
                        $order->notes,


                        /*
                        |--------------------------------------------------------------------------
                        | DATE
                        |--------------------------------------------------------------------------
                        */

                        'created_at' =>
                        $order->created_at,
                    ];
                }
            )
                ->values(),
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
