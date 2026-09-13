import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api'
import { ICON_NAMES } from '@/site/components/Icon'
import type { HomeContent } from '@/site/types'
import { adminApi } from '../api/adminApi'
import { Button, ErrorNote, ImageInput, PageTitle, Toggle, inputCls, move, useSavedFlash } from '../components/ui'

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

/** Sections in page order, with names and where they appear. */
const SECTIONS: { key: keyof HomeContent; name: string; hint: string; anchor?: string }[] = [
  { key: 'seo', name: 'Google & social sharing', hint: 'Title and description shown in Google results and when the link is shared.' },
  { key: 'hero', name: 'Top of page (hero)', hint: 'The first thing visitors see.' },
  { key: 'credentialsBar', name: 'Credentials strip', hint: 'Dark strip under the hero.' },
  { key: 'services', name: 'Services & process', hint: 'Service cards and the four-step process.', anchor: 'services' },
  { key: 'inlineCta', name: 'Urgent help banner', hint: 'Gold banner with the booking button. The price comes from Settings.' },
  { key: 'attorneys', name: 'For attorneys', hint: '', anchor: 'attorneys' },
  { key: 'socialWorkers', name: 'For social workers', hint: '', anchor: 'socialworkers' },
  { key: 'parents', name: 'For parents (tabs)', hint: 'Know your rights, case plan help and reunification tabs.', anchor: 'parents' },
  { key: 'caregivers', name: 'For caregivers (tabs)', hint: '', anchor: 'caregivers' },
  { key: 'immigration', name: 'Immigration & trilingual', hint: '', anchor: 'immigration' },
  { key: 'resources', name: 'Resources & training', hint: 'Library download links: paste a file link to replace "Coming Soon".', anchor: 'resources' },
  { key: 'store', name: 'Store (headings)', hint: 'Products themselves are edited under Store products.', anchor: 'store' },
  { key: 'freeGuides', name: 'Free guides sign-up', hint: '', anchor: 'free-guides' },
  { key: 'testimonials', name: 'Testimonials (headings)', hint: 'Testimonials themselves are edited under Testimonials.' },
  { key: 'videoTestimonials', name: 'Video testimonials (headings)', hint: '' },
  { key: 'caseStudies', name: 'Case studies (headings)', hint: '' },
  { key: 'faq', name: 'FAQ (headings)', hint: 'Questions are edited under FAQs.', anchor: 'faq' },
  { key: 'trustBadges', name: 'Trust badges', hint: '' },
  { key: 'about', name: 'About', hint: 'Add a photo to show it instead of the model diagram.', anchor: 'about' },
  { key: 'contact', name: 'Contact (headings)', hint: 'Phone, email and address are edited in Settings.', anchor: 'contact' },
  { key: 'getStarted', name: 'Ready to take the next step', hint: 'Prices come from Settings.', anchor: 'get-started' },
  { key: 'bookingModal', name: 'Booking window', hint: 'The pop-up form for the urgent consultation.' },
  { key: 'trainingModal', name: 'Training enrollment window', hint: '' },
  { key: 'exitPopup', name: 'Exit pop-up', hint: 'Shown once when a desktop visitor moves to leave the page.' },
  { key: 'header', name: 'Header languages', hint: 'Leave empty until translated pages exist.' },
]

const LABELS: Record<string, string> = {
  titleStart: 'Headline (first part)',
  titleEmphasis: 'Headline (gold italic part)',
  eyebrow: 'Small label above the title',
  lead: 'Intro text',
  body: 'Paragraph',
  tabLabel: 'Tab name',
  anchor: 'Scrolls to section',
  strong: 'Bold text',
  ogImage: 'Sharing image (1200 × 630)',
  primaryButton: 'Main button',
  secondaryButton: 'Second button',
  processEyebrow: 'Process label',
  processTitle: 'Process title',
  url: 'File or page link',
  enabled: 'Show this',
  skip: '"No thanks" link',
  successTitle: 'Success message title',
  successText: 'Success message',
  modelTop: 'Model: top box',
  modelMiddle: 'Model: middle boxes',
  modelBottomTitle: 'Model: bottom box title',
  modelBottomText: 'Model: bottom box text',
  arabicText: 'Arabic phrase',
  arabicTranslation: 'Translation',
  image: 'Photo',
}

