<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class PodcastEpisode extends Model
{
    protected $fillable = [
        'title', 'episode_number', 'description', 'spotify_url', 'image_url',
        'duration', 'visible', 'published_at',
    ];

    protected $casts = [
        'visible' => 'boolean',
        'episode_number' => 'integer',
        'published_at' => 'datetime',
    ];

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('visible', true);
    }
}
