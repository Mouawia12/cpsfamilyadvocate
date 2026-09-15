<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\PodcastEpisode;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    public function sitemap(): Response
    {
        $urls = [
            ['loc' => url('/'), 'changefreq' => 'weekly', 'priority' => '1.0'],
            ['loc' => url('/articles'), 'changefreq' => 'weekly', 'priority' => '0.8'],
        ];

        if (PodcastEpisode::query()->visible()->exists()) {
            $urls[] = ['loc' => url('/podcast'), 'changefreq' => 'weekly', 'priority' => '0.6'];
        }

        foreach (['privacy', 'terms', 'disclaimer'] as $key) {
            $urls[] = ['loc' => url('/'.$key), 'changefreq' => 'yearly', 'priority' => '0.2'];
        }

        Article::query()->published()->latest('updated_at')->get(['slug', 'updated_at'])
            ->each(function ($article) use (&$urls) {
                $urls[] = [
                    'loc' => url('/articles/'.$article->slug),
                    'lastmod' => $article->updated_at?->toDateString(),
                    'changefreq' => 'monthly',
                    'priority' => '0.7',
                ];
            });

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        foreach ($urls as $url) {
            $xml .= '  <url>';
            foreach ($url as $tag => $value) {
                if ($value) {
                    $xml .= "<{$tag}>".e($value)."</{$tag}>";
                }
            }
            $xml .= "</url>\n";
        }
        $xml .= '</urlset>';

        return response($xml, 200)->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    public function robots(): Response
    {
        if (! config('app.indexable')) {
            return response("User-agent: *\nDisallow: /\n", 200)->header('Content-Type', 'text/plain; charset=UTF-8');
        }

        $body = implode("\n", [
            'User-agent: *',
            'Disallow: /admin',
            'Disallow: /login',
            'Disallow: /checkout',
            'Disallow: /api/',
            '',
            'Sitemap: '.url('/sitemap.xml'),
            '',
        ]);

        return response($body, 200)->header('Content-Type', 'text/plain; charset=UTF-8');
    }
}
