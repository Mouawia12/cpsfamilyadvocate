<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Faq extends Model
{
    protected $fillable = ['question', 'answer', 'visible', 'sort_order'];

    protected $casts = [
        'visible' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeVisible(Builder $query): Builder
    {
        return $query->where('visible', true);
    }
}
