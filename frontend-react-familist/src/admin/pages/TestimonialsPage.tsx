import { useState } from 'react'
import type { Testimonial } from '@/site/types'
import { adminApi, type AdminTestimonial } from '../api/adminApi'
import CollectionManager from '../components/CollectionManager'
import { Field, Toggle, inputCls } from '../components/ui'

const KINDS: { key: Testimonial['kind']; label: string }[] = [
  { key: 'text', label: 'Written testimonials' },
  { key: 'video', label: 'Video testimonials' },
  { key: 'case_study', label: 'Case studies' },
]

type Details = NonNullable<Testimonial['details']>

export default function TestimonialsPage() {
  const [kind, setKind] = useState<Testimonial['kind']>('text')

  return (
    <CollectionManager<AdminTestimonial>
      key={kind}
      title="Testimonials"
      hint={
        <>
          Each section only appears on the website when it has at least one <strong>visible</strong> item. Only publish real
          testimonials, with the client's written permission and without identifying details.
        </>
      }
      itemName={kind === 'case_study' ? 'case study' : 'testimonial'}
      queryKey="testimonials"
      params={{ kind }}
      api={adminApi.testimonials}
      sortable
      wide={kind === 'case_study'}
      toolbar={
        <div className="mb-4 flex gap-1 rounded-[8px] border border-stone bg-white p-1">
          {KINDS.map((k) => (
            <button key={k.key} type="button" onClick={() => setKind(k.key)}
              className={`flex-1 rounded-md px-3 py-2 text-[0.88rem] font-semibold ${kind === k.key ? 'bg-navy text-white' : 'text-navy hover:bg-cream'}`}>
              {k.label}
            </button>
          ))}
        </div>
      }
      blank={() => ({
        kind, name: '', role: '', quote: '', rating: kind === 'text' ? 5 : null, video_url: null, duration: '', visible: false, sort_order: 999,
        details: kind === 'case_study' ? { outcome: 'Reunified', type: '', title: '', challenge: '', approach: '', result: '', stats: [] } : null,
      })}
      summary={(t) => (
        <>
          <div className="font-semibold text-navy">{t.kind === 'case_study' ? t.details?.title || t.name : t.name}</div>
          <div className="line-clamp-1 text-[0.8rem] text-muted">{t.kind === 'case_study' ? t.details?.result : t.quote}</div>
        </>
      )}
      form={(d, set) => {
        const details = (d.details ?? {}) as Details
        const setDetails = (patch: Partial<Details>) => set({ details: { ...details, ...patch } })
        const stats = details.stats ?? []

        if (d.kind === 'case_study') {
          return (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Title">
                  <input className={inputCls} value={details.title ?? ''} onChange={(e) => set({ name: e.target.value, details: { ...details, title: e.target.value } })} required />
                </Field>
                <Field label="Case type">
                  <input className={inputCls} value={details.type ?? ''} onChange={(e) => setDetails({ type: e.target.value })} placeholder="Neglect Allegation" />
                </Field>
              </div>
              <Field label="Outcome label">
                <input className={inputCls} value={details.outcome ?? ''} onChange={(e) => setDetails({ outcome: e.target.value })} />
              </Field>
              <Field label="Challenge"><textarea className={inputCls} rows={3} value={details.challenge ?? ''} onChange={(e) => setDetails({ challenge: e.target.value })} /></Field>
              <Field label="Our approach"><textarea className={inputCls} rows={3} value={details.approach ?? ''} onChange={(e) => setDetails({ approach: e.target.value })} /></Field>
              <Field label="Result"><textarea className={inputCls} rows={2} value={details.result ?? ''} onChange={(e) => setDetails({ result: e.target.value })} /></Field>
              <div>
                <span className="mb-1 block text-[0.82rem] font-semibold text-navy">Numbers (up to 3)</span>
                <div className="flex flex-col gap-2">
                  {stats.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input className={`${inputCls} w-24`} value={s.value} placeholder="8" onChange={(e) => setDetails({ stats: stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} />
                      <input className={inputCls} value={s.label} placeholder="Months" onChange={(e) => setDetails({ stats: stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
                      <button type="button" className="px-2 text-[#b3261e]" aria-label="Remove" onClick={() => setDetails({ stats: stats.filter((_, j) => j !== i) })}>✕</button>
                    </div>
                  ))}
                </div>
                {stats.length < 3 && (
                  <button type="button" className="mt-2 text-[0.85rem] font-semibold text-navy hover:text-gold" onClick={() => setDetails({ stats: [...stats, { value: '', label: '' }] })}>+ Add number</button>
                )}
              </div>
              <Toggle checked={Boolean(d.visible)} onChange={(v) => set({ visible: v })} label="Visible on the website" />
            </>
          )
        }

        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name (initials or first name)">
                <input className={inputCls} value={d.name ?? ''} onChange={(e) => set({ name: e.target.value })} required />
              </Field>
              <Field label="Description">
                <input className={inputCls} value={d.role ?? ''} onChange={(e) => set({ role: e.target.value })} placeholder="Parent — Reunified in 8 months" />
              </Field>
            </div>
            <Field label="Quote">
              <textarea className={inputCls} rows={4} value={d.quote ?? ''} onChange={(e) => set({ quote: e.target.value })} required={d.kind === 'text'} />
            </Field>
            {d.kind === 'text' && (
              <Field label="Stars">
                <select className={inputCls} value={d.rating ?? ''} onChange={(e) => set({ rating: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">No stars</option>
                  {[5, 4, 3].map((n) => <option key={n} value={n}>{n} stars</option>)}
                </select>
              </Field>
            )}
            {d.kind === 'video' && (
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <Field label="YouTube or Vimeo link">
                  <input type="url" className={inputCls} value={d.video_url ?? ''} onChange={(e) => set({ video_url: e.target.value || null })} required />
                </Field>
                <Field label="Length">
                  <input className={inputCls} value={d.duration ?? ''} onChange={(e) => set({ duration: e.target.value })} placeholder="3:42" />
                </Field>
              </div>
            )}
            <Toggle checked={Boolean(d.visible)} onChange={(v) => set({ visible: v })} label="Visible on the website" />
          </>
        )
      }}
    />
  )
}
