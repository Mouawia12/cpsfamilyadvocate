import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { apiGet } from '@/lib/api'
import { useSettings } from '../data'
import { useSiteUi } from '../SiteLayout'
import SectionLink from '../components/SectionLink'
import PageShell from './PageShell'

export default function CheckoutResultPage({ outcome }: { outcome: 'success' | 'cancelled' }) {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id') ?? ''
  const { data: settings } = useSettings()
  const { open } = useSiteUi()
  const { data: order } = useQuery({
    queryKey: ['checkout', sessionId],
    queryFn: () => apiGet<{ kind: 'consultation' | 'training'; status: string }>(`/checkout/${sessionId}`),
    enabled: outcome === 'success' && sessionId.startsWith('cs_'),
    retry: false,
  })

  if (outcome === 'cancelled') {
    const kind = params.get('kind') === 'training' ? 'training' : 'booking'
    return (
      <PageShell title="Payment Not Completed" lead="No charge was made. You can try again whenever you are ready." narrow>
        <div className="result-actions">
          <button type="button" className="btn btn-primary" onClick={() => open(kind)}>Try Again</button>
          {settings && <a className="btn btn-outline" href={`tel:${settings.phoneNumber}`}>Call {settings.phoneDisplay}</a>}
        </div>
      </PageShell>
    )
  }

  const training = order?.kind === 'training'

  return (
    <PageShell
      eyebrow="Payment received"
      title={training ? 'Thank You for Enrolling' : 'Thank You — Your Consultation Is Booked'}
      lead={
        training
          ? 'We will email your training access details shortly. Please check your inbox and spam folder.'
          : 'We will contact you shortly to confirm your consultation time.'
      }
      documentTitle="Thank you"
      narrow
    >
      <div className="result-actions">
        <SectionLink to="top" className="btn btn-primary">Back to Home</SectionLink>
        {settings && <a className="btn btn-outline" href={`tel:${settings.phoneNumber}`}>Need help now? {settings.phoneDisplay}</a>}
      </div>
    </PageShell>
  )
}
