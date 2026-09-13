<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function show(Page $page): JsonResponse
    {
        return ApiResponse::success([
            'key' => $page->key,
            'name' => $page->name,
            'data' => $page->data ?? new \stdClass,
        ], 'Page');
    }
}
