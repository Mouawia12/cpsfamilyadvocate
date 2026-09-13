<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['group', 'data'];

    protected $casts = [
        'data' => 'array',
    ];

    /**
     * The site-wide settings row. Stored defaults are merged under saved values
     * so keys added in later releases appear without a data migration.
     */
    public static function site(): self
    {
        $setting = static::firstOrCreate(['group' => 'site'], ['data' => static::defaults()]);
        $setting->data = array_replace_recursive(static::defaults(), $setting->data ?? []);

        return $setting;
    }

    public static function defaults(): array
    {
        return [
            'brandName' => 'Familist',
            'tagline' => 'CPS Family Advocate',
            'phoneDisplay' => '(907) 310-1560',
            'phoneNumber' => '+19073101560',
            'email' => 'familist@cpsfamilyadvocate.com',
            'whatsappNumber' => '19073101560',
            'whatsappMessage' => 'Hi, I need help with a CPS case',
            'address' => "3300 Arctic Blvd, Suite 201\nAnchorage, AK 99503",
            'hours' => 'Mo-Fr 09:00-17:00',
            'footerBlurb' => 'Advocating for Families, Supporting Communities. Professional clinical family advocacy with over 20 years of experience.',
            'disclaimer' => 'This service provides educational, advocacy, and clinical support using a familist, trauma-informed approach. It does not offer legal representation or legal advice. Services are designed to support parents, caregivers, and families navigating CPS processes in conjunction with legal counsel where applicable.',
            'crisisBar' => [
                'enabled' => true,
                'title' => 'Dealing with a CPS Crisis?',
                'text' => 'Get expert guidance now.',
            ],
            'pricing' => [
                'currency' => 'USD',
                'consultationPrice' => 150,
                'consultationMinutes' => 30,
                'trainingPrice' => 99,
            ],
            'integrations' => [
                'gaMeasurementId' => '',
                'spotifyShowUrl' => '',
            ],
            'social' => [
                'facebook' => '',
                'instagram' => '',
                'linkedin' => '',
                'youtube' => '',
            ],
        ];
    }
}
