<?php

namespace Database\Seeders;

use App\Models\Faq;
use App\Models\Page;
use App\Models\Product;
use App\Models\Testimonial;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $home = json_decode(file_get_contents(database_path('data/home.json')), true, flags: JSON_THROW_ON_ERROR);
        Page::updateOrCreate(['key' => 'home'], ['name' => 'Home page', 'data' => $home]);

        foreach (json_decode(file_get_contents(database_path('data/legal.json')), true, flags: JSON_THROW_ON_ERROR) as $key => $page) {
            Page::updateOrCreate(['key' => $key], ['name' => $page['title'], 'data' => $page]);
        }

        $faqs = [
            ['What should I do if CPS contacts me?', 'Stay calm and be polite, but know your rights. You have the right to an attorney, the right to know the specific allegations against you, and the right to refuse entry to your home without a court order or warrant. Do not sign anything without reading it carefully. Contact a family advocate or attorney immediately for guidance before your first interview.'],
            ['How long does CPS reunification typically take?', 'Reunification typically takes between 6 to 24 months, depending on case complexity, your compliance with case plan requirements, and court schedules. Active participation in all required services, consistent documentation, and proactive communication with your caseworker can help accelerate the process. Federal law generally requires permanency decisions within 12-15 months.'],
            ['Do you offer services in languages other than English?', 'Yes, we provide comprehensive trilingual services in English, Arabic, and Spanish. This includes case plan coaching, meeting interpretation, document translation, and culturally competent advocacy. Our clinician is fluent in both Arabic and English, with Spanish interpretation services available.'],
            ['What is the cost of your services?', 'We offer a range of services at different price points. Urgent consultations start at $150 for a 30-minute session. Ongoing advocacy packages, expert witness services, and comprehensive support plans are quoted based on case complexity. Contact us for a free initial assessment to discuss your needs and options.'],
            ['Can you help if I am already working with an attorney?', 'Absolutely. We frequently collaborate with attorneys, providing expert witness testimony, case consultation, comprehensive record reviews, and written reports. Our clinical expertise complements legal representation, giving your attorney the forensic and psychological insights needed to build a stronger case.'],
            ['What areas do you serve?', 'We provide remote consultation nationwide across the United States and internationally, by phone or video. Our clinician is licensed to practice in Alaska and Ohio, and services such as case consultation, case plan coaching, and document review are available wherever you are. Expert witness services may require travel or jurisdiction-specific arrangements, which are quoted on a case-by-case basis.'],
        ];
        foreach ($faqs as $i => [$question, $answer]) {
            Faq::updateOrCreate(['question' => $question], ['answer' => $answer, 'sort_order' => $i, 'visible' => true]);
        }

        $products = [
            ['Familist Logo Tee', '"Advocating for Families"', 25, 'shirt'],
            ['Advocate Mug', 'Start your day with purpose', 18, 'mug'],
            ['Case Plan Journal', 'Track progress and goals', 15, 'book'],
        ];
        foreach ($products as $i => [$name, $tagline, $price, $icon]) {
            Product::updateOrCreate(['name' => $name], [
                'tagline' => $tagline, 'price' => $price, 'icon' => $icon,
                'status' => 'coming_soon', 'sort_order' => $i, 'visible' => true,
            ]);
        }

        // Carried over from the design so the owner can edit or replace them, but
        // HIDDEN: testimonials must come from real clients (with consent) before
        // they are shown publicly.
        $testimonials = [
            ['text', 'Maria R.', 'Parent — Reunified in 8 months', 'When CPS first contacted us, I was terrified. Familist helped me understand my rights and guided me through every meeting. My children are home now, and I could not have done it without their support.', 5, null, null, null],
            ['text', 'James D., Esq.', 'Family Law Attorney — Anchorage', 'As a family law attorney, having expert witness support that truly understands both the clinical and cultural aspects of cases is invaluable. Their reports are thorough and their testimony is compelling.', 5, null, null, null],
            ['text', 'Ahmed K.', 'Parent — Arabic-Speaking Client', 'The Arabic-language support was a game-changer for my family. Finally, someone who understood our culture and could explain everything in our language. We felt truly heard for the first time.', 5, null, null, null],
            ['video', 'Maria R.', 'Reunified after 14 months', 'After 14 months apart, my children are finally home. Familist helped me understand exactly what CPS needed to see...', null, null, '3:42', null],
            ['video', 'Attorney James D.', 'Family Law Practice, Anchorage', 'As an attorney, having expert witness testimony that is both clinically sound and culturally informed changed everything for my client...', null, null, '4:15', null],
            ['case_study', 'Single Mother, Two Children Under 5', null, null, null, null, null, [
                'outcome' => 'Reunified', 'type' => 'Neglect Allegation', 'title' => 'Single Mother, Two Children Under 5',
                'challenge' => 'Children removed due to housing instability and missed medical appointments. Mother was overwhelmed and did not understand case plan requirements.',
                'approach' => 'Provided case plan coaching, connected to housing resources, attended all meetings, and documented progress weekly.',
                'result' => 'Full reunification in 8 months — 4 months ahead of schedule.',
                'stats' => [['value' => '8', 'label' => 'Months'], ['value' => '100%', 'label' => 'Case Plan'], ['value' => '12', 'label' => 'Meetings Attended']],
            ]],
            ['case_study', 'Arabic-Speaking Father, Custody Dispute', null, null, null, null, null, [
                'outcome' => 'Reunified', 'type' => 'Cultural Misunderstanding', 'title' => 'Arabic-Speaking Father, Custody Dispute',
                'challenge' => 'Cultural parenting practices misinterpreted as abuse. Language barriers prevented father from effectively communicating with caseworkers.',
                'approach' => 'Provided Arabic interpretation, wrote cultural context report for court, and served as expert witness on cultural parenting norms.',
                'result' => 'Case dismissed. Father retained full custody with no ongoing supervision.',
                'stats' => [['value' => '4', 'label' => 'Months'], ['value' => '100%', 'label' => 'Custody'], ['value' => '1', 'label' => 'Expert Report']],
            ]],
            ['case_study', 'Parents in Recovery, Three Children', null, null, null, null, null, [
                'outcome' => 'Reunified', 'type' => 'Substance Use History', 'title' => 'Parents in Recovery, Three Children',
                'challenge' => 'Both parents had substance use history. CPS skeptical of recovery. Children in foster care for 11 months before seeking advocacy.',
                'approach' => 'Coordinated with treatment providers, documented recovery milestones, prepared parents for every court date, and advocated for increased visitation.',
                'result' => 'Full reunification achieved 5 months after starting advocacy. Family thriving 2 years later.',
                'stats' => [['value' => '5', 'label' => 'Months'], ['value' => '3', 'label' => 'Children Home'], ['value' => '2', 'label' => 'Years Thriving']],
            ]],
        ];
        foreach ($testimonials as $i => [$kind, $name, $role, $quote, $rating, $videoUrl, $duration, $details]) {
            Testimonial::updateOrCreate(['kind' => $kind, 'name' => $name], [
                'role' => $role, 'quote' => $quote, 'rating' => $rating, 'video_url' => $videoUrl,
                'duration' => $duration, 'details' => $details, 'visible' => false, 'sort_order' => $i,
            ]);
        }
    }
}
