<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Testimonial extends Model
{
    public const KINDS = ['text', 'video', 'case_study'];

    protected $fillable = [
        'kind', 'name', 'role', 'quote', 'rating', 'video_url', 'duration',
        'details', 'visible', 'sort_order',
    ];

    protected $casts = [
        'details' => 'array',
        'visible' => 'boolean',
        'rating' => 'integer',
        'sort_order' => 'integer',
    ];

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('visible', true);
    }
}
