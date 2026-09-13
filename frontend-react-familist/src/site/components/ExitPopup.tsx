import { useEffect, useState, type FormEvent } from 'react'
import type { HomeContent } from '../types'
import { useSiteUi } from '../SiteLayout'
import { formValues, useLead } from '../lib/forms'
import { Honeypot } from './CheckoutModals'
import Icon from './Icon'

const SHOWN_KEY = 'familist_exit_popup_shown'

/** Shown once per session when a desktop visitor's pointer leaves the top of the window. */
export default function ExitPopup({ content }: { content: HomeContent['exitPopup'] }) {
  const { modal, open, close } = useSiteUi()
  const { status, error, submit } = useLead()
  const [armed, setArmed] = useState(() => {
    try {
      return sessionStorage.getItem(SHOWN_KEY) !== '1'
    } catch {
      return true
    }
  })

  useEffect(() => {
    if (!armed || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const onLeave = (e: MouseEvent) => {
      if (e.clientY < 10 && !e.relatedTarget && modal === null) {
        setArmed(false)
        try {
          sessionStorage.setItem(SHOWN_KEY, '1')
        } catch {
          /* ignore */
        }
        open('exit')
      }
    }
    document.addEventListener('mouseout', onLeave)
    return () => document.removeEventListener('mouseout', onLeave)
  }, [armed, modal, open])

  const isOpen = modal === 'exit'

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = formValues(e.currentTarget)
    submit({ email: v.email, source: 'exit_popup', website: v.website })
  }

  return (
    <div
      className={`exit-popup${isOpen ? ' active' : ''}`}
      onClick={(e) => e.target === e.currentTarget && close()}
      aria-hidden={!isOpen}
    >
      <div className="exit-popup-content" role="dialog" aria-modal="true" aria-label={content.title}>
        <button type="button" className="exit-popup-close" onClick={close} aria-label="Close" tabIndex={isOpen ? 0 : -1}>
          &times;
        </button>
        <div className="exit-popup-header">
          <div className="exit-popup-icon">
            <Icon name="file" />
          </div>
          <h3>{content.title}</h3>
          <p>{content.text}</p>
        </div>
        <div className="exit-popup-body">
          {status === 'done' ? (
            <div className="form-success">
              <h3>✓ {content.successTitle}</h3>
              <p>{content.successText}</p>
              <button type="button" className="exit-popup-cta" onClick={() => open('booking')}>
                Book Consultation
              </button>
            </div>
          ) : (
            <>
              <div className="exit-popup-guides">
                {content.guides.map((g) => (
                  <div className="exit-guide-item" key={g}>
                    <Icon name="check" />
                    <span>{g}</span>
                  </div>
                ))}
              </div>
              {isOpen && (
                <form className="exit-popup-form" onSubmit={onSubmit}>
                  <Honeypot />
                  <input type="email" name="email" placeholder="Enter your email address" aria-label="Email address" required autoFocus />
                  <button type="submit" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Sending…' : content.button}
                  </button>
                </form>
              )}
              {error && <p className="form-error" role="alert">{error}</p>}
              <p className="exit-popup-skip">
                <button type="button" onClick={close}>
                  {content.skip}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
