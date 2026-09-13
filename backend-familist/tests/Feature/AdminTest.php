<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Models\Page;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_admin_routes_require_an_admin(): void
    {
        $this->getJson('/api/v1/admin/stats')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create(['role' => 'client']));
        $this->getJson('/api/v1/admin/stats')->assertForbidden();
    }

    public function test_settings_update_merges_nested_keys(): void
    {
        $this->admin();

        $this->putJson('/api/v1/admin/settings', ['data' => ['pricing' => ['trainingPrice' => 120]]])
            ->assertOk()
            ->assertJsonPath('data.pricing.trainingPrice', 120)
            ->assertJsonPath('data.pricing.consultationPrice', 150);

        $this->putJson('/api/v1/admin/settings', ['data' => ['integrations' => ['gaMeasurementId' => 'UA-123']]])
            ->assertStatus(422);
    }

    public function test_empty_text_fields_stay_strings_in_page_content_and_settings(): void
    {
        $this->admin();
        Page::create(['key' => 'home', 'name' => 'Home', 'data' => ['hero' => ['title' => 'x']]]);

        $this->putJson('/api/v1/admin/pages/home', ['data' => ['hero' => ['title' => '', 'items' => ['', 'b']]]])
            ->assertOk()
            ->assertJsonPath('data.data.hero.title', '')
            ->assertJsonPath('data.data.hero.items.0', '');

        $this->putJson('/api/v1/admin/settings', ['data' => ['integrations' => ['gaMeasurementId' => '']]])
            ->assertOk()
            ->assertJsonPath('data.integrations.gaMeasurementId', '');
    }

    public function test_only_visible_testimonials_reach_the_public_home_payload(): void
    {
        $this->admin();

        $id = $this->postJson('/api/v1/admin/testimonials', [
            'kind' => 'text', 'name' => 'Real Client', 'quote' => 'Helpful.', 'visible' => false,
        ])->assertCreated()->json('data.id');

        $this->getJson('/api/v1/home')->assertJsonCount(0, 'data.testimonials.text');

        $this->putJson("/api/v1/admin/testimonials/{$id}", ['kind' => 'text', 'name' => 'Real Client', 'quote' => 'Helpful.', 'visible' => true])
            ->assertOk();
        $this->getJson('/api/v1/home')->assertJsonPath('data.testimonials.text.0.name', 'Real Client');

        $this->deleteJson("/api/v1/admin/testimonials/{$id}")->assertOk();
        $this->assertDatabaseCount(Testimonial::class, 0);
    }

    public function test_leads_are_stored_and_exported_without_formula_injection(): void
    {
        $this->postJson('/api/v1/leads', ['first_name' => '=HYPERLINK("x")', 'email' => 'lead@example.com', 'role' => 'parent'])
            ->assertCreated();
        $this->postJson('/api/v1/leads', ['email' => 'bad', 'role' => 'hacker'])->assertStatus(422);

        $this->admin();
        $csv = $this->get('/api/v1/admin/leads/export')->assertOk()->streamedContent();

        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringContainsString('lead@example.com', $csv);
        $this->assertSame(1, Lead::count());
    }
}
