<?php

namespace App\Support;

use Illuminate\Support\Facades\Mail;

/**
 * Plain-text email notifications to the practice inbox. Failures are reported
 * but never break the visitor's request — the record is already saved.
 */
class Notify
{
    public static function team(string $subject, array $lines, ?string $replyTo = null): void
    {
        $to = config('services.contact_to');
        if (empty($to)) {
            return;
        }

        $body = collect($lines)
            ->map(fn ($value, $label) => is_int($label) ? $value : "{$label}: {$value}")
            ->implode("\n");

        try {
            Mail::raw($body, function ($mail) use ($to, $subject, $replyTo) {
                $mail->to($to)->subject($subject.' — Familist');
                if ($replyTo) {
                    $mail->replyTo($replyTo);
                }
            });
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
