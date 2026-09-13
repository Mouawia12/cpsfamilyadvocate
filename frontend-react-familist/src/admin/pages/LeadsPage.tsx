import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api'
import { adminApi } from '../api/adminApi'
import { Badge, Button, EmptyState, ErrorNote, PageTitle, formatDate, inputCls } from '../components/ui'

const SOURCE: Record<string, string> = { guides: 'Free guides form', exit_popup: 'Exit pop-up', newsletter: 'Newsletter' }
const ROLE: Record<string, string> = { parent: 'Parent', caregiver: 'Caregiver', attorney: 'Attorney / GAL', social_worker: 'Social worker', other: 'Other' }

export default function LeadsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-leads', { search, page }],
    queryFn: () => adminApi.leads({ search: search || undefined, page }),
    placeholderData: (prev) => prev,
  })

  const del = useMutation({
    mutationFn: (id: number) => adminApi.deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leads'] }),
  })

  const exportCsv = async () => {
    try {
      const blob = await adminApi.exportLeads()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `familist-signups-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(apiErrorMessage(e, 'Export failed'))
    }
  }

  return (
    <div>
      <PageTitle
        title="Sign-ups"
        hint="People who asked for the free guides or newsletter. Export them to your email tool (Mailchimp, Brevo, …)."
        actions={<Button variant="secondary" onClick={exportCsv}>Download CSV</Button>}
      />
      <ErrorNote message={error} />
      <input className={`${inputCls} mb-4 max-w-[300px]`} placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />

      {!isLoading && data?.items.length === 0 ? (
        <EmptyState>No sign-ups yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-stone bg-white">
          <table className="w-full border-collapse text-[0.88rem]">
            <thead>
              <tr className="bg-cream text-left text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data?.items.map((l) => (
                <tr key={l.id} className="border-t border-stone">
                  <td className="px-4 py-3 font-semibold text-navy">{l.first_name || '—'}</td>
                  <td className="px-4 py-3"><a href={`mailto:${l.email}`} className="hover:text-gold">{l.email}</a></td>
                  <td className="px-4 py-3 text-muted">{l.role ? ROLE[l.role] ?? l.role : '—'}</td>
                  <td className="px-4 py-3"><Badge>{SOURCE[l.source] ?? l.source}</Badge></td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(l.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="danger" onClick={() => confirm(`Delete ${l.email}?`) && del.mutate(l.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-[0.9rem]">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Button>
          <span className="text-muted">Page {data.meta.current_page} of {data.meta.last_page} · {data.meta.total} total</span>
          <Button variant="secondary" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  )
}
