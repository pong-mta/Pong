<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Services\GroceryOrderNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GroceryCheckoutController extends Controller
{
    public function checkout(
        Request $request,
        GroceryOrderNotificationService $notificationService
    ): JsonResponse {

        $validated = $request->validate([
            'fulfillment_type' => [
                'required',
                'in:delivery,pickup',
            ],

            'delivery_address' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'delivery_latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'delivery_longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | DELIVERY VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
            $validated['fulfillment_type'] === 'delivery'
            &&
            empty($validated['delivery_address'])
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                'Delivery address is required.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE ORDER
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | FCM and SMS are NOT sent inside this transaction.
        |
        | First we make sure the order is successfully committed.
        | Only after that do we send notifications.
        |
        */

        $order = DB::transaction(
            function () use (
                $validated,
                $user
            ) {

                /*
                |--------------------------------------------------------------------------
                | FIND ACTIVE CART
                |--------------------------------------------------------------------------
                */

                $cart = Cart::query()
                    ->where(
                        'user_id',
                        $user->id
                    )
                    ->where(
                        'status',
                        'active'
                    )
                    ->with([
                        'store',
                        'items',
                    ])
                    ->lockForUpdate()
                    ->first();

                /*
                |--------------------------------------------------------------------------
                | NO CART
                |--------------------------------------------------------------------------
                */

                if (!$cart) {

                    throw new \RuntimeException(
                        'Your cart is empty.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | EMPTY CART
                |--------------------------------------------------------------------------
                */

                if (
                    $cart->items->isEmpty()
                ) {

                    throw new \RuntimeException(
                        'Your cart is empty.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | CHECK PRODUCTS / STOCK / PRICE
                |--------------------------------------------------------------------------
                */

                $subtotal = 0;

                $lockedItems = [];

                foreach (
                    $cart->items as $cartItem
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | LOCK PRODUCT VARIANT
                    |--------------------------------------------------------------------------
                    */

                    $variant =
                        $cartItem
                        ->productVariant()
                        ->with('product')
                        ->lockForUpdate()
                        ->first();

                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT DOES NOT EXIST
                    |--------------------------------------------------------------------------
                    */

                    if (!$variant) {

                        throw new \RuntimeException(
                            'A product in your cart no longer exists.'
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT MUST BE ACTIVE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        !$variant->is_active
                        ||
                        !$variant->product
                        ||
                        !$variant->product->is_active
                    ) {

                        throw new \RuntimeException(
                            "{$variant->name} is no longer available."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT MUST BELONG TO CART STORE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        (int)
                        $variant
                            ->product
                            ->store_id
                        !==
                        (int)
                        $cart->store_id
                    ) {

                        throw new \RuntimeException(
                            'A cart item does not belong to this store.'
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | STOCK CHECK
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $cartItem->quantity
                        >
                        $variant->stock
                    ) {

                        throw new \RuntimeException(
                            "{$variant->name} only has {$variant->stock} item(s) available."
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | USE CURRENT DATABASE PRICE
                    |--------------------------------------------------------------------------
                    */

                    $unitPrice =
                        (float)
                        $variant->price;

                    $quantity =
                        (int)
                        $cartItem->quantity;

                    $itemSubtotal =
                        $unitPrice *
                        $quantity;

                    $subtotal +=
                        $itemSubtotal;

                    $lockedItems[] = [
                        'variant' =>
                        $variant,

                        'quantity' =>
                        $quantity,

                        'unit_price' =>
                        $unitPrice,

                        'subtotal' =>
                        $itemSubtotal,
                    ];
                }

                /*
                |--------------------------------------------------------------------------
                | DELIVERY FEE
                |--------------------------------------------------------------------------
                */

                $deliveryFee = 0;

                $total =
                    $subtotal +
                    $deliveryFee;

                /*
                |--------------------------------------------------------------------------
                | GENERATE ORDER NUMBER
                |--------------------------------------------------------------------------
                */

                do {

                    $orderNumber =
                        'PONG-' .
                        now()->format(
                            'YmdHis'
                        ) .
                        '-' .
                        strtoupper(
                            Str::random(4)
                        );
                } while (
                    Order::where(
                        'order_number',
                        $orderNumber
                    )->exists()
                );

                /*
                |--------------------------------------------------------------------------
                | CREATE ORDER
                |--------------------------------------------------------------------------
                */

                $order = Order::create([
                    'user_id' =>
                    $user->id,

                    'store_id' =>
                    $cart->store_id,

                    'order_number' =>
                    $orderNumber,

                    'status' =>
                    'pending',

                    'fulfillment_type' =>
                    $validated['fulfillment_type'],

                    'subtotal' =>
                    $subtotal,

                    'delivery_fee' =>
                    $deliveryFee,

                    'total' =>
                    $total,

                    'delivery_address' =>
                    $validated['delivery_address'] ?? null,

                    'delivery_latitude' =>
                    $validated['delivery_latitude'] ?? null,

                    'delivery_longitude' =>
                    $validated['delivery_longitude'] ?? null,

                    'notes' =>
                    $validated['notes'] ?? null,
                ]);

                /*
                |--------------------------------------------------------------------------
                | CREATE ORDER ITEMS + DEDUCT STOCK
                |--------------------------------------------------------------------------
                */

                foreach (
                    $lockedItems as $data
                ) {

                    $variant =
                        $data['variant'];

                    $quantity =
                        $data['quantity'];

                    $unitPrice =
                        $data['unit_price'];

                    $itemSubtotal =
                        $data['subtotal'];

                    /*
                    |--------------------------------------------------------------------------
                    | ORDER ITEM
                    |--------------------------------------------------------------------------
                    */

                    $order->items()->create([
                        'product_variant_id' =>
                        $variant->id,

                        'product_name' =>
                        $variant
                            ->product
                            ->name,

                        'variant_name' =>
                        $variant->name,

                        'sku' =>
                        $variant->sku,

                        'quantity' =>
                        $quantity,

                        'unit_price' =>
                        $unitPrice,

                        'subtotal' =>
                        $itemSubtotal,
                    ]);

                    /*
                    |--------------------------------------------------------------------------
                    | STOCK
                    |--------------------------------------------------------------------------
                    */

                    $variant->decrement(
                        'stock',
                        $quantity
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | DELETE TEMPORARY CART
                |--------------------------------------------------------------------------
                */

                $cart->delete();

                /*
                |--------------------------------------------------------------------------
                | RETURN ORDER FROM TRANSACTION
                |--------------------------------------------------------------------------
                */

                return $order;
            }
        );

        /*
        |--------------------------------------------------------------------------
        | LOAD ORDER FOR RESPONSE + NOTIFICATIONS
        |--------------------------------------------------------------------------
        */

        $order->load([
            'user',
            'store:id,name,slug,logo',
            'items',
        ]);

        /*
        |--------------------------------------------------------------------------
        | SEND ORDER PLACED NOTIFICATIONS
        |--------------------------------------------------------------------------
        |
        | At this point the database transaction has already committed.
        |
        | Therefore:
        |
        | Order exists
        | Stock is deducted
        | Cart is deleted
        |
        | Now send:
        |
        | FCM
        | SMS
        |
        */

        try {

            $notificationService
                ->orderPlaced(
                    $order
                );
        } catch (\Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT:
            |--------------------------------------------------------------------------
            |
            | Notification failure must NOT make
            | a successful order look like a
            | failed checkout.
            |
            */

            \Log::error(
                'GROCERY ORDER NOTIFICATION ERROR',
                [
                    'order_id' =>
                    $order->id,

                    'order_number' =>
                    $order->order_number,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RETURN ORDER
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'message' =>
            'Order placed successfully.',

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
        ], 201);
    }
}
