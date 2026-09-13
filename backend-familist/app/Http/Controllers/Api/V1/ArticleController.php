<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleCardResource;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->integer('per_page', 12), 1), 200);

        $query = Article::query()
            ->published()
            ->with('category')
            ->orderByDesc('featured')
            ->latest('published_at')
            ->latest('id');

        if ($category = $request->query('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $category));
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, ArticleCardResource::collection($paginator->items()), 'Articles');
    }

    public function show(Article $article): JsonResponse
    {
        abort_unless($article->status === 'published', 404);

        $article->load('category');

        return ApiResponse::success(new ArticleResource($article), 'Article');
    }
}
