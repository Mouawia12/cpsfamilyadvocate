<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Setting;
use App\Support\ApiResponse;
use App\Support\Notify;
use App\Support\StripePayments;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CheckoutController extends Controller
{
    /**
     * Start a paid request (urgent consultation or crisis training). The price is
     * always read from settings on the server — never trusted from the client.
     * With Stripe configured the visitor is sent to hosted Checkout; without it
     * the order is recorded as pending and the team follows up by email/phone.
     */
    public function store(Request $request, StripePayments $stripe): JsonResponse
    {
        // Honeypot: real users never fill this. Bots do — answer 200 silently.
        if (filled($request->input('website'))) {
            return ApiResponse::success(['requiresPayment' => false], 'Request received');
        }

        $data = $request->validate([
            'kind' => ['required', Rule::in(Order::KINDS)],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'phone' => ['required_if:kind,consultation', 'nullable', 'string', 'max:40'],
            'contact_method' => ['nullable', Rule::in(['phone', 'video', 'whatsapp'])],
        ]);

        $pricing = Setting::site()->data['pricing'];
        $amount = (float) ($data['kind'] === 'training' ? $pricing['trainingPrice'] : $pricing['consultationPrice']);

        $order = Order::create([
            ...$data,
            'amount' => $amount,
            'currency' => strtoupper($pricing['currency'] ?? 'USD'),
            'status' => 'pending',
        ]);

        $frontend = rtrim(config('services.frontend_url'), '/');
        $checkoutUrl = $stripe->createCheckoutSession(
            $order,
            $frontend.'/checkout/success?session_id={CHECKOUT_SESSION_ID}',
            $frontend.'/checkout/cancelled?kind='.$order->kind,
        );

        Notify::team('New '.$order->label().' request', [
            'Name' => $order->name,
            'Email' => $order->email,
            'Phone' => $order->phone ?: '—',
            'Preferred contact' => $order->contact_method ?: '—',
            'Amount' => number_format($order->amount, 2).' '.$order->currency,
            'Payment' => $checkoutUrl ? 'Sent to Stripe Checkout (awaiting payment)' : 'Online payment not configured — follow up to collect payment',
        ], $order->email);

        return ApiResponse::success([
            'id' => $order->id,
            'requiresPayment' => (bool) $checkoutUrl,
            'checkoutUrl' => $checkoutUrl,
        ], $checkoutUrl ? 'Redirecting to secure checkout' : 'Request received', 201);
    }

    /** Minimal, non-identifying status for the success page. */
    public function status(string $sessionId): JsonResponse
    {
        $order = Order::where('stripe_session_id', $sessionId)->firstOrFail();

        return ApiResponse::success([
            'kind' => $order->kind,
            'status' => $order->status,
        ], 'Order status');
    }

    /** Stripe webhook — marks an order paid once Checkout completes. */
    public function webhook(Request $request, StripePayments $stripe): JsonResponse
    {
        $event = $stripe->verifyWebhook($request->getContent(), $request->header('Stripe-Signature'));
        if (! $event) {
            return ApiResponse::error('Invalid signature', 400);
        }

        $session = $event['data']['object'] ?? [];
        $type = $event['type'] ?? '';

        if (in_array($type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)
            && ($session['payment_status'] ?? '') === 'paid') {
            $order = Order::where('stripe_session_id', $session['id'] ?? '')->first();
            if ($order && $order->status !== 'paid') {
                $order->update(['status' => 'paid', 'paid_at' => now()]);
                Notify::team('Payment received: '.$order->label(), [
                    'Name' => $order->name,
                    'Email' => $order->email,
                    'Phone' => $order->phone ?: '—',
                    'Amount' => number_format($order->amount, 2).' '.$order->currency,
                ], $order->email);
            }
        }

        if ($type === 'checkout.session.expired') {
            Order::where('stripe_session_id', $session['id'] ?? '')
                ->where('status', 'pending')
                ->update(['status' => 'cancelled']);
        }

        return ApiResponse::success(null, 'ok');
    }
}
