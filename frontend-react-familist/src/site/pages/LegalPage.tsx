import { useLegalPage, useSettings } from '../data'
import PageShell from './PageShell'

export default function LegalPage({ pageKey }: { pageKey: 'privacy' | 'terms' | 'disclaimer' }) {
  const { data: page, isLoading } = useLegalPage(pageKey)
  const { data: settings } = useSettings()

  if (isLoading || !page) return <div className="page-loading" aria-busy="true" />

  return (
    <PageShell title={page.title} lead={page.updated ? `Last updated ${page.updated}` : undefined}
      documentTitle={`${page.title} | ${settings?.brandName ?? 'Familist'}`} narrow>
      <div className="prose" dangerouslySetInnerHTML={{ __html: page.body }} />
    </PageShell>
  )
}
