import { useEffect, useRef, useState } from 'react'
import type { SiteSettings } from '../types'
import { money } from '../data'
import { useSiteUi } from '../SiteLayout'
import Icon from './Icon'

const DISMISS_KEY = 'familist_crisis_dismissed'

export default function CrisisBar({ settings }: { settings: SiteSettings }) {
  const { open } = useSiteUi()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  const barRef = useRef<HTMLDivElement>(null)

  // The header sits below the bar; the design hard-coded its height (52px) but
  // the real height varies with text length and viewport, so measure it.
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const observer = new ResizeObserver(() =>
      document.documentElement.style.setProperty('--crisis-bar-height', `${bar.offsetHeight}px`),
    )
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (dismissed || !settings.crisisBar.enabled) return
    const onScroll = () => setVisible(window.scrollY > 300)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [dismissed, settings.crisisBar.enabled])

  if (!settings.crisisBar.enabled) return null

  const dismiss = () => {
    setDismissed(true)
    setVisible(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  const { pricing } = settings

  return (
    <div ref={barRef} className={`crisis-bar${visible && !dismissed ? ' visible' : ''}`} aria-hidden={!visible || dismissed}>
      <div className="crisis-bar-content">
        <div className="crisis-icon">
          <Icon name="alert" />
        </div>
        <span className="crisis-text">
          <strong>{settings.crisisBar.title}</strong> {settings.crisisBar.text}
        </span>
      </div>
      <button type="button" className="crisis-cta" onClick={() => open('booking')} tabIndex={visible ? 0 : -1}>
        Book Urgent Consultation — {money(pricing.consultationPrice, pricing.currency)}
      </button>
      <button type="button" className="crisis-close" onClick={dismiss} aria-label="Dismiss" tabIndex={visible ? 0 : -1}>
        &times;
      </button>
    </div>
  )
}
