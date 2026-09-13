<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Full article shape for the detail page. */
class ArticleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image_url' => $this->image_url,
            'seo_title' => $this->seo_title,
            'excerpt' => $this->excerpt,
            'body' => $this->body,
            'meta_description' => $this->meta_description,
            'focus_keywords' => $this->focus_keywords,
            'read_time' => $this->read_time,
            'author' => $this->author,
            'faqs' => $this->faqs ?? [],
            'featured' => $this->featured,
            'status' => $this->status,
            'published_at' => $this->published_at?->toDateString(),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
        ];
    }
}
