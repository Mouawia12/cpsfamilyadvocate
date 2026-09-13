<?php

namespace App\Support;

use App\Http\Resources\ArticleCardResource;
use App\Models\Article;
use App\Models\Faq;
use App\Models\Page;
use App\Models\PodcastEpisode;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Testimonial;

/**
 * Everything the public home page renders, in one payload. Served by
 * GET /api/v1/home and inlined into index.html by routes/web.php so the first
 * paint needs no API round-trip.
 */
class SiteBundle
{
    public static function settings(): array
    {
        return Setting::site()->data;
    }

    public static function home(): array
    {
        $testimonials = Testimonial::query()->visible()->orderBy('sort_order')->orderBy('id')->get()
            ->groupBy('kind');

        return [
            'settings' => static::settings(),
            'page' => Page::where('key', 'home')->first()?->data ?? new \stdClass,
            'faqs' => Faq::query()->visible()->orderBy('sort_order')->orderBy('id')
                ->get(['id', 'question', 'answer']),
            'testimonials' => [
                'text' => $testimonials->get('text', collect())->values(),
                'video' => $testimonials->get('video', collect())->values(),
                'case_study' => $testimonials->get('case_study', collect())->values(),
            ],
            'products' => Product::query()->visible()->orderBy('sort_order')->orderBy('id')->get(),
            'episodes' => PodcastEpisode::query()->visible()->orderByDesc('published_at')->limit(3)->get(),
            'articles' => ArticleCardResource::collection(
                Article::query()->published()->with('category')->latest('published_at')->limit(3)->get()
            )->resolve(),
        ];
    }
}
