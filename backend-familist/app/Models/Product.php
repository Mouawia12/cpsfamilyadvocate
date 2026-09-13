<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name', 'tagline', 'price', 'icon', 'image_url', 'status', 'buy_url', 'visible', 'sort_order',
    ];

    protected $casts = [
        'price' => 'float',
        'visible' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('visible', true);
    }
}
