import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { money } from '@/site/data'
import { adminApi, type Order } from '../api/adminApi'
import { Badge, Button, EmptyState, PageTitle, formatDate, inputCls } from '../components/ui'

const STATUS: Record<Order['status'], { label: string; tone: 'amber' | 'green' | 'neutral' | 'red' }> = {
  pending: { label: 'New / unpaid', tone: 'amber' },
  paid: { label: 'Paid', tone: 'green' },
  fulfilled: { label: 'Completed', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

const METHOD: Record<string, string> = { phone: 'Phone call', video: 'Video call', whatsapp: 'WhatsApp' }

export default function OrdersPage() {
  const qc = useQueryClient()
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', { kind, status, search, page }],
    queryFn: () => adminApi.orders({ kind: kind || undefined, status: status || undefined, search: search || undefined, page }),
    placeholderData: (prev) => prev,
  })

  const update = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Order['status'] }) => adminApi.updateOrder(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  return (
    <div>
      <PageTitle
        title="Bookings & payments"
        hint="Urgent consultation requests and training enrollments. Orders paid through Stripe are marked Paid automatically; mark them Completed once handled."
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <input className={`${inputCls} max-w-[260px]`} placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select className={`${inputCls} max-w-[200px]`} value={kind} onChange={(e) => { setKind(e.target.value); setPage(1) }}>
          <option value="">All types</option>
          <option value="consultation">Consultations</option>
          <option value="training">Training</option>
        </select>
        <select className={`${inputCls} max-w-[200px]`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {!isLoading && data?.items.length === 0 ? (
        <EmptyState>No bookings yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-stone bg-white">
          <table className="w-full border-collapse text-[0.88rem]">
            <thead>
              <tr className="bg-cream text-left text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((o) => (
                <tr key={o.id} className="border-t border-stone align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy">{o.name}</div>
                    <a href={`mailto:${o.email}`} className="block text-muted hover:text-navy">{o.email}</a>
                    {o.phone && <a href={`tel:${o.phone}`} className="block text-muted hover:text-navy">{o.phone}</a>}
                  </td>
                  <td className="px-4 py-3">
                    <div>{o.kind === 'training' ? 'Crisis training' : 'Urgent consultation'}</div>
                    <div className="text-[0.78rem] text-muted">
                      {formatDate(o.created_at)}{o.contact_method ? ` · prefers ${METHOD[o.contact_method] ?? o.contact_method}` : ''}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {money(o.amount, o.currency)}
                    {o.paid_at && <div className="text-[0.75rem] text-muted">paid {formatDate(o.paid_at)}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="mb-1"><Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge></div>
                    <select
                      aria-label="Change status"
                      className="rounded border border-stone bg-white px-2 py-1 text-[0.8rem]"
                      value={o.status}
                      onChange={(e) => update.mutate({ id: o.id, status: e.target.value as Order['status'] })}
                    >
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
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
          <span className="text-muted">Page {data.meta.current_page} of {data.meta.last_page}</span>
          <Button variant="secondary" disabled={page >= data.meta.last_page} onClick={() => setPage((p) => p + 1)}>Next →</Button>
        </div>
      )}
    </div>
  )
}
