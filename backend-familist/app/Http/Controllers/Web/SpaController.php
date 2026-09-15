<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\Faq;
use App\Models\Page;
use App\Models\PodcastEpisode;
use App\Support\SeoHead;
use App\Support\SiteBundle;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Serves the built React SPA (public/index.html) with per-route SEO tags,
 * crawlable HTML inside #root, and the initial data React hydrates from —
 * so search engines and link previews see real content without running JS.
 *
 * The shell must contain <!--seo--><!--/seo-->, <!--app--> and <!--state--> placeholders.
 */
class SpaController extends Controller
{
    public function home(): Response
    {
        $bundle = SiteBundle::home();
        $settings = $bundle['settings'];
        $page = (array) $bundle['page'];
        $seo = $page['seo'] ?? [];

        $head = $this->head($settings, $seo['title'] ?? $settings['brandName'], $seo['description'] ?? '', url('/'));
        $head->keywords = $seo['keywords'] ?? '';
        $head->image = $seo['ogImage'] ?? '';
        $head->addJsonLd($this->organization($settings));

        $faqs = Faq::query()->visible()->orderBy('sort_order')->get();
        if ($faqs->isNotEmpty()) {
            $head->addJsonLd([
                '@context' => 'https://schema.org',
                '@type' => 'FAQPage',
                'mainEntity' => $faqs->map(fn ($f) => [
                    '@type' => 'Question',
                    'name' => $f->question,
                    'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f->answer],
                ])->all(),
            ]);
        }

        $html = '<main><h1>'.e(($page['hero']['titleStart'] ?? '').' '.($page['hero']['titleEmphasis'] ?? '')).'</h1>'
            .'<p>'.e($page['hero']['lead'] ?? '').'</p>'
            .$faqs->map(fn ($f) => '<h3>'.e($f->question).'</h3><p>'.e($f->answer).'</p>')->implode('')
            .'</main>';

        return $this->shell($head, $html, ['home' => $bundle]);
    }

    public function articles(): Response
    {
        $settings = SiteBundle::settings();
        $articles = Article::query()->published()->latest('published_at')->limit(200)->get(['title', 'slug', 'excerpt']);

        $head = $this->head($settings, 'Articles | '.$settings['brandName'],
            'Articles on CPS processes, parent rights, case plans and reunification from '.$settings['brandName'].'.',
            url('/articles'));

        $html = '<main><h1>Articles</h1><ul>'.$articles->map(fn ($a) => '<li><a href="'.e(url('/articles/'.$a->slug)).'">'
            .e($a->title).'</a><p>'.e($a->excerpt).'</p></li>')->implode('').'</ul></main>';

        return $this->shell($head, $html, ['settings' => $settings]);
    }

