<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Lightweight article shape for listings (no body / faqs). */
class ArticleCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'image_url' => $this->image_url,
            'excerpt' => $this->excerpt,
            'read_time' => $this->read_time,
            'featured' => $this->featured,
            'status' => $this->status,
            'published_at' => $this->published_at?->toDateString(),
            'updated_at' => $this->updated_at?->toDateString(),
            'category' => $this->whenLoaded('category', fn () => [
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
        ];
    }
}
