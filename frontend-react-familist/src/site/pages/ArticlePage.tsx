import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useArticle, useSettings } from '../data'
import { useSiteUi } from '../SiteLayout'
import NotFoundPage from './NotFoundPage'

export default function ArticlePage() {
  const { slug = '' } = useParams()
  const { data: article, isLoading, isError } = useArticle(slug)
  const { data: settings } = useSettings()
  const { open } = useSiteUi()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    if (article) document.title = `${article.seo_title || article.title} | ${settings?.brandName ?? 'Familist'}`
  }, [article, settings])

  if (isError) return <NotFoundPage />
  if (isLoading || !article) return <div className="page-loading" aria-busy="true" />

  const published = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  return (
    <article className="inner-page article-page">
      <div className="inner-page-hero narrow">
        <p className="article-breadcrumb">
          <Link to="/articles">Articles</Link>
          {article.category && (
            <>
              {' / '}
              <Link to={`/articles?category=${article.category.slug}`}>{article.category.name}</Link>
            </>
          )}
        </p>
        <h1>{article.title}</h1>
        <p className="article-meta">
          {[article.author, published, article.read_time].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="inner-page-body narrow">
        {article.image_url && <img className="article-hero-image" src={article.image_url} alt="" />}
        <div className="prose" dangerouslySetInnerHTML={{ __html: article.body ?? '' }} />

        {article.faqs.length > 0 && (
          <div className="article-faqs">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-container">
              {article.faqs.map((f, i) => (
                <div className={`faq-item${openFaq === i ? ' active' : ''}`} key={i}>
                  <button type="button" className="faq-question" aria-expanded={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <h4>{f.q}</h4>
                    <div className="faq-icon" aria-hidden="true" />
                  </button>
                  <div className="faq-answer">
                    {f.a.split(/\n{2,}/).map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="inline-cta article-cta">
          <div className="inline-cta-content">
            <h4>Need Guidance on Your CPS Case?</h4>
            <p>Schedule an urgent consultation with our licensed clinician.</p>
          </div>
          <button type="button" className="btn btn-primary btn-arrow" onClick={() => open('booking')}>
            Book Now
          </button>
        </div>
      </div>
    </article>
  )
}
