import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadAnalytics, revokeAnalytics, saveConsent, storedConsent, type Consent } from '../lib/analytics'

interface Props {
  measurementId: string
  forceOpen: boolean
  onClosed: () => void
}

/**
 * Asks for analytics consent only when GA4 is configured. Accepting loads GA;
 * declining (or never answering) keeps Google scripts off the page entirely.
 */
export default function CookieBanner({ measurementId, forceOpen, onClosed }: Props) {
  const enabled = Boolean(measurementId)
  const [consent, setConsent] = useState<Consent | null>(() => storedConsent())

  useEffect(() => {
    if (enabled && consent === 'granted') loadAnalytics(measurementId)
  }, [enabled, consent, measurementId])

  const choose = (value: Consent) => {
    saveConsent(value)
    if (value === 'denied') revokeAnalytics()
    setConsent(value)
    onClosed()
  }

  if (!enabled || (consent !== null && !forceOpen)) return null

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <p>
        We use optional analytics cookies to understand how visitors use this site. They are only set if you accept.{' '}
        <Link to="/privacy">Privacy Policy</Link>
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="btn btn-sm btn-outline" onClick={() => choose('denied')}>
          Decline
        </button>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => choose('granted')}>
          Accept
        </button>
      </div>
    </div>
  )
}
