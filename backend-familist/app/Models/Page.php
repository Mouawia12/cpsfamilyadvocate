<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['key', 'name', 'data'];

    protected $casts = ['data' => 'array'];

    public function getRouteKeyName(): string
    {
        return 'key';
    }
}
