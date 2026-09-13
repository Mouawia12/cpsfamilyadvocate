<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMXPath;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use ZipArchive;

/**
 * Turns a Word (.docx) article collection into article records.
 *
 * Expected shape (the level is detected, not hard-coded):
 *   Heading (category level)   e.g. "Couples & Relationships"
 *   Heading (article level)    e.g. "Can a Marriage Survive an Affair?"
 *   "SEO details" paragraph    URL slug: … Meta description: … Focus keywords: … Estimated read: …
 *   body paragraphs, sub-headings, bullet / numbered lists, links, images
 *   "Frequently asked questions" sub-heading → question / answer paragraphs
 *
 * The article level is the heading level that most often sits directly above a
 * SEO block; the level above it (if used) names the category.
 */
class DocxArticleImporter
{
    private const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    private const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

    private const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main';

    private const MAX_XML_BYTES = 60 * 1024 * 1024;

    private const SEO_LABELS = [
        'seo title' => 'seo_title', 'meta title' => 'seo_title',
        'url slug' => 'slug', 'slug' => 'slug',
        'meta description' => 'meta_description',
        'focus keywords' => 'focus_keywords', 'keywords' => 'focus_keywords',
        'estimated read' => 'read_time', 'read time' => 'read_time',
    ];

    private ZipArchive $zip;

    private DOMXPath $xpath;

    /** @var array<string, string> relationship id => target */
    private array $rels = [];

    /** @var array<string, int> style id => heading level (0 = title) */
    private array $headingStyles = [];

    /** @var array<string, bool> "numId:ilvl" => ordered? */
    private array $orderedLists = [];

    /** @var array<string, string> media path => public URL (per import) */
    private array $storedMedia = [];

    private bool $storeImages = false;

    /**
     * @return array{author: ?string, articles: list<array<string, mixed>>}
     */
    public function parse(string $path, bool $storeImages = false): array
    {
        $this->storeImages = $storeImages;
        $this->open($path);

        $blocks = $this->blocks();
        $articleLevel = $this->detectArticleLevel($blocks);

        $author = null;
        $category = null;
        $articles = [];
        $current = null;
        $faqMode = false;
        $list = null; // ['ordered' => bool, 'items' => []]

        $flushList = function () use (&$list, &$current) {
            if ($list && $current) {
                $tag = $list['ordered'] ? 'ol' : 'ul';
                $current['html'][] = "<{$tag}>".implode('', array_map(fn ($i) => "<li>{$i}</li>", $list['items']))."</{$tag}>";
            }
            $list = null;
        };

        foreach ($blocks as $block) {
            if ($block['style'] === 'Author' && ! $current) {
                $author = $block['text'];

                continue;
            }

            if ($block['heading'] !== null && $block['heading'] > 0) {
                $flushList();
                $level = $block['heading'];

                if ($level < $articleLevel) {
                    $category = $block['text'];
                    $faqMode = false;

                    continue;
                }

                if ($level === $articleLevel) {
                    if ($current) {
                        $articles[] = $this->finish($current);
                    }
                    $current = [
                        'title' => $block['text'], 'category' => $category, 'seo' => [],
                        'html' => [], 'faqs' => [], 'images' => [],
                    ];
                    $faqMode = false;

                    continue;
                }

                if (! $current) {
                    continue;
                }

                if (preg_match('/^(frequently asked questions|faqs?)\b/i', $block['text'])) {
                    $faqMode = true;

                    continue;
                }

                $faqMode = false;
                $tag = 'h'.min(6, max(2, $level - $articleLevel + 1));
                $current['html'][] = "<{$tag}>".e($block['text'])."</{$tag}>";

                continue;
            }

            if (! $current || $block['heading'] === 0 || $block['style'] === 'TOCHeading') {
                continue;
            }

            if ($this->isSeoBlock($block['text']) && empty($current['html'])) {
                $current['seo'] = array_replace($current['seo'], $this->parseSeo($block['text']));

                continue;
            }

            array_push($current['images'], ...$block['images']);

            if ($faqMode) {
                if ($block['text'] === '') {
                    continue;
                }
                // Question, answer, question, answer… An answer may span several
                // paragraphs; a new question starts once the previous one is
                // answered and the paragraph reads as a question.
                $last = array_key_last($current['faqs']);
                if ($last === null || ($current['faqs'][$last]['a'] !== '' && str_ends_with($block['text'], '?'))) {
                    $current['faqs'][] = ['q' => $block['text'], 'a' => ''];
                } elseif ($current['faqs'][$last]['a'] === '') {
                    $current['faqs'][$last]['a'] = $block['text'];
                } else {
                    $current['faqs'][$last]['a'] .= "\n\n".$block['text'];
                }

                continue;
            }

            if ($block['list']) {
                if ($list && $list['ordered'] !== $block['list']['ordered']) {
                    $flushList();
                }
                $list ??= ['ordered' => $block['list']['ordered'], 'items' => []];
                $list['items'][] = $block['html'];

                continue;
            }

            $flushList();
            if ($block['html'] !== '') {
                $current['html'][] = $block['table'] ? $block['html'] : "<p>{$block['html']}</p>";
            }
        }

        $flushList();
        if ($current) {
            $articles[] = $this->finish($current);
        }

        $this->zip->close();

        return ['author' => $author, 'articles' => $articles];
    }

