<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Support\ApiResponse;
use App\Support\JsonContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingController extends Controller
{
    public function show(): JsonResponse
    {
        return ApiResponse::success(Setting::site()->data, 'Settings');
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],
            'data.brandName' => ['nullable', 'string', 'max:120'],
            'data.tagline' => ['nullable', 'string', 'max:160'],
            'data.phoneDisplay' => ['nullable', 'string', 'max:40'],
            'data.phoneNumber' => ['nullable', 'string', 'max:40'],
            'data.email' => ['nullable', 'string', 'email', 'max:160'],
            'data.whatsappNumber' => ['nullable', 'string', 'max:40'],
            'data.whatsappMessage' => ['nullable', 'string', 'max:300'],
            'data.address' => ['nullable', 'string', 'max:300'],
            'data.hours' => ['nullable', 'string', 'max:200'],
            'data.footerBlurb' => ['nullable', 'string', 'max:500'],
            'data.disclaimer' => ['nullable', 'string', 'max:2000'],
            'data.crisisBar' => ['nullable', 'array'],
            'data.crisisBar.enabled' => ['boolean'],
            'data.crisisBar.title' => ['nullable', 'string', 'max:120'],
            'data.crisisBar.text' => ['nullable', 'string', 'max:200'],
            'data.pricing' => ['nullable', 'array'],
            'data.pricing.currency' => ['nullable', 'string', 'size:3'],
            'data.pricing.consultationPrice' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'data.pricing.consultationMinutes' => ['nullable', 'integer', 'min:5', 'max:600'],
            'data.pricing.trainingPrice' => ['nullable', 'numeric', 'min:0', 'max:100000'],
            'data.integrations' => ['nullable', 'array'],
            'data.integrations.gaMeasurementId' => ['nullable', 'string', 'regex:/^G-[A-Z0-9]{4,20}$/'],
            'data.integrations.spotifyShowUrl' => ['nullable', 'url', 'max:400', 'regex:#^https://open\.spotify\.com/#'],
            'data.social' => ['nullable', 'array'],
            'data.social.*' => ['nullable', 'url', 'max:300'],
        ]);

        $setting = Setting::site();
        // Merge over existing so partial updates keep other keys intact.
        $setting->update(['data' => array_replace_recursive($setting->data, JsonContent::restoreEmptyStrings($validated['data']))]);

        return ApiResponse::success($setting->data, 'Settings updated');
    }
}
