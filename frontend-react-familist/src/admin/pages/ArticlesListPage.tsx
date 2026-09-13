import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminApi } from '../api/adminApi'
import { Badge, Button, EmptyState, PageTitle, inputCls } from '../components/ui'

export default function ArticlesListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles', { search, status, page }],
    queryFn: () => adminApi.articles({ search: search || undefined, status: status || undefined, page, per_page: 20 }),
    placeholderData: (prev) => prev,
  })

  const del = useMutation({
    mutationFn: (slug: string) => adminApi.deleteArticle(slug),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-articles'] }),
  })

  const meta = data?.meta
  const items = data?.items ?? []

  return (
    <div>
      <PageTitle
        title="Articles"
        hint="Blog articles with their SEO fields. Drafts are not visible on the website."
        actions={
          <>
            <Link to="/admin/import" className="rounded-btn border border-stone bg-white px-4 py-2 text-[0.88rem] font-semibold text-navy hover:border-gold">
              Import from Word
            </Link>
            <Link to="/admin/articles/new" className="rounded-btn bg-navy px-4 py-2 text-[0.88rem] font-semibold text-white hover:bg-gold hover:text-navy">
              + New article
            </Link>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search by title…"
          className={`${inputCls} max-w-[320px]`}
        />
        <select className={`${inputCls} max-w-[180px]`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {!isLoading && items.length === 0 ? (
        <EmptyState>No articles yet. Create one or import your Word file.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-stone bg-white">
          <table className="w-full border-collapse text-[0.9rem]">
            <thead>
              <tr className="bg-cream text-left text-[0.72rem] uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3 font-bold">Title</th>
                <th className="px-4 py-3 font-bold">Category</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">Loading…</td></tr>
              )}
              {items.map((a) => (
                <tr key={a.id} className="border-t border-stone align-top">
                  <td className="px-4 py-3">
                    <Link to={`/admin/articles/${a.slug}/edit`} className="font-semibold text-navy hover:text-gold">{a.title}</Link>
                    {a.featured && <span className="ml-2"><Badge tone="gold">Featured</Badge></span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{a.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.status === 'published' ? 'green' : 'neutral'}>{a.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {a.status === 'published' && (
                      <a href={`/articles/${a.slug}`} target="_blank" rel="noopener noreferrer" className="mr-3 font-semibold text-muted hover:text-navy">View</a>
                    )}
                    <Link to={`/admin/articles/${a.slug}/edit`} className="font-semibold text-navy hover:text-gold">Edit</Link>
                    <Button variant="danger" className="ml-3" onClick={() => confirm(`Delete "${a.title}"? This cannot be undone.`) && del.mutate(a.slug)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-[0.9rem]">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
          <span className="text-muted">Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
          <Button variant="secondary" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  )
}
