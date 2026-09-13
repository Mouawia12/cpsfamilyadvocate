<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * `php artisan migrate:fresh --seed` reproduces the launch dataset: admin user,
     * site settings, home + legal page content, FAQs, products, and the (hidden)
     * testimonials carried over from the original design.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            ContentSeeder::class,
        ]);

        Setting::site()->save();
    }
}
