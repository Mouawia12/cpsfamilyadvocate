<?php

use App\Support\ApiResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (v1)
|--------------------------------------------------------------------------
| Convention: everything lives under /api/v1. Each domain module registers
| its own routes in a file under routes/api/, grouping auth + permission
| middleware itself. New modules are picked up automatically (sorted).
*/

Route::prefix('v1')->group(function () {
    Route::get('/health', fn () => ApiResponse::success([
        'status' => 'ok',
        'service' => 'familist-api',
        'time' => now()->toIso8601String(),
    ], 'Familist API is healthy'));

    foreach (glob(__DIR__.'/api/*.php') as $moduleRoutes) {
        require $moduleRoutes;
    }
});