const LONG_KEYS = new Set(['body', 'lead', 'text', 'description', 'intro', 'note', 'successText', 'certNotice', 'formText', 'consultationText', 'trainingText'])

const ANCHORS = ['services', 'attorneys', 'socialworkers', 'parents', 'caregivers', 'immigration', 'resources', 'store', 'free-guides', 'faq', 'about', 'contact', 'get-started']

/** Blank templates for lists that start empty. */
const TEMPLATES: Record<string, Json> = {
  'header.languages': { label: '', url: '', active: false },
}

function humanize(key: string) {
  if (LABELS[key]) return LABELS[key]
  const words = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function blank(value: Json): Json {
  if (typeof value === 'string') return ''
  if (typeof value === 'number') return 0
  if (typeof value === 'boolean') return false
  if (Array.isArray(value)) return []
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blank(v)]))
  return null
}

function setIn(root: Json, path: (string | number)[], value: Json): Json {
  if (path.length === 0) return value
  const [head, ...rest] = path
  if (Array.isArray(root)) {
    const next = [...root]
    next[head as number] = setIn(root[head as number], rest, value)
    return next
  }
  const obj = (root ?? {}) as JsonObject
  return { ...obj, [head]: setIn(obj[head as string], rest, value) }
}

function itemTitle(item: Json, index: number) {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const label = item.title ?? item.strong ?? item.label ?? item.text ?? item.value
    if (typeof label === 'string' && label) return label
  }
  return `Item ${index + 1}`
}

interface EditorProps {
  value: Json
  path: (string | number)[]
  onChange: (path: (string | number)[], value: Json) => void
}

