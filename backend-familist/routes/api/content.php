<?php

use App\Http\Controllers\Api\V1\ArticleController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\HomeController;
use App\Http\Controllers\Api\V1\LeadController;
use App\Http\Controllers\Api\V1\PageController;
use App\Http\Controllers\Api\V1\SettingController;
use Illuminate\Support\Facades\Route;

/*
| Public endpoints. Loaded inside the /api/v1 group.
*/
Route::get('home', [HomeController::class, 'show']);
Route::get('podcast', [HomeController::class, 'podcast']);
Route::get('categories', [CategoryController::class, 'index']);
Route::get('articles', [ArticleController::class, 'index']);
Route::get('articles/{article:slug}', [ArticleController::class, 'show']);
Route::get('pages/{page:key}', [PageController::class, 'show']);
Route::get('settings', [SettingController::class, 'show']);

// Paid requests (consultation / training) → Stripe Checkout. Rate limited + honeypot.
Route::post('checkout', [CheckoutController::class, 'store'])->middleware('throttle:forms');
Route::get('checkout/{sessionId}', [CheckoutController::class, 'status'])->where('sessionId', 'cs_[A-Za-z0-9_]+');
Route::post('stripe/webhook', [CheckoutController::class, 'webhook'])->withoutMiddleware('throttle:api');

// Free guides / newsletter sign-ups.
Route::post('leads', [LeadController::class, 'store'])->middleware('throttle:forms');
