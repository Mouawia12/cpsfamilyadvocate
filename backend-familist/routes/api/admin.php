<?php

use App\Http\Controllers\Api\V1\Admin\AdminArticleController;
use App\Http\Controllers\Api\V1\Admin\AdminCategoryController;
use App\Http\Controllers\Api\V1\Admin\AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\AdminFaqController;
use App\Http\Controllers\Api\V1\Admin\AdminLeadController;
use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminPageController;
use App\Http\Controllers\Api\V1\Admin\AdminPodcastController;
use App\Http\Controllers\Api\V1\Admin\AdminProductController;
use App\Http\Controllers\Api\V1\Admin\AdminSettingController;
use App\Http\Controllers\Api\V1\Admin\AdminTestimonialController;
use App\Http\Controllers\Api\V1\Admin\DocxImportController;
use App\Http\Controllers\Api\V1\Admin\MediaController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
| Auth + admin (protected) endpoints. Loaded inside the /api/v1 group.
*/
Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:auth');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::put('auth/password', [AuthController::class, 'updatePassword']);

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('stats', [AdminDashboardController::class, 'stats']);

        Route::apiResource('articles', AdminArticleController::class)->except(['create', 'edit']);
        Route::apiResource('categories', AdminCategoryController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('import/docx', [DocxImportController::class, 'store']);

        Route::get('pages', [AdminPageController::class, 'index']);
        Route::get('pages/{page:key}', [AdminPageController::class, 'show']);
        Route::put('pages/{page:key}', [AdminPageController::class, 'update']);
        Route::post('media', [MediaController::class, 'store']);

        foreach ([
            'podcast' => AdminPodcastController::class,
            'testimonials' => AdminTestimonialController::class,
            'faqs' => AdminFaqController::class,
            'products' => AdminProductController::class,
        ] as $uri => $controller) {
            Route::get($uri, [$controller, 'index']);
            Route::post($uri, [$controller, 'store']);
            Route::put("{$uri}/{id}", [$controller, 'update'])->whereNumber('id');
            Route::delete("{$uri}/{id}", [$controller, 'destroy'])->whereNumber('id');
        }

        Route::get('orders', [AdminOrderController::class, 'index']);
        Route::put('orders/{order}', [AdminOrderController::class, 'update']);
        Route::get('leads', [AdminLeadController::class, 'index']);
        Route::get('leads/export', [AdminLeadController::class, 'export']);
        Route::delete('leads/{lead}', [AdminLeadController::class, 'destroy']);

        Route::get('settings', [AdminSettingController::class, 'show']);
        Route::put('settings', [AdminSettingController::class, 'update']);
    });
});
