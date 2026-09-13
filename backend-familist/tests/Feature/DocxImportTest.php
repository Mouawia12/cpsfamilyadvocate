<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use ZipArchive;

class DocxImportTest extends TestCase
{
    use RefreshDatabase;

    /** A 1x1 transparent PNG. */
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
    }

    private function docx(): UploadedFile
    {
        $p = fn (string $style, string $runs, string $extra = '') => '<w:p><w:pPr>'.($style ? '<w:pStyle w:val="'.$style.'"/>' : '').$extra.'</w:pPr>'.$runs.'</w:p>';
        $t = fn (string $text, string $rPr = '') => '<w:r>'.($rPr ? "<w:rPr>{$rPr}</w:rPr>" : '').'<w:t xml:space="preserve">'.htmlspecialchars($text, ENT_XML1).'</w:t></w:r>';
        $bullet = '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>';

        $body = implode('', [
            $p('Author', $t('Dr. Test Author')),
            $p('Heading1', $t('Parent Rights')),
            $p('Heading2', $t('What To Do When CPS Calls')),
            $p('', $t('SEO details').$t('URL slug: ').$t('/when-cps-calls').$t('Meta description: ').$t('Steps to take when CPS contacts you.').$t('Focus keywords: ').$t('cps call, parent rights')),
            $p('', $t('Stay calm and ').$t('write everything down', '<w:b/>').$t('.')),
            $p('', '<w:r><w:drawing><a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" r:embed="rIdImg"/></w:drawing></w:r>'),
            $p('Heading3', $t('Checklist')),
            $p('', $t('Ask for the allegations'), $bullet),
            $p('', $t('Call an advocate'), $bullet),
            $p('Heading3', $t('Frequently asked questions')),
            $p('', $t('Do I have to let them in?')),
            $p('', $t('Not without a warrant or court order.')),
            $p('Heading2', $t('Second Article')),
            $p('', $t('Body text <script>alert(1)</script> is escaped.')),
        ]);

        $document = '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>'.$body.'</w:body></w:document>';
        $styles = '<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            .'<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>'
            .'<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style>'
            .'<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/></w:style></w:styles>';
        $numbering = '<?xml version="1.0"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            .'<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum>'
            .'<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>';
        $rels = '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            .'<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>';

        $path = tempnam(sys_get_temp_dir(), 'docx');
        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString('word/document.xml', $document);
        $zip->addFromString('word/styles.xml', $styles);
        $zip->addFromString('word/numbering.xml', $numbering);
        $zip->addFromString('word/_rels/document.xml.rels', $rels);
        $zip->addFromString('word/media/image1.png', base64_decode(self::PNG));
        $zip->close();

        return new UploadedFile($path, 'articles.docx', null, null, true);
    }

    public function test_dry_run_previews_without_writing(): void
    {
        $this->post('/api/v1/admin/import/docx', ['file' => $this->docx(), 'dry_run' => '1'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.author', 'Dr. Test Author')
            ->assertJsonCount(2, 'data.articles')
            ->assertJsonPath('data.articles.0.slug', 'when-cps-calls')
            ->assertJsonPath('data.articles.0.category', 'Parent Rights')
            ->assertJsonPath('data.articles.0.meta_description', 'Steps to take when CPS contacts you.')
            ->assertJsonPath('data.articles.0.focus_keywords', 'cps call, parent rights')
            ->assertJsonPath('data.articles.0.images', 1)
            ->assertJsonPath('data.articles.0.exists', false);

        $this->assertDatabaseCount('articles', 0);
        $this->assertEmpty(Storage::disk('public')->allFiles());
    }

    public function test_import_creates_articles_categories_and_images(): void
    {
        $this->post('/api/v1/admin/import/docx', ['file' => $this->docx(), 'status' => 'published'], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.created', 2)
            ->assertJsonPath('data.categories', 1);

        $article = Article::where('slug', 'when-cps-calls')->sole();
        $this->assertSame('Parent Rights', Category::find($article->category_id)->name);
        $this->assertSame('published', $article->status);
        $this->assertSame([['q' => 'Do I have to let them in?', 'a' => 'Not without a warrant or court order.']], $article->faqs);
        $this->assertStringContainsString('<strong>write everything down</strong>', $article->body);
        $this->assertStringContainsString('<ul><li>Ask for the allegations</li><li>Call an advocate</li></ul>', $article->body);
        $this->assertStringContainsString('<h2>Checklist</h2>', $article->body);
        $this->assertStringNotContainsString('Frequently asked', $article->body);
        $this->assertStringContainsString('/media/import/', $article->image_url);
        Storage::disk('public')->assertExists('media/import/'.basename($article->image_url));

        $second = Article::where('slug', 'second-article')->sole();
        $this->assertStringNotContainsString('<script>', $second->body);

        // Re-import skips existing slugs unless overwrite is requested.
        $this->post('/api/v1/admin/import/docx', ['file' => $this->docx()], ['Accept' => 'application/json'])
            ->assertJsonPath('data.skipped', 2);
        $this->post('/api/v1/admin/import/docx', ['file' => $this->docx(), 'overwrite' => '1'], ['Accept' => 'application/json'])
            ->assertJsonPath('data.updated', 2);
        $this->assertDatabaseCount('articles', 2);
    }

    public function test_rejects_non_docx_files(): void
    {
        $this->post('/api/v1/admin/import/docx', ['file' => UploadedFile::fake()->create('notes.pdf', 10)], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $fake = UploadedFile::fake()->createWithContent('broken.docx', 'not a zip');
        $this->post('/api/v1/admin/import/docx', ['file' => $fake], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }
}
