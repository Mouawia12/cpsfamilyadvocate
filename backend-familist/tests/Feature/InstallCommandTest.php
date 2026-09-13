<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstallCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_run_seeds_and_later_runs_leave_content_alone(): void
    {
        putenv('ADMIN_PASSWORD=install-test-pass');

        $this->artisan('familist:install')->assertSuccessful();
        $this->assertSame(1, User::where('role', 'admin')->count());

        $home = Page::where('key', 'home')->sole();
        $home->update(['data' => ['hero' => ['titleStart' => 'Edited by the owner']]]);

        $this->artisan('familist:install')->expectsOutputToContain('Content was not changed')->assertSuccessful();
        $this->assertSame('Edited by the owner', $home->fresh()->data['hero']['titleStart']);

        putenv('ADMIN_PASSWORD');
    }
}
