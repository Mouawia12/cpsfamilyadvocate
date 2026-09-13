import { useEffect, type ReactNode } from 'react'

/** Inner-page frame (articles, podcast, legal) in the design's typography. */
export default function PageShell({
  eyebrow,
  title,
  lead,
  documentTitle,
  children,
  narrow = false,
}: {
  eyebrow?: string
  title: string
  lead?: ReactNode
  documentTitle?: string
  children: ReactNode
  narrow?: boolean
}) {
  useEffect(() => {
    if (documentTitle) document.title = documentTitle
  }, [documentTitle])

  return (
    <div className="inner-page">
      <div className={`inner-page-hero${narrow ? ' narrow' : ''}`}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {lead && <p className="inner-page-lead">{lead}</p>}
      </div>
      <div className={`inner-page-body${narrow ? ' narrow' : ''}`}>{children}</div>
    </div>
  )
}
