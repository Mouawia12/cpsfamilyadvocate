<?php

namespace App\Support;

use App\Models\Order;
use Illuminate\Support\Facades\Http;

/**
 * Thin Stripe Checkout wrapper (no SDK — plain HTTP). The secret key lives only
 * in .env on the server; the browser is just redirected to Stripe's hosted page.
 * Dormant until STRIPE_SECRET is set — enabled() gates every call.
 */
class StripePayments
{
    /** Reject webhook events signed more than this many seconds ago (replay guard). */
    private const WEBHOOK_TOLERANCE = 300;

    public function enabled(): bool
    {
        return ! empty(config('services.stripe.secret'));
    }

    /**
     * Create a Checkout Session for an order; stores its id and returns the hosted URL.
     */
    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): ?string
    {
        if (! $this->enabled() || $order->amount <= 0) {
            return null;
        }

        $response = Http::asForm()
            ->withToken(config('services.stripe.secret'))
            ->post('https://api.stripe.com/v1/checkout/sessions', [
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'client_reference_id' => (string) $order->id,
                'customer_email' => $order->email,
                'metadata[order_id]' => (string) $order->id,
                'metadata[kind]' => $order->kind,
                'line_items[0][quantity]' => 1,
                'line_items[0][price_data][currency]' => strtolower($order->currency),
                'line_items[0][price_data][unit_amount]' => (int) round($order->amount * 100),
                'line_items[0][price_data][product_data][name]' => 'Familist — '.$order->label(),
            ]);

        if (! $response->successful()) {
            report(new \RuntimeException('Stripe checkout failed: '.$response->body()));

            return null;
        }

        $order->update(['stripe_session_id' => $response->json('id')]);

        return $response->json('url');
    }

    /**
     * Verify a Stripe webhook signature and return the decoded event, or null.
     */
    public function verifyWebhook(string $payload, ?string $sigHeader): ?array
    {
        $secret = config('services.stripe.webhook_secret');
        if (empty($secret) || empty($sigHeader)) {
            return null;
        }

        $timestamp = null;
        $signatures = [];
        foreach (explode(',', $sigHeader) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
            if ($key === 't') {
                $timestamp = $value;
            } elseif ($key === 'v1') {
                $signatures[] = $value;
            }
        }

        if (! ctype_digit((string) $timestamp) || empty($signatures)
            || abs(time() - (int) $timestamp) > self::WEBHOOK_TOLERANCE) {
            return null;
        }

        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
        foreach ($signatures as $signature) {
            if (hash_equals($expected, $signature)) {
                return json_decode($payload, true) ?: null;
            }
        }

        return null;
    }
}
