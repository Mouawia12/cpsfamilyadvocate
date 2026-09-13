<?php

namespace Tests\Feature;

use App\Models\Article;
use Database\Seeders\ContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpaShellTest extends TestCase
{
    use RefreshDatabase;

    private string $index;

    private ?string $backup = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->index = public_path('index.html');
        $this->backup = is_file($this->index) ? file_get_contents($this->index) : null;
        file_put_contents($this->index, '<html><head><!--seo--><title>Dev</title><!--/seo--></head><body><div id="root"><!--app--></div><!--state--></body></html>');
        $this->seed(ContentSeeder::class);
    }

    protected function tearDown(): void
    {
        $this->backup === null ? @unlink($this->index) : file_put_contents($this->index, $this->backup);
        parent::tearDown();
    }

    public function test_home_injects_seo_json_ld_and_initial_state(): void
    {
        $html = $this->get('/')->assertOk()->getContent();

        $this->assertStringContainsString('<title>Familist | CPS Family Advocate', $html);
        $this->assertStringContainsString('"@type":"ProfessionalService"', $html);
        $this->assertStringContainsString('"@type":"FAQPage"', $html);
        $this->assertStringContainsString('<link rel="canonical"', $html);
        $this->assertStringContainsString('window.__FAMILIST__=', $html);

        // The inline state script carries the nonce that the CSP header allows.
        $csp = $this->get('/')->headers->get('Content-Security-Policy');
        preg_match("/'nonce-([^']+)'/", $csp, $m);
        $this->assertNotEmpty($m);
        $this->assertMatchesRegularExpression('/<script nonce="[^"]+">window.__FAMILIST__=/', $html);
        $this->assertStringContainsString('frame-src https://open.spotify.com', $csp);
        $this->assertStringNotContainsString('<title>Dev</title>', $html);
        $this->assertSame(1, substr_count($html, '<title>'));
    }

    public function test_article_pages_render_content_and_escape_state(): void
    {
        Article::create([
            'title' => 'Rights </script><script>alert(1)</script>', 'slug' => 'rights',
            'body' => '<p>Body copy</p>', 'meta_description' => 'Desc', 'status' => 'published', 'published_at' => now(),
        ]);

        $html = $this->get('/articles/rights')->assertOk()->getContent();
        $this->assertStringContainsString('<p>Body copy</p>', $html);
        $this->assertStringContainsString('"@type":"Article"', $html);
        $this->assertStringNotContainsString('</script><script>alert(1)', $html);

        $this->get('/articles/missing')->assertNotFound();
        $this->get('/no-such-page')->assertNotFound();
        $this->getJson('/api/v1/nope')->assertNotFound()->assertJsonPath('success', false);
    }

    public function test_admin_shell_is_not_indexed_and_sitemap_lists_articles(): void
    {
        $this->get('/admin/articles')->assertOk()->assertSee('noindex, nofollow', false);

        Article::create(['title' => 'Listed', 'slug' => 'listed', 'status' => 'published', 'published_at' => now()]);
        Article::create(['title' => 'Draft', 'slug' => 'draft-one', 'status' => 'draft']);

        $this->get('/sitemap.xml')->assertOk()
            ->assertSee('/articles/listed', false)
            ->assertDontSee('/articles/draft-one', false);
        $this->get('/robots.txt')->assertOk()->assertSee('Disallow: /admin');
    }
}