    private function open(string $path): void
    {
        $this->zip = new ZipArchive;
        if ($this->zip->open($path) !== true) {
            throw new RuntimeException('The file is not a valid .docx document.');
        }

        $stat = $this->zip->statName('word/document.xml');
        if (! $stat) {
            throw new RuntimeException('The file is not a valid .docx document.');
        }
        if ($stat['size'] > self::MAX_XML_BYTES) {
            throw new RuntimeException('The document is too large to import.');
        }

        $doc = $this->loadXml('word/document.xml');
        $this->xpath = new DOMXPath($doc);
        $this->xpath->registerNamespace('w', self::NS_W);
        $this->xpath->registerNamespace('r', self::NS_R);
        $this->xpath->registerNamespace('a', self::NS_A);

        $this->rels = [];
        if ($rels = $this->loadXml('word/_rels/document.xml.rels', false)) {
            foreach ($rels->getElementsByTagName('Relationship') as $rel) {
                $this->rels[$rel->getAttribute('Id')] = $rel->getAttribute('Target');
            }
        }

        $this->headingStyles = [];
        if ($styles = $this->loadXml('word/styles.xml', false)) {
            $sx = new DOMXPath($styles);
            $sx->registerNamespace('w', self::NS_W);
            foreach ($sx->query('//w:style[@w:type="paragraph"]') as $style) {
                $id = $style->getAttributeNS(self::NS_W, 'styleId');
                $name = strtolower((string) $sx->evaluate('string(w:name/@w:val)', $style));
                if (preg_match('/^heading\s*(\d)$/', $name, $m) || preg_match('/^heading(\d)$/i', $id, $m)) {
                    $this->headingStyles[$id] = (int) $m[1];
                } elseif ($name === 'title' || $id === 'Title') {
                    $this->headingStyles[$id] = 0;
                }
            }
        }

        $this->orderedLists = [];
        if ($numbering = $this->loadXml('word/numbering.xml', false)) {
            $nx = new DOMXPath($numbering);
            $nx->registerNamespace('w', self::NS_W);
            $abstract = [];
            foreach ($nx->query('//w:abstractNum') as $node) {
                $aid = $node->getAttributeNS(self::NS_W, 'abstractNumId');
                foreach ($nx->query('w:lvl', $node) as $lvl) {
                    $fmt = (string) $nx->evaluate('string(w:numFmt/@w:val)', $lvl);
                    $abstract[$aid][$lvl->getAttributeNS(self::NS_W, 'ilvl')] = ! in_array($fmt, ['bullet', 'none', ''], true);
                }
            }
            foreach ($nx->query('//w:num') as $num) {
                $numId = $num->getAttributeNS(self::NS_W, 'numId');
                $aid = (string) $nx->evaluate('string(w:abstractNumId/@w:val)', $num);
                foreach ($abstract[$aid] ?? [] as $ilvl => $ordered) {
                    $this->orderedLists["{$numId}:{$ilvl}"] = $ordered;
                }
            }
        }
    }

    private function loadXml(string $name, bool $required = true): ?DOMDocument
    {
        $xml = $this->zip->getFromName($name);
        if ($xml === false) {
            if ($required) {
                throw new RuntimeException("Missing {$name} in the document.");
            }

            return null;
        }

        $doc = new DOMDocument;
        if (! $doc->loadXML($xml, LIBXML_NONET | LIBXML_COMPACT | LIBXML_PARSEHUGE)) {
            throw new RuntimeException("Could not read {$name}.");
        }

        return $doc;
    }

    /**
     * Flatten the document body into typed blocks.
     *
     * @return list<array{style: string, heading: ?int, text: string, html: string, list: ?array, table: bool, images: list<string>}>
     */
    private function blocks(): array
    {
        $blocks = [];
        foreach ($this->xpath->query('/w:document/w:body/*') as $node) {
            /** @var DOMElement $node */
            if ($node->localName === 'p') {
                $blocks[] = $this->paragraph($node);
            } elseif ($node->localName === 'tbl') {
                $blocks[] = $this->table($node);
            }
        }

        return $blocks;
    }

