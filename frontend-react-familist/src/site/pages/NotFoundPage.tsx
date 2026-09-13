import SectionLink from '../components/SectionLink'
import PageShell from './PageShell'

export default function NotFoundPage() {
  return (
    <PageShell title="Page Not Found" lead="The page you are looking for may have moved." documentTitle="Page not found" narrow>
      <div className="result-actions">
        <SectionLink to="top" className="btn btn-primary">Back to Home</SectionLink>
      </div>
    </PageShell>
  )
}
