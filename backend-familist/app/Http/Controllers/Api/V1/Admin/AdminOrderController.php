<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()->latest('id')
            ->when($request->query('kind'), fn ($q, $kind) => $q->where('kind', $kind))
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")));

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 25), 1), 100)));
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['pending', 'paid', 'cancelled', 'fulfilled'])],
        ]);

        $order->update([
            'status' => $data['status'],
            'paid_at' => $data['status'] === 'paid' ? ($order->paid_at ?? now()) : $order->paid_at,
        ]);

        return ApiResponse::success($order->fresh(), 'Order updated');
    }
}
