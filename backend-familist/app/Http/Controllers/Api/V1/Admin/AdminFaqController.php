<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Models\Faq;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AdminFaqController extends CrudController
{
    protected function model(): string
    {
        return Faq::class;
    }

    protected function query(Request $request): Builder
    {
        return Faq::query()->orderBy('sort_order')->orderBy('id');
    }

    protected function rules(Request $request): array
    {
        return [
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string', 'max:5000'],
            'visible' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
