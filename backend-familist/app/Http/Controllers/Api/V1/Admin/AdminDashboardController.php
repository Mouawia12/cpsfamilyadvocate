<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Lead;
use App\Models\Order;
use App\Models\PodcastEpisode;
use App\Models\Testimonial;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return ApiResponse::success([
            'articles' => Article::count(),
            'published' => Article::where('status', 'published')->count(),
            'episodes' => PodcastEpisode::count(),
            'testimonialsVisible' => Testimonial::where('visible', true)->count(),
            'ordersPending' => Order::where('status', 'pending')->count(),
            'ordersPaid' => Order::where('status', 'paid')->count(),
            'revenue' => (float) Order::whereIn('status', ['paid', 'fulfilled'])->sum('amount'),
            'leads' => Lead::count(),
            'leadsThisWeek' => Lead::where('created_at', '>=', now()->subWeek())->count(),
            // Booleans only — never expose the keys themselves.
            'integrations' => [
                'stripe' => ! empty(config('services.stripe.secret')),
                'stripeWebhook' => ! empty(config('services.stripe.webhook_secret')),
                'mail' => ! in_array(config('mail.default'), ['log', 'array'], true),
            ],
            'recentOrders' => Order::latest('id')->limit(5)->get(['id', 'kind', 'name', 'amount', 'status', 'created_at']),
        ], 'Dashboard stats');
    }
}