function ValueEditor({ value, path, onChange }: EditorProps) {
  const key = String(path[path.length - 1])
  const pathKey = path.filter((p) => typeof p === 'string').join('.')

  if (typeof value === 'boolean') {
    return <Toggle checked={value} onChange={(v) => onChange(path, v)} label={humanize(key)} />
  }

  if (typeof value === 'string') {
    if (/image$/i.test(key)) {
      return <ImageInput label={humanize(key)} value={value || null} onChange={(url) => onChange(path, url ?? '')} />
    }
    if (key === 'icon') {
      return (
        <label className="block">
          <span className="mb-1 block text-[0.82rem] font-semibold text-navy">Icon</span>
          <select className={inputCls} value={value} onChange={(e) => onChange(path, e.target.value)}>
            {ICON_NAMES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      )
    }
    if (key === 'anchor') {
      return (
        <label className="block">
          <span className="mb-1 block text-[0.82rem] font-semibold text-navy">{humanize(key)}</span>
          <select className={inputCls} value={value} onChange={(e) => onChange(path, e.target.value)}>
            {ANCHORS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      )
    }
    const long = LONG_KEYS.has(key) || value.length > 90 || typeof path[path.length - 1] === 'number'
    const label = typeof path[path.length - 1] === 'number' ? null : humanize(key)
    const input = long ? (
      <textarea className={inputCls} rows={Math.min(8, Math.max(2, Math.ceil(value.length / 90)))} value={value} onChange={(e) => onChange(path, e.target.value)} />
    ) : (
      <input className={inputCls} value={value} onChange={(e) => onChange(path, e.target.value)} />
    )
    return label ? (
      <label className="block">
        <span className="mb-1 block text-[0.82rem] font-semibold text-navy">{label}</span>
        {input}
      </label>
    ) : (
      input
    )
  }

  if (typeof value === 'number') {
    return (
      <label className="block">
        <span className="mb-1 block text-[0.82rem] font-semibold text-navy">{humanize(key)}</span>
        <input type="number" className={inputCls} value={value} onChange={(e) => onChange(path, Number(e.target.value))} />
      </label>
    )
  }

  if (Array.isArray(value)) {
    const template = TEMPLATES[pathKey] ?? (value.length > 0 ? blank(value[0]) : '')
    const isStrings = typeof template === 'string'
    return (
      <div>
        <span className="mb-1 block text-[0.82rem] font-semibold text-navy">{humanize(key)}</span>
        <div className="flex flex-col gap-2">
          {value.map((item, i) => (
            <div key={i} className={isStrings ? 'flex items-start gap-2' : 'rounded-[8px] border border-stone bg-cream/60 p-3'}>
              {!isStrings && (
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[0.8rem] font-bold text-muted">{itemTitle(item, i)}</span>
                  <ItemControls list={value} index={i} path={path} onChange={onChange} />
                </div>
              )}
              <div className={isStrings ? 'flex-1' : 'flex flex-col gap-3'}>
                <ValueEditor value={item} path={[...path, i]} onChange={onChange} />
              </div>
              {isStrings && <ItemControls list={value} index={i} path={path} onChange={onChange} />}
            </div>
          ))}
        </div>
        <Button variant="secondary" className="mt-2" onClick={() => onChange(path, [...value, template])}>
          + Add
        </Button>
      </div>
    )
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    const nested = typeof path[path.length - 1] === 'string' && path.length > 1
    return (
      <div className={nested ? 'rounded-[10px] border border-stone p-4' : ''}>
        {nested && <p className="mb-3 font-serif text-[1.05rem] text-navy">{humanize(key)}</p>}
        <div className="flex flex-col gap-3">
          {entries.map(([k, v]) => (
            <ValueEditor key={k} value={v} path={[...path, k]} onChange={onChange} />
          ))}
        </div>
      </div>
    )
  }

  return null
}

function ItemControls({ list, index, path, onChange }: { list: Json[]; index: number; path: (string | number)[]; onChange: EditorProps['onChange'] }) {
  const btn = 'h-7 w-7 rounded border border-stone bg-white text-[0.8rem] text-navy hover:border-gold disabled:opacity-30'
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={btn} title="Move up" disabled={index === 0} onClick={() => onChange(path, move(list, index, index - 1))}>↑</button>
      <button type="button" className={btn} title="Move down" disabled={index === list.length - 1} onClick={() => onChange(path, move(list, index, index + 1))}>↓</button>
      <button type="button" className={`${btn} text-[#b3261e]`} title="Remove" onClick={() => onChange(path, list.filter((_, i) => i !== index))}>✕</button>
    </div>
  )
}

export default function HomeContentPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-home-content'], queryFn: adminApi.homeContent })
  const [draft, setDraft] = useState<JsonObject | null>(null)
  const [section, setSection] = useState<keyof HomeContent>('hero')
  const [error, setError] = useState('')
  const { flash, node: savedNode } = useSavedFlash()

  useEffect(() => {
    if (data) setDraft(data as unknown as JsonObject)
  }, [data])

  const dirty = useMemo(() => draft !== null && JSON.stringify(draft) !== JSON.stringify(data), [draft, data])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const save = useMutation({
    mutationFn: () => adminApi.updateHomeContent(draft as unknown as HomeContent),
    onSuccess: () => {
      qc.setQueryData(['admin-home-content'], draft)
      qc.invalidateQueries({ queryKey: ['home'] })
      setError('')
      flash()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save')),
  })

  const onChange = (path: (string | number)[], value: Json) => setDraft((d) => setIn(d, path, value) as JsonObject)

  const current = SECTIONS.find((s) => s.key === section)!

  return (
    <div>
      <PageTitle
        title="Page text & images"
        hint="Choose a section, edit it, then press Save. Changes appear on the website immediately."
        actions={
          <>
            {savedNode}
            {dirty && <span className="text-[0.85rem] font-semibold text-[#8a6112]">Unsaved changes</span>}
            <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      />
      <ErrorNote message={error} />

      {!draft ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[230px_1fr]">
          <nav className="flex flex-col gap-0.5 self-start rounded-[10px] border border-stone bg-white p-2 md:sticky md:top-6">
            {SECTIONS.filter((s) => s.key in draft).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection(s.key)}
                className={`rounded-md px-3 py-2 text-left text-[0.86rem] font-medium ${section === s.key ? 'bg-navy text-white' : 'text-navy hover:bg-cream'}`}
              >
                {s.name}
              </button>
            ))}
          </nav>

          <div className="min-w-0 rounded-[10px] border border-stone bg-white p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-stone pb-3">
              <div>
                <h2 className="font-serif text-[1.3rem] text-navy">{current.name}</h2>
                {current.hint && <p className="text-[0.85rem] text-muted">{current.hint}</p>}
              </div>
              <a href={current.anchor ? `/#${current.anchor}` : '/'} target="_blank" rel="noopener noreferrer" className="text-[0.85rem] font-semibold text-navy hover:text-gold">
                View on site ↗
              </a>
            </div>
            <ValueEditor value={draft[section] as Json} path={[section]} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  )
}
