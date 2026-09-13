<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Security headers for HTML pages. The Content-Security-Policy uses a per-request
 * nonce (shared with SpaController for the inline state script) and allows only
 * the third parties the site actually uses: Google Analytics (after consent),
 * Spotify / YouTube / Vimeo embeds. Stripe Checkout is a redirect, so no Stripe
 * scripts are needed.
 */
class SecurityHeaders
{
    /** One nonce per request, stored on the request so long-lived workers never reuse it. */
    public static function nonce(): string
    {
        $attributes = request()->attributes;
        if (! $attributes->has('csp_nonce')) {
            $attributes->set('csp_nonce', base64_encode(random_bytes(18)));
        }

        return $attributes->get('csp_nonce');
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        if (str_contains((string) $response->headers->get('Content-Type'), 'text/html')) {
            $response->headers->set('Content-Security-Policy', implode('; ', [
                "default-src 'self'",
                "script-src 'self' 'nonce-".static::nonce()."' https://www.googletagmanager.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https://*.google-analytics.com https://*.googletagmanager.com",
                "font-src 'self'",
                "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
                'frame-src https://open.spotify.com https://www.youtube-nocookie.com https://player.vimeo.com',
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
            ]));
        }

        return $response;
    }
}
