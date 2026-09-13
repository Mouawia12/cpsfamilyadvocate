<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use App\Support\ApiResponse;
use App\Support\DocxArticleImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use RuntimeException;

class DocxImportController extends Controller
{
    /**
     * Import articles from a Word file. With dry_run=1 nothing is written and the
     * parsed articles are returned for review; otherwise categories and articles
     * are created (or updated by slug when overwrite=1) and images are saved.
     */
    public function store(Request $request, DocxArticleImporter $importer): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:20480', 'extensions:docx'],
            'dry_run' => ['boolean'],
            'overwrite' => ['boolean'],
            'status' => ['nullable', Rule::in(['draft', 'published'])],
        ]);

        $dryRun = $request->boolean('dry_run');

        try {
            $parsed = $importer->parse($request->file('file')->getRealPath(), storeImages: ! $dryRun);
        } catch (RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), 422);
        }

        if (! $parsed['articles']) {
            return ApiResponse::error('No articles were found. Each article needs its own heading (e.g. Heading 2) above its text.', 422);
        }

        $existing = Article::whereIn('slug', array_column($parsed['articles'], 'slug'))->pluck('slug')->flip();

        if ($dryRun) {
            return ApiResponse::success([
                'author' => $parsed['author'],
                'articles' => array_map(fn ($a) => [
                    ...collect($a)->except(['body'])->all(),
                    'exists' => $existing->has($a['slug']),
                ], $parsed['articles']),
            ], 'Preview');
        }

        $overwrite = $request->boolean('overwrite');
        $status = $data['status'] ?? 'draft';
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'categories' => 0];

        DB::transaction(function () use ($parsed, $existing, $overwrite, $status, &$summary) {
            $categoryIds = [];
            foreach ($parsed['articles'] as $a) {
                if ($existing->has($a['slug']) && ! $overwrite) {
                    $summary['skipped']++;

                    continue;
                }

                $categoryId = null;
                if ($a['category']) {
                    $slug = Str::slug($a['category']);
                    if (! isset($categoryIds[$slug])) {
                        $category = Category::firstOrCreate(['slug' => $slug], ['name' => $a['category']]);
                        $summary['categories'] += $category->wasRecentlyCreated ? 1 : 0;
                        $categoryIds[$slug] = $category->id;
                    }
                    $categoryId = $categoryIds[$slug];
                }

                $fields = [
                    'category_id' => $categoryId,
                    'title' => $a['title'],
                    'seo_title' => $a['seo_title'],
                    'meta_description' => $a['meta_description'],
                    'focus_keywords' => $a['focus_keywords'],
                    'read_time' => $a['read_time'],
                    'excerpt' => $a['excerpt'],
                    'body' => $a['body'],
                    'faqs' => $a['faqs'],
                    'author' => $parsed['author'],
                ];
                if ($a['image_url']) {
                    $fields['image_url'] = $a['image_url'];
                }

                $article = Article::where('slug', $a['slug'])->first();
                if ($article) {
                    $article->update($fields);
                    $summary['updated']++;
                } else {
                    Article::create([...$fields, 'slug' => $a['slug'], 'status' => $status, 'published_at' => now()]);
                    $summary['created']++;
                }
            }
        });

        return ApiResponse::success($summary, "Imported {$summary['created']} new, updated {$summary['updated']}, skipped {$summary['skipped']}.");
    }
}
