<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminUserSeeder extends Seeder
{
    /**
     * Creates the owner account. Set ADMIN_EMAIL / ADMIN_PASSWORD in .env to choose
     * the credentials; otherwise a random password is generated and printed once.
     */
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@cpsfamilyadvocate.com');
        $password = env('ADMIN_PASSWORD') ?: Str::password(16, symbols: false);

        $user = User::updateOrCreate(
            ['email' => $email],
            ['name' => 'Familist Admin', 'password' => $password, 'role' => 'admin'],
        );

        $this->command->info("Admin ready: {$user->email} / {$password}");
    }
}
