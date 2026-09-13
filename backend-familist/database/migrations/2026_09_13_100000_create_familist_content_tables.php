<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Owner-managed collections shown on the public site: podcast episodes,
 * testimonials (text / video / case study), FAQs and store products.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('podcast_episodes', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->unsignedInteger('episode_number')->nullable();
            $table->text('description')->nullable();
            $table->string('spotify_url')->nullable();
            $table->string('image_url')->nullable();
            $table->string('duration')->nullable();
            $table->boolean('visible')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->string('kind')->default('text'); // text | video | case_study
            $table->string('name');
            $table->string('role')->nullable();
            $table->text('quote')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->string('video_url')->nullable();
            $table->string('duration')->nullable();
            // Case-study fields: type, title, challenge, approach, result, outcome, stats[].
            $table->json('details')->nullable();
            $table->boolean('visible')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['kind', 'visible', 'sort_order']);
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('question');
            $table->text('answer');
            $table->boolean('visible')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('tagline')->nullable();
            $table->decimal('price', 8, 2)->default(0);
            $table->string('icon')->default('shirt'); // shirt | mug | book
            $table->string('image_url')->nullable();
            $table->string('status')->default('coming_soon'); // coming_soon | available
            $table->string('buy_url')->nullable();
            $table->boolean('visible')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('testimonials');
        Schema::dropIfExists('podcast_episodes');
    }
};
