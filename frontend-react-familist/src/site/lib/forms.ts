import { useCallback, useState } from 'react'
import { apiErrorMessage, apiPost } from '@/lib/api'
import { track } from './analytics'

type Status = 'idle' | 'sending' | 'done' | 'error'

export interface CheckoutInput {
  kind: 'consultation' | 'training'
  name: string
  email: string
  phone?: string
  contact_method?: string
  website?: string
}

/**
 * Paid request → the API decides the price and, when Stripe is configured,
 * returns a hosted Checkout URL we redirect to. Otherwise the request is saved
 * and the modal shows the confirmation text.
 */
export function useCheckout() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const submit = async (input: CheckoutInput) => {
    setStatus('sending')
    setError('')
    try {
      const res = await apiPost<{ requiresPayment: boolean; checkoutUrl: string | null }>('/checkout', input)
      track(input.kind === 'training' ? 'training_enrollment_start' : 'booking_submit', { event_category: 'Conversions' })
      if (res.requiresPayment && res.checkoutUrl) {
        window.location.assign(res.checkoutUrl)
        return
      }
      setStatus('done')
    } catch (e) {
      setError(apiErrorMessage(e, 'We could not send your request. Please try again or call us.'))
      setStatus('error')
    }
  }

  const reset = useCallback(() => setStatus('idle'), [])

  return { status, error, submit, reset }
}

export interface LeadInput {
  first_name?: string
  email: string
  role?: string
  source: 'guides' | 'exit_popup' | 'newsletter'
  website?: string
}

export function useLead() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const submit = async (input: LeadInput) => {
    setStatus('sending')
    setError('')
    try {
      await apiPost('/leads', input)
      track(input.source === 'exit_popup' ? 'exit_popup_submit' : 'lead_form_submit', { event_category: 'Lead Generation' })
      setStatus('done')
    } catch (e) {
      setError(apiErrorMessage(e, 'Something went wrong. Please try again.'))
      setStatus('error')
    }
  }

  return { status, error, submit }
}

/** Read a <form> into a plain object of its named fields. */
export function formValues(form: HTMLFormElement): Record<string, string> {
  return Object.fromEntries(Array.from(new FormData(form).entries()).map(([k, v]) => [k, String(v)]))
}
