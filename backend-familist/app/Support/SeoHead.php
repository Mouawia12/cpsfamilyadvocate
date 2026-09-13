<?php

namespace App\Support;

/**
 * Builds the <head> SEO tags injected into the SPA shell. All values are
 * escaped here; JSON-LD and state are encoded so they cannot close <script>.
 */
class SeoHead
{
    private array $jsonLd = [];

    public function __construct(
        public string $title,
        public string $description = '',
        public string $canonical = '',
        public string $type = 'website',
        public string $image = '',
        public string $keywords = '',
        public bool $index = true,
        public string $siteName = 'Familist',
    ) {}

    public function addJsonLd(array $schema): self
    {
        $this->jsonLd[] = $schema;

        return $this;
    }

    public function render(): string
    {
        // Social crawlers need absolute image URLs; uploads are stored root-relative.
        if (str_starts_with($this->image, '/')) {
            $this->image = url($this->image);
        }

        $tags = ['<title>'.e($this->title).'</title>'];
        $meta = [
            'description' => $this->description,
            'keywords' => $this->keywords,
            'robots' => $this->index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow',
            'twitter:card' => $this->image ? 'summary_large_image' : 'summary',
            'twitter:title' => $this->title,
            'twitter:description' => $this->description,
            'twitter:image' => $this->image,
        ];
        foreach ($meta as $name => $content) {
            if ($content !== '') {
                $tags[] = '<meta name="'.e($name).'" content="'.e($content).'">';
            }
        }

        $og = [
            'og:site_name' => $this->siteName,
            'og:title' => $this->title,
            'og:description' => $this->description,
            'og:type' => $this->type,
            'og:url' => $this->canonical,
            'og:image' => $this->image,
            'og:locale' => 'en_US',
        ];
        foreach ($og as $property => $content) {
            if ($content !== '') {
                $tags[] = '<meta property="'.e($property).'" content="'.e($content).'">';
            }
        }

        if ($this->canonical !== '' && $this->index) {
            $tags[] = '<link rel="canonical" href="'.e($this->canonical).'">';
        }

        foreach ($this->jsonLd as $schema) {
            $tags[] = '<script type="application/ld+json">'.static::json($schema).'</script>';
        }

        return implode("\n    ", $tags);
    }

    public static function json(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR);
    }
}
