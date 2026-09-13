<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Shared list/create/update/delete for the small owner-managed collections
 * (podcast episodes, testimonials, FAQs, products). Subclasses declare the
 * model, the validation rules and the default ordering.
 */
abstract class CrudController extends Controller
{
    /** @return class-string<Model> */
    abstract protected function model(): string;

    abstract protected function rules(Request $request): array;

    protected function query(Request $request): Builder
    {
        return $this->model()::query()->latest('id');
    }

    public function index(Request $request): JsonResponse
    {
        return ApiResponse::success($this->query($request)->get(), 'OK');
    }

    public function store(Request $request): JsonResponse
    {
        $record = $this->model()::create($request->validate($this->rules($request)));

        return ApiResponse::success($record->fresh(), 'Created', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $record = $this->model()::findOrFail($id);
        $record->update($request->validate($this->rules($request)));

        return ApiResponse::success($record->fresh(), 'Updated');
    }

    public function destroy(int $id): JsonResponse
    {
        $this->model()::findOrFail($id)->delete();

        return ApiResponse::success(null, 'Deleted');
    }
}
