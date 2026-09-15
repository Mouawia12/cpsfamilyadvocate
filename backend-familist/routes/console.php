<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
 * Shared hosting has no shell, so installs and updates run through a cPanel
 * cron job calling this command. It is safe to run repeatedly: migrations only
 * apply what is new, and the launch content is seeded only into an empty site
 * (it never overwrites what the owner has edited).
 */
Artisan::command('familist:install', function () {
    $this->call('migrate', ['--force' => true]);

    if (\App\Models\User::where('role', 'admin')->doesntExist()) {
        if (! env('ADMIN_PASSWORD')) {
            $this->error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env for the first install, then run again.');

            return 1;
        }
        $this->call('db:seed', ['--force' => true]);
        $this->info('Installed. Remove ADMIN_PASSWORD from .env (and the install cron job, if one was used).');
    } else {
        $this->info('Up to date. Content was not changed.');
    }

    $this->call('optimize:clear');

    return 0;
})->purpose('Run migrations and seed the launch content on an empty site');
