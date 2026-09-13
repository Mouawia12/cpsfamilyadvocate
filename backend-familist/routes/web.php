<?php

use App\Http\Controllers\Web\SitemapController;
use App\Http\Controllers\Web\SpaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * In production the built React SPA (dist/) is copied into public/ and Laravel
 * serves it from the same origin as /api/v1 (no CORS, no subdomain). Real asset
 * files are served directly by Apache; page routes below render the SPA shell
 * with server-side SEO tags and initial data (see SpaController).
 */

Route::get('sitemap.xml', [SitemapController::class, 'sitemap']);
Route::get('robots.txt', [SitemapController::class, 'robots']);

Route::get('/', [SpaController::class, 'home']);
Route::get('articles', [SpaController::class, 'articles']);
Route::get('articles/{slug}', [SpaController::class, 'article'])->where('slug', '[a-z0-9-]+');
Route::get('podcast', [SpaController::class, 'podcast']);
Route::get('{key}', [SpaController::class, 'legal'])->whereIn('key', ['privacy', 'terms', 'disclaimer']);

// App-only screens: shell without indexing.
Route::get('login', [SpaController::class, 'app']);
Route::get('admin/{any?}', [SpaController::class, 'app'])->where('any', '.*');
Route::get('checkout/{any}', [SpaController::class, 'app'])->whereIn('any', ['success', 'cancelled']);

Route::fallback(function (Request $request) {
    // Unknown API routes keep returning the JSON envelope, not the SPA shell.
    abort_if($request->is('api/*'), 404);

    return app(SpaController::class)->notFound();
});
