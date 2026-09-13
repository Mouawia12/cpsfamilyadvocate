/**
 * Google Analytics 4 behind cookie consent. Nothing is requested from Google
 * until the visitor accepts; the choice is remembered in localStorage and can
 * be changed from the footer ("Cookie settings").
 */
const CONSENT_KEY = 'familist_cookie_consent'

export type Consent = 'granted' | 'denied'

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

let loadedId: string | null = null

export function storedConsent(): Consent | null {
  try {
    const value = localStorage.getItem(CONSENT_KEY)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function saveConsent(consent: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, consent)
  } catch {
    /* storage blocked — the banner will simply ask again next visit */
  }
}

export function loadAnalytics(measurementId: string) {
  if (!/^G-[A-Z0-9]+$/.test(measurementId) || loadedId === measurementId) return
  loadedId = measurementId

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js expects the Arguments object itself, not an array copy.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  })
  window.gtag('js', new Date())
  window.gtag('config', measurementId, { anonymize_ip: true })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  document.head.appendChild(script)
}

/** Revoke: stop further collection this session and remove GA cookies. */
export function revokeAnalytics() {
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim()
    if (name === '_ga' || name.startsWith('_ga_')) {
      const domain = location.hostname.replace(/^www\./, '')
      document.cookie = `${name}=; Max-Age=0; path=/; domain=.${domain}`
      document.cookie = `${name}=; Max-Age=0; path=/`
    }
  })
}

export function track(event: string, params: Record<string, unknown> = {}) {
  window.gtag?.('event', event, params)
}

/** Record a virtual page view on client-side navigation. */
export function trackPageView(path: string) {
  if (loadedId) {
    window.gtag?.('event', 'page_view', { page_path: path, page_location: location.href, page_title: document.title })
  }
}