    private function paragraph(DOMElement $p): array
    {
        $style = (string) $this->xpath->evaluate('string(w:pPr/w:pStyle/@w:val)', $p);
        $numId = (string) $this->xpath->evaluate('string(w:pPr/w:numPr/w:numId/@w:val)', $p);
        $ilvl = (string) $this->xpath->evaluate('string(w:pPr/w:numPr/w:ilvl/@w:val)', $p) ?: '0';

        $images = [];
        [$html, $text] = $this->inline($p, $images);

        $list = null;
        if ($numId !== '' && $numId !== '0') {
            $list = ['ordered' => $this->orderedLists["{$numId}:{$ilvl}"] ?? false];
        } elseif (preg_match('/^(Compact|ListBullet|ListParagraph)$/i', $style) && $text !== '') {
            $list = ['ordered' => false];
        }

        foreach ($images as $url) {
            $html .= '<img src="'.e($url).'" alt="" loading="lazy">';
        }

        return [
            'style' => $style,
            'heading' => $this->headingStyles[$style] ?? null,
            'text' => $text,
            'html' => trim($html),
            'list' => $list,
            'table' => false,
            'images' => $images,
        ];
    }

    private function table(DOMElement $tbl): array
    {
        $rows = [];
        $images = [];
        foreach ($this->xpath->query('w:tr', $tbl) as $tr) {
            $cells = [];
            foreach ($this->xpath->query('w:tc', $tr) as $tc) {
                $parts = [];
                foreach ($this->xpath->query('w:p', $tc) as $p) {
                    [$html] = $this->inline($p, $images);
                    if (trim($html) !== '') {
                        $parts[] = trim($html);
                    }
                }
                $cells[] = '<td>'.implode('<br>', $parts).'</td>';
            }
            $rows[] = '<tr>'.implode('', $cells).'</tr>';
        }

        return [
            'style' => 'Table', 'heading' => null, 'text' => 'table', 'list' => null, 'table' => true,
            'html' => '<table><tbody>'.implode('', $rows).'</tbody></table>', 'images' => $images,
        ];
    }

    /**
     * Inline runs → [html, plain text]. Collects image URLs into $images.
     *
     * @return array{0: string, 1: string}
     */
    private function inline(DOMElement $p, array &$images): array
    {
        $html = '';
        $text = '';

        foreach ($this->xpath->query('w:r | w:hyperlink | w:ins/w:r | w:smartTag/w:r', $p) as $node) {
            /** @var DOMElement $node */
            if ($node->localName === 'hyperlink') {
                $inner = '';
                foreach ($this->xpath->query('w:r', $node) as $run) {
                    [$runHtml, $runText] = $this->run($run, $images);
                    $inner .= $runHtml;
                    $text .= $runText;
                }
                $rid = $node->getAttributeNS(self::NS_R, 'id');
                $href = $this->rels[$rid] ?? '';
                $html .= preg_match('#^(https?://|mailto:)#i', $href)
                    ? '<a href="'.e($href).'" rel="noopener">'.$inner.'</a>'
                    : $inner;

                continue;
            }

            [$runHtml, $runText] = $this->run($node, $images);
            $html .= $runHtml;
            $text .= $runText;
        }

        return [$html, trim(preg_replace('/\s+/u', ' ', $text))];
    }

    /** @return array{0: string, 1: string} */
    private function run(DOMElement $run, array &$images): array
    {
        $html = '';
        $text = '';

        foreach ($run->childNodes as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }
            match ($child->localName) {
                't' => [$html, $text] = [$html.e($child->textContent), $text.$child->textContent],
                'tab' => [$html, $text] = [$html.' ', $text.' '],
                'br', 'cr' => [$html, $text] = [$html.'<br>', $text.' '],
                'drawing', 'pict' => $this->collectImages($child, $images),
                default => null,
            };
        }

        if ($html === '' || trim(strip_tags($html)) === '') {
            return [$html, $text];
        }

        if ($this->flag($run, 'b')) {
            $html = "<strong>{$html}</strong>";
        }
        if ($this->flag($run, 'i')) {
            $html = "<em>{$html}</em>";
        }

