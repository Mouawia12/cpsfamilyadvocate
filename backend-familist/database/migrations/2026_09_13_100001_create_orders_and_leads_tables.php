<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Orders = paid requests (urgent consultation, crisis training) tracked through
 * Stripe Checkout. Leads = free-guide / newsletter sign-ups. Neither stores any
 * case details — only the contact data needed to follow up.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('kind'); // consultation | training
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('contact_method')->nullable(); // phone | video | whatsapp
            $table->decimal('amount', 8, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('status')->default('pending'); // pending | paid | cancelled | fulfilled
            $table->string('stripe_session_id')->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['kind', 'status']);
        });

        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('email');
            $table->string('role')->nullable(); // parent | caregiver | attorney | social_worker | other
            $table->string('source')->default('guides'); // guides | exit_popup | newsletter
            $table->timestamps();

            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
        Schema::dropIfExists('orders');
    }
};
