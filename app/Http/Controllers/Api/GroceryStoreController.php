<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreCategory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryStoreController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — STORES
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | GET /api/grocery/stores?business_type=grocery
    |
    | GET /api/grocery/stores?business_type=pharmacy
    |
    */

    public function index(
        Request $request
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | BUSINESS TYPE
        |--------------------------------------------------------------------------
        */

        $businessType =
            $request->query(
                'business_type'
            );


        /*
        |--------------------------------------------------------------------------
        | QUERY
        |--------------------------------------------------------------------------
        */

        $query =
            Store::query()
            ->where(
                'is_active',
                true
            );


        /*
        |--------------------------------------------------------------------------
        | FILTER BY BUSINESS TYPE
        |--------------------------------------------------------------------------
        |
        | Only apply the filter when supplied.
        |
        | This allows the endpoint to remain
        | backwards compatible while we update
        | the mobile app.
        |
        */

        if (
            $businessType !== null &&
            $businessType !== ''
        ) {

            $query->where(
                'business_type',
                $businessType
            );
        }


        /*
        |--------------------------------------------------------------------------
        | GET STORES
        |--------------------------------------------------------------------------
        */

        $stores =
            $query
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'name',
                'slug',
                'business_type',
                'description',
                'phone',
                'address',
                'latitude',
                'longitude',
                'logo',
            ]);


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' =>
            true,

            'business_type' =>
            $businessType,

            'stores' =>
            $stores,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — CATEGORIES
    |--------------------------------------------------------------------------
    */

    public function categories(
        int $store
    ): JsonResponse {

        $categories =
            StoreCategory::query()
            ->where(
                'store_id',
                $store
            )
            ->where(
                'is_active',
                true
            )
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'store_id',
                'name',
                'slug',
                'description',
                'image',
            ]);


        return response()->json([

            'success' =>
            true,

            'categories' =>
            $categories,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — PRODUCTS
    |--------------------------------------------------------------------------
    */

    public function products(
        int $store,
        int $category
    ): JsonResponse {

        $products =
            Product::query()
            ->where(
                'store_id',
                $store
            )
            ->where(
                'category_id',
                $category
            )
            ->where(
                'is_active',
                true
            )
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'store_id',
                'category_id',
                'name',
                'slug',
                'description',
                'image',
            ]);


        return response()->json([

            'success' =>
            true,

            'products' =>
            $products,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — VARIANTS
    |--------------------------------------------------------------------------
    */

    public function variants(
        int $product
    ): JsonResponse {

        $variants =
            ProductVariant::query()
            ->where(
                'product_id',
                $product
            )
            ->where(
                'is_active',
                true
            )
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'product_id',
                'name',
                'sku',
                'price',
                'stock',
                'image',
            ]);


        return response()->json([

            'success' =>
            true,

            'variants' =>
            $variants,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE OWNER — MY STORES
    |--------------------------------------------------------------------------
    */

    public function ownerStores(
        Request $request
    ): JsonResponse {

        $stores =
            Store::query()
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'name',
                'slug',
                'business_type',
                'description',
                'phone',
                'address',
                'latitude',
                'longitude',
                'logo',
                'is_active',
            ]);


        return response()->json([

            'success' =>
            true,

            'stores' =>
            $stores,

        ]);
    }
}