        return [$html, $text];
    }

    private function flag(DOMElement $run, string $name): bool
    {
        $node = $this->xpath->query("w:rPr/w:{$name}", $run)->item(0);
        if (! $node instanceof DOMElement) {
            return false;
        }
        $val = $node->getAttributeNS(self::NS_W, 'val');

        return ! in_array($val, ['0', 'false', 'none'], true);
    }

    private function collectImages(DOMElement $node, array &$images): void
    {
        foreach ($this->xpath->query('.//a:blip/@r:embed', $node) as $attr) {
            $target = $this->rels[$attr->value] ?? null;
            if (! $target || preg_match('#^https?://#i', $target)) {
                continue;
            }
            $media = 'word/'.ltrim(str_replace('../', '', $target), '/');
            if ($url = $this->mediaUrl($media)) {
                $images[] = $url;
            }
        }
    }

    private function mediaUrl(string $media): ?string
    {
        $ext = strtolower(pathinfo($media, PATHINFO_EXTENSION));
        if (! in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'webp'], true)) {
            return null;
        }

        if (! $this->storeImages) {
            return 'docx://'.$media; // preview placeholder; nothing written
        }

        if (isset($this->storedMedia[$media])) {
            return $this->storedMedia[$media];
        }

        $bytes = $this->zip->getFromName($media);
        if ($bytes === false) {
            return null;
        }

        $path = 'media/import/'.sha1($bytes).'.'.($ext === 'jpeg' ? 'jpg' : $ext);
        if (! Storage::disk('public')->exists($path)) {
            Storage::disk('public')->put($path, $bytes);
        }

        return $this->storedMedia[$media] = Storage::disk('public')->url($path);
    }

    private function isSeoBlock(string $text): bool
    {
        return (bool) preg_match('/^(seo details|'.$this->labelPattern().')\s*:?/i', $text);
    }

    /** @return array<string, string> */
    private function parseSeo(string $text): array
    {
        $text = preg_replace('/^seo details\s*:?\s*/i', '', $text);
        $parts = preg_split('/('.$this->labelPattern().')\s*:\s*/i', $text, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);

        $seo = [];
        for ($i = 0; $i < count($parts) - 1; $i++) {
            $field = self::SEO_LABELS[strtolower($parts[$i])] ?? null;
            if ($field) {
                $seo[$field] = trim($parts[++$i]);
            }
        }

        return $seo;
    }

    private function labelPattern(): string
    {
        // Longest first so "url slug" wins over "slug", "focus keywords" over "keywords".
        $labels = array_keys(self::SEO_LABELS);
        usort($labels, fn ($a, $b) => strlen($b) <=> strlen($a));

        return implode('|', array_map(fn ($l) => preg_quote($l, '/'), $labels));
    }

    private function detectArticleLevel(array $blocks): int
    {
        $levels = [];
        $lastHeading = null;
        foreach ($blocks as $block) {
            if (($block['heading'] ?? 0) > 0) {
                $lastHeading = $block['heading'];
            } elseif ($lastHeading && $this->isSeoBlock($block['text'])) {
                $levels[] = $lastHeading;
            }
        }

        if ($levels) {
            $counts = array_count_values($levels);
            arsort($counts);

            return (int) array_key_first($counts);
        }

        // No SEO blocks: articles are the top heading level used more than once.
        $used = array_count_values(array_filter(array_column($blocks, 'heading')));
        ksort($used);
        foreach ($used as $level => $count) {
            if ($count > 1) {
                return (int) $level;
            }
        }

        return 1;
    }

    private function finish(array $a): array
    {
        $body = implode("\n", $a['html']);
        $plain = trim(preg_replace('/\s+/u', ' ', strip_tags(str_replace('<', ' <', $body))));
        $words = str_word_count($plain);

        $firstParagraph = '';
        foreach ($a['html'] as $chunk) {
            if (str_starts_with($chunk, '<p>')) {
                $firstParagraph = html_entity_decode(trim(strip_tags($chunk)), ENT_QUOTES | ENT_HTML5);
                break;
            }
        }

        $slugSource = $a['seo']['slug'] ?? '';
        $slug = Str::slug(Str::afterLast(trim($slugSource, '/ '), '/')) ?: Str::slug($a['title']);

        return [
            'title' => $a['title'],
            'slug' => Str::limit($slug, 180, ''),
            'category' => $a['category'],
            'seo_title' => $a['seo']['seo_title'] ?? null,
            'meta_description' => $a['seo']['meta_description'] ?? null,
            'focus_keywords' => $a['seo']['focus_keywords'] ?? null,
            'read_time' => $a['seo']['read_time'] ?? max(1, (int) ceil($words / 200)).' min read',
            'excerpt' => Str::limit($firstParagraph, 300),
            'body' => $body,
            'faqs' => array_values(array_filter($a['faqs'], fn ($f) => $f['q'] !== '' && $f['a'] !== '')),
            'image_url' => $a['images'][0] ?? null,
            'images' => count(array_unique($a['images'])),
            'words' => $words,
        ];
    }
}
