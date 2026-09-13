<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Support\ApiResponse;
use App\Support\Notify;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    /** Free-guide / newsletter sign-up. Stores contact data only. */
    public function store(Request $request): JsonResponse
    {
        if (filled($request->input('website'))) {
            return ApiResponse::success(null, 'Thank you');
        }

        $data = $request->validate([
            'first_name' => ['nullable', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:190'],
            'role' => ['nullable', Rule::in(['parent', 'caregiver', 'attorney', 'social_worker', 'other'])],
            'source' => ['nullable', Rule::in(['guides', 'exit_popup', 'newsletter'])],
        ]);

        $lead = Lead::create([...$data, 'source' => $data['source'] ?? 'guides']);

        Notify::team('New sign-up ('.$lead->source.')', [
            'Name' => $lead->first_name ?: '—',
            'Email' => $lead->email,
            'Role' => $lead->role ?: '—',
        ], $lead->email);

        return ApiResponse::success(null, 'Thank you', 201);
    }
}
