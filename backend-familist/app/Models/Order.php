<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    public const KINDS = ['consultation', 'training'];

    protected $fillable = [
        'kind', 'name', 'email', 'phone', 'contact_method', 'amount', 'currency',
        'status', 'stripe_session_id', 'paid_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'paid_at' => 'datetime',
    ];

    public function label(): string
    {
        return $this->kind === 'training' ? 'CPS Crisis Training' : 'Urgent CPS Consultation';
    }
}
