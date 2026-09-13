<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PodcastEpisode;
use App\Support\ApiResponse;
use App\Support\SiteBundle;
use Illuminate\Http\JsonResponse;

class HomeController extends Controller
{
    /** Settings + home page content + visible collections, in one payload. */
    public function show(): JsonResponse
    {
        return ApiResponse::success(SiteBundle::home(), 'Home');
    }

    /** All visible podcast episodes, newest first. */
    public function podcast(): JsonResponse
    {
        $episodes = PodcastEpisode::query()->visible()
            ->orderByDesc('published_at')->orderByDesc('id')->get();

        return ApiResponse::success($episodes, 'Podcast episodes');
    }
}
