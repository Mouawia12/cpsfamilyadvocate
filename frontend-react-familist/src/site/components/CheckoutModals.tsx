import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'
import type { HomeContent, SiteSettings } from '../types'
import { money } from '../data'
import { formValues, useCheckout } from '../lib/forms'

interface DialogProps {
  open: boolean
  onClose: () => void
  label: string
  children: ReactNode
}

/** The design's `.modal-overlay` dialog, with focus moved inside on open. */
function Dialog({ open, onClose, label, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // Wait a frame: the overlay only becomes focusable once `.active` makes it visible.
    const frame = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>('input:not(.hp-field), select, button:not(.modal-close)')?.focus(),
    )
    return () => cancelAnimationFrame(frame)
  }, [open])

  return (
    <div
      className={`modal-overlay${open ? ' active' : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden={!open}
    >
      <div className="modal-content" role="dialog" aria-modal="true" aria-label={label} ref={ref}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close" tabIndex={open ? 0 : -1}>
          &times;
        </button>
        {open && children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId()
  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {children(id)}
    </div>
  )
}

/** Invisible to people; bots fill it and the API discards the submission. */
function Honeypot() {
  return <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp-field" aria-hidden="true" />
}

interface ModalProps {
  open: boolean
  onClose: () => void
  settings: SiteSettings
}

export function BookingModal({ open, onClose, settings, content }: ModalProps & { content: HomeContent['bookingModal'] }) {
  const { status, error, submit, reset } = useCheckout()
  const { pricing } = settings
  const price = money(pricing.consultationPrice, pricing.currency)

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = formValues(e.currentTarget)
    submit({ kind: 'consultation', name: v.name, email: v.email, phone: v.phone, contact_method: v.contact_method, website: v.website })
  }

  return (
    <Dialog open={open} onClose={onClose} label={content.title}>
      <div className="modal-header">
        <h3>{content.title}</h3>
        <p>{content.text}</p>
      </div>
      <div className="modal-body">
        {status === 'done' ? (
          <div className="form-success">
            <h3>✓ {content.successTitle}</h3>
            <p>{content.successText}</p>
            <p>
              <strong>For immediate assistance:</strong>
              <br />
              <a href={`tel:${settings.phoneNumber}`}>{settings.phoneDisplay}</a>
            </p>
          </div>
        ) : (
          <>
            <div className="booking-details">
              <div className="booking-detail">
                <strong>{pricing.consultationMinutes}</strong>
                <span>Minutes</span>
              </div>
              <div className="booking-detail">
                <strong>{price}</strong>
                <span>One-Time Fee</span>
              </div>
            </div>
            <form onSubmit={onSubmit}>
              <Honeypot />
              <Field label="Your Name">
                {(id) => <input id={id} type="text" name="name" required maxLength={120} placeholder="Full name" autoComplete="name" />}
              </Field>
              <Field label="Email Address">
                {(id) => <input id={id} type="email" name="email" required placeholder="your@email.com" autoComplete="email" />}
              </Field>
              <Field label="Phone Number">
                {(id) => <input id={id} type="tel" name="phone" required placeholder="(555) 123-4567" autoComplete="tel" />}
              </Field>
              <Field label="Preferred Contact Method">
                {(id) => (
                  <select id={id} name="contact_method">
                    <option value="phone">Phone Call</option>
                    <option value="video">Video Call (Zoom)</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                )}
              </Field>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="form-submit" disabled={status === 'sending'}>
                {status === 'sending' ? 'Please wait…' : `${content.button} ${price}`}
              </button>
            </form>
            <p className="form-note">{content.note}</p>
          </>
        )}
      </div>
    </Dialog>
  )
}

export function TrainingModal({ open, onClose, settings, content }: ModalProps & { content: HomeContent['trainingModal'] }) {
  const { status, error, submit, reset } = useCheckout()
  const { pricing } = settings
  const price = money(pricing.trainingPrice, pricing.currency)

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = formValues(e.currentTarget)
    submit({ kind: 'training', name: v.name, email: v.email, website: v.website })
  }

  return (
    <Dialog open={open} onClose={onClose} label={content.title}>
      <div className="modal-header modal-header-training">
        <h3>{content.title}</h3>
        <p>{content.text}</p>
      </div>
      <div className="modal-body">
        {status === 'done' ? (
          <div className="form-success form-success-training">
            <h3>✓ {content.successTitle}</h3>
            <p>{content.successText}</p>
            <p className="form-note">Check your inbox (and spam folder) for access details.</p>
          </div>
        ) : (
          <>
            <div className="booking-details">
              <div className="booking-detail">
                <strong>{price}</strong>
                <span>One-Time Fee</span>
              </div>
              <div className="booking-detail">
                <strong>∞</strong>
                <span>Lifetime Access</span>
              </div>
            </div>
            <div className="training-includes">
              <strong>{content.featuresTitle}</strong>
              <ul>
                {content.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <form onSubmit={onSubmit}>
              <Honeypot />
              <Field label="Your Name">
                {(id) => <input id={id} type="text" name="name" required maxLength={120} placeholder="Full name" autoComplete="name" />}
              </Field>
              <Field label="Email Address">
                {(id) => <input id={id} type="email" name="email" required placeholder="your@email.com" autoComplete="email" />}
              </Field>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="btn-primary btn-training" disabled={status === 'sending'}>
                {status === 'sending' ? 'Please wait…' : `${content.button} — ${price}`}
              </button>
            </form>
            <p className="training-note">{content.note}</p>
          </>
        )}
      </div>
    </Dialog>
  )
}

export { Honeypot }
