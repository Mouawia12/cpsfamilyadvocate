<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminLeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Lead::query()->latest('id')
            ->when($request->query('source'), fn ($q, $source) => $q->where('source', $source))
            ->when($request->query('search'), fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('first_name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%")));

        return ApiResponse::paginated($query->paginate(min(max($request->integer('per_page', 25), 1), 100)));
    }

    /** CSV export for importing into a newsletter tool. */
    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['first_name', 'email', 'role', 'source', 'signed_up_at']);
            Lead::query()->orderBy('id')->chunk(500, function ($leads) use ($out) {
                foreach ($leads as $lead) {
                    fputcsv($out, [
                        $this->safeCell($lead->first_name), $this->safeCell($lead->email),
                        $lead->role, $lead->source, $lead->created_at?->toDateTimeString(),
                    ]);
                }
            });
            fclose($out);
        }, 'familist-leads-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }

    public function destroy(Lead $lead): JsonResponse
    {
        $lead->delete();

        return ApiResponse::success(null, 'Lead deleted');
    }

    /** Neutralise spreadsheet formula injection in visitor-supplied values. */
    private function safeCell(?string $value): ?string
    {
        return $value !== null && preg_match('/^[=+\-@\t\r]/', $value) ? "'".$value : $value;
    }
}
