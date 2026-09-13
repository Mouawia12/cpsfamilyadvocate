import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useArticles, useCategories, useSettings } from '../data'
import PageShell from './PageShell'

export default function ArticlesPage() {
  const { data: settings } = useSettings()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? 1)
  const category = params.get('category') ?? ''
  const [search, setSearch] = useState(params.get('q') ?? '')
  const { data: categories } = useCategories()
  const { data, isLoading } = useArticles({ page, category: category || undefined, search: params.get('q') || undefined })

  const update = (next: Record<string, string>) => {
    const merged = { ...Object.fromEntries(params), ...next }
    Object.keys(merged).forEach((k) => !merged[k] && delete merged[k])
    setParams(merged)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PageShell
      eyebrow="Articles"
      title="Guidance for Families Navigating CPS"
      lead="Practical, clinician-written articles on parent rights, case plans, reunification and caregiving."
      documentTitle={`Articles | ${settings?.brandName ?? 'Familist'}`}
    >
      <div className="articles-toolbar">
        <div className="topic-list articles-filter">
          <button type="button" className={!category ? 'is-active' : undefined} onClick={() => update({ category: '', page: '' })}>
            All
          </button>
          {categories
            ?.filter((c) => c.articles_count > 0)
            .map((c) => (
              <button type="button" key={c.slug} className={category === c.slug ? 'is-active' : undefined}
                onClick={() => update({ category: c.slug, page: '' })}>
                {c.name}
              </button>
            ))}
        </div>
        <form
          className="articles-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            update({ q: search.trim(), page: '' })
          }}
        >
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles" aria-label="Search articles" />
        </form>
      </div>

      {isLoading && <p className="muted">Loading articles…</p>}
      {data && data.items.length === 0 && <p className="muted">No articles found.</p>}

      <div className="articles-grid">
        {data?.items.map((a) => (
          <Link to={`/articles/${a.slug}`} className="article-card" key={a.id}>
            {a.image_url && <img src={a.image_url} alt="" loading="lazy" />}
            <div className="article-card-body">
              {a.category && <div className="article-card-category">{a.category.name}</div>}
              <h3>{a.title}</h3>
              {a.excerpt && <p>{a.excerpt}</p>}
              <span className="card-link">{a.read_time ? `${a.read_time} · ` : ''}Read Article →</span>
            </div>
          </Link>
        ))}
      </div>

      {data && data.meta.last_page > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button type="button" className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>
            ← Previous
          </button>
          <span>
            Page {data.meta.current_page} of {data.meta.last_page}
          </span>
          <button type="button" className="btn btn-sm btn-outline" disabled={page >= data.meta.last_page} onClick={() => update({ page: String(page + 1) })}>
            Next →
          </button>
        </nav>
      )}
    </PageShell>
  )
}
