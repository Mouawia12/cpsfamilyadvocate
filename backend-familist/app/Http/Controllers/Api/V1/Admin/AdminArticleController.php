<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 20), 1), 100);

        $query = Article::query()->with('category')->latest('id');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($category = $request->query('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category));
        }
        if ($search = $request->query('search')) {
            $query->where('title', 'like', "%{$search}%");
        }

        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, ArticleCardResource::collection($paginator->items()), 'Articles');
    }

    public function show(Article $article): JsonResponse
    {
        return ApiResponse::success(new ArticleResource($article->load('category')), 'Article');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, null);
        $data['slug'] = $this->slug($data, null);
        $article = Article::create($data);

        return ApiResponse::success(new ArticleResource($article->load('category')), 'Article created', 201);
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        $data = $this->validated($request, $article->id);
        $data['slug'] = $this->slug($data, $article);
        $article->update($data);

        return ApiResponse::success(new ArticleResource($article->fresh()->load('category')), 'Article updated');
    }

    public function destroy(Article $article): JsonResponse
    {
        $article->delete();

        return ApiResponse::success(null, 'Article deleted');
    }

    private function validated(Request $request, ?int $id): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('articles', 'slug')->ignore($id)],
            'category_id' => ['nullable', 'exists:categories,id'],
            'image_url' => ['nullable', 'string', 'max:500'],
            'seo_title' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string'],
            'body' => ['nullable', 'string'],
            'meta_description' => ['nullable', 'string'],
            'focus_keywords' => ['nullable', 'string'],
            'read_time' => ['nullable', 'string', 'max:50'],
            'author' => ['nullable', 'string', 'max:255'],
            'faqs' => ['nullable', 'array'],
            'faqs.*.q' => ['required_with:faqs', 'string'],
            'faqs.*.a' => ['required_with:faqs', 'string'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
            'featured' => ['boolean'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    private function slug(array $data, ?Article $article): string
    {
        $slug = ! empty($data['slug']) ? Str::slug($data['slug']) : Str::slug($data['title']);
        $base = $slug;
        $i = 2;
        while (Article::where('slug', $slug)->when($article, fn ($q) => $q->whereKeyNot($article->id))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
