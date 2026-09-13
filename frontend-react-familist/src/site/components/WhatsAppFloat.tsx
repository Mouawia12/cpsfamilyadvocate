import type { SiteSettings } from '../types'
import { track } from '../lib/analytics'
import Icon from './Icon'

export function whatsappHref(settings: SiteSettings) {
  const number = settings.whatsappNumber.replace(/\D/g, '')
  return `https://wa.me/${number}${settings.whatsappMessage ? `?text=${encodeURIComponent(settings.whatsappMessage)}` : ''}`
}

export default function WhatsAppFloat({ settings }: { settings: SiteSettings }) {
  if (!settings.whatsappNumber) return null

  return (
    <div className="whatsapp-float">
      <div className="whatsapp-tooltip">Chat with us on WhatsApp</div>
      <a
        href={whatsappHref(settings)}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn"
        aria-label="Chat on WhatsApp"
        onClick={() => track('whatsapp_click', { event_category: 'Contact' })}
      >
        <Icon name="whatsapp" />
      </a>
    </div>
  )
}
