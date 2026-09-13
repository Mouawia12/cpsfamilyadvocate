<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /** Upload an image to public storage and return its absolute URL. */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:6144'],
        ]);

        $path = $request->file('file')->store('media', 'public');

        return ApiResponse::success([
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
        ], 'Uploaded');
    }
}
