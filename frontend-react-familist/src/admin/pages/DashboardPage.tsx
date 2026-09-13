import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { adminApi } from '../api/adminApi'
import { Badge, Card, PageTitle, formatDate } from '../components/ui'
import { money } from '@/site/data'

function Stat({ label, value, to }: { label: string; value: string | number; to: string }) {
  return (
    <Link to={to} className="rounded-[10px] border border-stone bg-white p-5 transition-colors hover:border-gold">
      <div className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-muted">{label}</div>
      <div className="mt-2 font-serif text-[2rem] text-navy">{value}</div>
    </Link>
  )
}

function Check({ ok, label, hint }: { ok: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${ok ? 'bg-[#e4efe6] text-[#2e5a44]' : 'bg-[#fbf0d9] text-[#8a6112]'}`}>
        {ok ? '✓' : '!'}
      </span>
      <div>
        <div className="text-[0.92rem] font-semibold text-navy">{label}</div>
        {!ok && <div className="text-[0.8rem] text-muted">{hint}</div>}
      </div>
    </li>
  )
}

const statusTone = { pending: 'amber', paid: 'green', fulfilled: 'neutral', cancelled: 'red' } as const

export default function DashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.stats })
  const { data: settings } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings })

  return (
    <div>
      <PageTitle title="Overview" hint="A quick look at your website activity and setup." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="New requests" value={stats?.ordersPending ?? '—'} to="/admin/orders" />
        <Stat label="Paid" value={stats ? money(stats.revenue) : '—'} to="/admin/orders" />
        <Stat label="Sign-ups this week" value={stats?.leadsThisWeek ?? '—'} to="/admin/leads" />
        <Stat label="Published articles" value={stats?.published ?? '—'} to="/admin/articles" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-[1.2rem] text-navy">Recent bookings & enrollments</h2>
            <Link to="/admin/orders" className="text-[0.85rem] font-semibold text-navy hover:text-gold">View all →</Link>
          </div>
          {stats && stats.recentOrders.length === 0 && <p className="text-[0.9rem] text-muted">No requests yet.</p>}
          <ul className="divide-y divide-stone">
            {stats?.recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-[0.9rem]">
                <div>
                  <div className="font-semibold text-navy">{o.name}</div>
                  <div className="text-[0.78rem] text-muted">
                    {o.kind === 'training' ? 'Crisis training' : 'Urgent consultation'} · {formatDate(o.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted">{money(o.amount)}</span>
                  <Badge tone={statusTone[o.status]}>{o.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-1 font-serif text-[1.2rem] text-navy">Setup checklist</h2>
          <ul>
            <Check ok={Boolean(stats?.integrations.stripe)} label="Online payments (Stripe)" hint="Add the Stripe secret key on the server (.env). Until then, requests are saved and emailed for manual follow-up." />
            <Check ok={Boolean(stats?.integrations.stripeWebhook)} label="Payment confirmations (Stripe webhook)" hint="Add the webhook signing secret so paid orders are marked automatically." />
            <Check ok={Boolean(stats?.integrations.mail)} label="Email notifications" hint="Add SMTP details on the server so new requests reach your inbox." />
            <Check ok={Boolean(settings?.integrations.gaMeasurementId)} label="Google Analytics" hint="Paste your GA4 Measurement ID in Settings." />
            <Check ok={Boolean(settings?.integrations.spotifyShowUrl) || Boolean(stats?.episodes)} label="Podcast" hint="Add your Spotify show link in Settings or add episodes." />
            <Check ok={Boolean(stats?.testimonialsVisible)} label="Testimonials" hint="Testimonials are hidden until you publish real ones (with client consent)." />
          </ul>
        </Card>
      </div>
    </div>
  )
}
