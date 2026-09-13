<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Models\PodcastEpisode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class AdminPodcastController extends CrudController
{
    protected function model(): string
    {
        return PodcastEpisode::class;
    }

    protected function query(Request $request): Builder
    {
        return PodcastEpisode::query()->orderByDesc('published_at')->orderByDesc('id');
    }

    protected function rules(Request $request): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'episode_number' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string', 'max:5000'],
            'spotify_url' => ['nullable', 'url', 'max:500', 'regex:#^https://open\.spotify\.com/#'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'duration' => ['nullable', 'string', 'max:20'],
            'visible' => ['boolean'],
            'published_at' => ['nullable', 'date'],
        ];
    }
}
