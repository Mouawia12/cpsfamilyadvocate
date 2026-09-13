<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('image_url')->nullable();
            $table->string('seo_title')->nullable();
            $table->text('excerpt')->nullable();
            $table->longText('body')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('focus_keywords')->nullable();
            $table->string('read_time')->nullable();
            $table->string('author')->nullable();
            $table->json('faqs')->nullable();
            $table->string('status')->default('published');
            $table->boolean('featured')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
