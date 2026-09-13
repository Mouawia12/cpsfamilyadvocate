<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Article extends Model
{
    protected $fillable = [
        'category_id', 'title', 'slug', 'image_url', 'seo_title', 'excerpt', 'body', 'meta_description',
        'focus_keywords', 'read_time', 'author', 'faqs', 'status', 'featured', 'published_at',
    ];

    protected $casts = [
        'faqs' => 'array',
        'featured' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }
}
