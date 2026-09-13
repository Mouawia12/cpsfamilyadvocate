<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Support\ApiResponse;
use App\Support\JsonContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminPageController extends Controller
{
    public function index(): JsonResponse
    {
        $pages = Page::query()->orderBy('name')->get(['id', 'key', 'name']);

        return ApiResponse::success($pages, 'Pages');
    }

    public function show(Page $page): JsonResponse
    {
        return ApiResponse::success([
            'key' => $page->key,
            'name' => $page->name,
            'data' => $page->data ?? new \stdClass,
        ], 'Page');
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $data = $request->validate([
            'data' => ['required', 'array'],
        ]);

        $page->update(['data' => JsonContent::restoreEmptyStrings($data['data'])]);

        return ApiResponse::success([
            'key' => $page->key,
            'name' => $page->name,
            'data' => $page->data,
        ], 'Page updated');
    }
}
