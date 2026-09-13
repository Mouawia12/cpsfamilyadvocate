<?php

namespace App\Support;

class JsonContent
{
    /**
     * Laravel's ConvertEmptyStringsToNull middleware turns every "" in a request
     * into null. Page content and settings are free-form JSON edited as text
     * fields, so restore empty strings to keep the stored shape stable.
     */
    public static function restoreEmptyStrings(array $data): array
    {
        array_walk_recursive($data, function (&$value) {
            $value ??= '';
        });

        return $data;
    }
}