    public function article(string $slug): Response
    {
        $article = Article::query()->published()->with('category')->where('slug', $slug)->first();
        if (! $article) {
            return $this->notFound();
        }

        $settings = SiteBundle::settings();
        $canonical = url('/articles/'.$article->slug);
        $head = $this->head($settings,
            ($article->seo_title ?: $article->title).' | '.$settings['brandName'],
            $article->meta_description ?: (string) $article->excerpt,
            $canonical);
        $head->type = 'article';
        $head->keywords = (string) $article->focus_keywords;
        $head->image = (string) $article->image_url;

        $head->addJsonLd(array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'Article',
            'headline' => $article->title,
            'description' => $article->meta_description ?: $article->excerpt,
            'image' => $article->image_url ?: null,
            'author' => $article->author ? ['@type' => 'Person', 'name' => $article->author] : null,
            'publisher' => ['@type' => 'Organization', 'name' => $settings['brandName']],
            'datePublished' => $article->published_at?->toIso8601String(),
            'dateModified' => $article->updated_at?->toIso8601String(),
            'mainEntityOfPage' => $canonical,
            'keywords' => $article->focus_keywords ?: null,
        ]));

        if (! empty($article->faqs)) {
            $head->addJsonLd([
                '@context' => 'https://schema.org',
                '@type' => 'FAQPage',
                'mainEntity' => collect($article->faqs)->map(fn ($f) => [
                    '@type' => 'Question',
                    'name' => $f['q'],
                    'acceptedAnswer' => ['@type' => 'Answer', 'text' => $f['a']],
                ])->all(),
            ]);
        }

        $html = '<main><article><h1>'.e($article->title).'</h1>'.$article->body.'</article></main>';

        return $this->shell($head, $html, [
            'settings' => $settings,
            'article' => (new ArticleResource($article))->resolve(),
        ]);
    }

    public function podcast(): Response
    {
        $settings = SiteBundle::settings();
        $episodes = PodcastEpisode::query()->visible()->orderByDesc('published_at')->get();

        $head = $this->head($settings, 'The Familist Podcast | '.$settings['brandName'],
            'Expert interviews, reunification success stories, and practical guidance for families.',
            url('/podcast'));

        $html = '<main><h1>The Familist Podcast</h1>'.$episodes->map(fn ($e) => '<h2>'.e($e->title).'</h2><p>'
            .e($e->description).'</p>')->implode('').'</main>';

        return $this->shell($head, $html, ['settings' => $settings, 'episodes' => $episodes]);
    }

    public function legal(string $key): Response
    {
        $page = Page::where('key', $key)->first();
        $settings = SiteBundle::settings();
        $data = $page?->data ?? [];

        $head = $this->head($settings, ($data['title'] ?? ucfirst($key)).' | '.$settings['brandName'], '', url('/'.$key));

        $html = '<main><h1>'.e($data['title'] ?? '').'</h1>'.($data['body'] ?? '').'</main>';

        return $this->shell($head, $html, ['settings' => $settings, 'page' => [$key => $data]]);
    }

    /** App-only routes (admin, login, checkout results): render the shell, never index. */
    public function app(Request $request): Response
    {
        $settings = SiteBundle::settings();
        $head = $this->head($settings, $settings['brandName'], '', url($request->path()));
        $head->index = false;

        return $this->shell($head, '', ['settings' => $settings]);
    }

    public function notFound(): Response
    {
        $settings = SiteBundle::settings();
        $head = $this->head($settings, 'Page not found | '.$settings['brandName'], '', '');
        $head->index = false;

        return $this->shell($head, '<main><h1>Page not found</h1></main>', ['settings' => $settings], 404);
    }

    private function head(array $settings, string $title, string $description, string $canonical): SeoHead
    {
        return new SeoHead(
            title: $title,
            description: $description,
            canonical: $canonical,
            index: (bool) config('app.indexable'),
            siteName: $settings['brandName'] ?? 'Familist',
        );
    }

    private function organization(array $settings): array
    {
        $lines = preg_split('/\r?\n/', (string) $settings['address']);
        $locality = $lines[1] ?? '';
        preg_match('/^(.*?),\s*([A-Z]{2})\s+(\d{5})/', $locality, $m);

        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'ProfessionalService',
            'name' => $settings['brandName'].' '.$settings['tagline'],
            'url' => url('/'),
            'telephone' => $settings['phoneNumber'],
            'email' => $settings['email'],
            'address' => $m ? [
                '@type' => 'PostalAddress',
                'streetAddress' => $lines[0],
                'addressLocality' => $m[1],
                'addressRegion' => $m[2],
                'postalCode' => $m[3],
                'addressCountry' => 'US',
            ] : null,
            'areaServed' => ['United States', 'Alaska', 'Ohio', 'Worldwide'],
            'knowsLanguage' => ['en', 'ar', 'es'],
            'openingHours' => $settings['hours'] ?: null,
            'sameAs' => array_values(array_filter($settings['social'] ?? [])) ?: null,
        ]);
    }

    private function shell(SeoHead $head, string $appHtml, array $state, int $status = 200): Response
    {
        $index = public_path('index.html');
        abort_unless(is_file($index), 503, 'Frontend build missing: run the frontend build and copy dist/ into public/.');

        $shell = file_get_contents($index);
        // The dev shell carries a fallback <title> between the SEO markers; drop it.
        $shell = preg_replace('/<!--seo-->.*?<!--\/seo-->/s', '<!--seo-->', $shell, 1);

        $html = str_replace(
            ['<!--seo-->', '<!--app-->', '<!--state-->'],
            [$head->render(), $appHtml, '<script nonce="'.SecurityHeaders::nonce().'">window.__FAMILIST__='.SeoHead::json($state).'</script>'],
            $shell,
        );

        return response($html, $status)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Cache-Control', 'no-cache');
    }
}
