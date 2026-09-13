<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('articles')->orderBy('sort_order')->orderBy('name')->get();

        return ApiResponse::success(CategoryResource::collection($categories), 'Categories');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, null);
        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);
        $category = Category::create($data);

        return ApiResponse::success(new CategoryResource($category), 'Category created', 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $this->validated($request, $category->id);
        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);
        $category->update($data);

        return ApiResponse::success(new CategoryResource($category), 'Category updated');
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return ApiResponse::success(null, 'Category deleted');
    }

    private function validated(Request $request, ?int $id): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($id)],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer'],
        ]);
    }
}
