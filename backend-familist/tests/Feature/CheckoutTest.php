<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function consultation(array $overrides = []): array
    {
        return [
            'kind' => 'consultation', 'name' => 'Jane Parent', 'email' => 'jane@example.com',
            'phone' => '555-0100', 'contact_method' => 'video', ...$overrides,
        ];
    }

    public function test_price_comes_from_settings_not_the_request(): void
    {
        config(['services.stripe.secret' => null]);
        $setting = Setting::site();
        $setting->update(['data' => array_replace_recursive($setting->data, ['pricing' => ['consultationPrice' => 175]])]);

        $this->postJson('/api/v1/checkout', $this->consultation(['amount' => 1]))
            ->assertCreated()
            ->assertJsonPath('data.requiresPayment', false);

        $order = Order::sole();
        $this->assertSame(175.0, $order->amount);
        $this->assertSame('pending', $order->status);
    }

    public function test_consultation_requires_phone_but_training_does_not(): void
    {
        $this->postJson('/api/v1/checkout', $this->consultation(['phone' => '']))
            ->assertStatus(422)->assertJsonValidationErrors('phone');

        $this->postJson('/api/v1/checkout', ['kind' => 'training', 'name' => 'Sam', 'email' => 'sam@example.com'])
            ->assertCreated();
        $this->assertSame(99.0, Order::sole()->amount);
    }

    public function test_honeypot_submissions_are_silently_dropped(): void
    {
        $this->postJson('/api/v1/checkout', $this->consultation(['website' => 'http://spam']))->assertOk();
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_redirects_to_stripe_checkout_when_configured(): void
    {
        config(['services.stripe.secret' => 'sk_test_123']);
        Http::fake(['api.stripe.com/*' => Http::response(['id' => 'cs_test_abc', 'url' => 'https://checkout.stripe.com/c/pay/cs_test_abc'])]);

        $this->postJson('/api/v1/checkout', $this->consultation())
            ->assertCreated()
            ->assertJsonPath('data.requiresPayment', true)
            ->assertJsonPath('data.checkoutUrl', 'https://checkout.stripe.com/c/pay/cs_test_abc');

        $this->assertSame('cs_test_abc', Order::sole()->stripe_session_id);
        Http::assertSent(fn ($request) => (int) $request['line_items[0][price_data][unit_amount]'] === 15000
            && str_contains($request['success_url'], '{CHECKOUT_SESSION_ID}'));
    }

    public function test_webhook_marks_order_paid_only_with_a_valid_fresh_signature(): void
    {
        config(['services.stripe.webhook_secret' => 'whsec_test']);
        $order = Order::create([...$this->consultation(), 'amount' => 150, 'stripe_session_id' => 'cs_test_paid']);

        $payload = json_encode([
            'type' => 'checkout.session.completed',
            'data' => ['object' => ['id' => 'cs_test_paid', 'payment_status' => 'paid']],
        ]);
        $sign = fn (int $t, string $secret = 'whsec_test') => 't='.$t.',v1='.hash_hmac('sha256', $t.'.'.$payload, $secret);
        $post = fn (string $header) => $this->call('POST', '/api/v1/stripe/webhook', [], [], [],
            ['HTTP_STRIPE_SIGNATURE' => $header, 'CONTENT_TYPE' => 'application/json'], $payload);

        $post($sign(time(), 'wrong'))->assertStatus(400);
        $post($sign(time() - 3600))->assertStatus(400);
        $this->assertSame('pending', $order->fresh()->status);

        $post($sign(time()))->assertOk();
        $this->assertSame('paid', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->paid_at);
    }

    public function test_status_endpoint_exposes_no_personal_data(): void
    {
        Order::create([...$this->consultation(), 'amount' => 150, 'stripe_session_id' => 'cs_test_status']);

        $this->getJson('/api/v1/checkout/cs_test_status')
            ->assertOk()
            ->assertExactJson(['success' => true, 'message' => 'Order status', 'data' => ['kind' => 'consultation', 'status' => 'pending']]);
    }
}
