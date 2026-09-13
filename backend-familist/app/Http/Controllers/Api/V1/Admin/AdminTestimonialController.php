<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Models\Testimonial;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminTestimonialController extends CrudController
{
    protected function model(): string
    {
        return Testimonial::class;
    }

    protected function query(Request $request): Builder
    {
        return Testimonial::query()
            ->when($request->query('kind'), fn ($q, $kind) => $q->where('kind', $kind))
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    protected function rules(Request $request): array
    {
        return [
            'kind' => ['required', Rule::in(Testimonial::KINDS)],
            'name' => ['required', 'string', 'max:160'],
            'role' => ['nullable', 'string', 'max:200'],
            'quote' => ['nullable', 'string', 'max:3000'],
            'rating' => ['nullable', 'integer', 'between:1,5'],
            'video_url' => ['nullable', 'url', 'max:500'],
            'duration' => ['nullable', 'string', 'max:20'],
            'details' => ['nullable', 'array'],
            'details.type' => ['nullable', 'string', 'max:120'],
            'details.title' => ['nullable', 'string', 'max:200'],
            'details.outcome' => ['nullable', 'string', 'max:60'],
            'details.challenge' => ['nullable', 'string', 'max:2000'],
            'details.approach' => ['nullable', 'string', 'max:2000'],
            'details.result' => ['nullable', 'string', 'max:2000'],
            'details.stats' => ['nullable', 'array', 'max:4'],
            'details.stats.*.value' => ['required', 'string', 'max:20'],
            'details.stats.*.label' => ['required', 'string', 'max:60'],
            'visible' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
