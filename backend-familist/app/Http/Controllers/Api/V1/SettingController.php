<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    /** Public site settings (contact info, brand, links). */
    public function show(): JsonResponse
    {
        return ApiResponse::success(Setting::site()->data, 'Settings');
    }
}
