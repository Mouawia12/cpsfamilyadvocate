<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminProductController extends CrudController
{
    protected function model(): string
    {
        return Product::class;
    }

    protected function query(Request $request): Builder
    {
        return Product::query()->orderBy('sort_order')->orderBy('id');
    }

    protected function rules(Request $request): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'tagline' => ['nullable', 'string', 'max:200'],
            'price' => ['required', 'numeric', 'min:0', 'max:100000'],
            'icon' => ['nullable', Rule::in(['shirt', 'mug', 'book'])],
            'image_url' => ['nullable', 'string', 'max:500'],
            'status' => ['required', Rule::in(['coming_soon', 'available'])],
            'buy_url' => ['nullable', 'url', 'max:500'],
            'visible' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
