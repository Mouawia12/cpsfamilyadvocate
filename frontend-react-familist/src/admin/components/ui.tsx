import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ChangeEvent, type ReactNode } from 'react'
import { apiErrorMessage } from '@/lib/api'
import { adminApi } from '../api/adminApi'

export const inputCls =
  'w-full rounded-[6px] border-[1.5px] border-stone bg-white px-3 py-2 text-[0.95rem] text-ink placeholder:text-[#9a98a6] focus:border-gold focus:outline-none'

export function PageTitle({ title, hint, actions }: { title: string; hint?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-serif text-[1.8rem] font-medium text-navy">{title}</h1>
        {hint && <p className="mt-1 max-w-[680px] text-[0.9rem] text-muted">{hint}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.82rem] font-semibold text-navy">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.78rem] text-muted">{hint}</span>}
    </label>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    primary: 'bg-navy text-white hover:bg-gold hover:text-navy',
    secondary: 'border border-stone bg-white text-navy hover:border-gold',
    danger: 'text-[#b3261e] hover:underline',
    ghost: 'text-navy hover:text-gold',
  }
  const pad = variant === 'danger' || variant === 'ghost' ? 'px-1 py-1' : 'px-4 py-2'
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 rounded-btn text-[0.88rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${pad} ${styles[variant]} ${className}`}
      {...props}
    />
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[10px] border border-stone bg-white p-5 ${className}`}>{children}</div>
}

export function Badge({ tone = 'neutral', children }: { tone?: 'green' | 'amber' | 'red' | 'neutral' | 'gold'; children: ReactNode }) {
  const tones = {
    green: 'bg-[#e4efe6] text-[#2e5a44]',
    amber: 'bg-[#fbf0d9] text-[#8a6112]',
    red: 'bg-[#fdecec] text-[#b3261e]',
    neutral: 'bg-cream text-muted',
    gold: 'bg-gold-light/60 text-[#6f5710]',
  }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[0.72rem] font-bold ${tones[tone]}`}>{children}</span>
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[0.9rem] font-semibold text-navy">
      <span className="relative inline-flex">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-5 w-9 rounded-full bg-stone transition-colors peer-checked:bg-[#2e7d57] peer-focus-visible:ring-2 peer-focus-visible:ring-gold" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
      {label}
    </label>
  )
}

export function ErrorNote({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mb-4 rounded-[6px] bg-[#fdecec] px-3 py-2 text-[0.88rem] text-[#b3261e]">
      {message}
    </p>
  )
}

/** "Saved ✓" that fades after a moment. */
export function useSavedFlash() {
  const [saved, setSaved] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const flash = () => {
    setSaved(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setSaved(false), 2500)
  }
  const node = saved ? <span className="text-[0.9rem] font-semibold text-[#2e5a44]">Saved ✓</span> : null
  return { flash, node }
}

export function ImageInput({ value, onChange, label = 'Image' }: { value: string | null | undefined; onChange: (url: string | null) => void; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const res = await adminApi.uploadMedia(file)
      onChange(res.url)
    } catch (err) {
      setError(apiErrorMessage(err, 'Upload failed'))
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <span className="mb-1 block text-[0.82rem] font-semibold text-navy">{label}</span>
      <div className="flex items-center gap-4">
        <div className="flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-dashed border-stone bg-cream">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="text-[0.75rem] text-muted">No image</span>}
        </div>
        <div className="flex flex-col items-start gap-2">
          <label className="cursor-pointer rounded-btn border border-stone bg-white px-3 py-1.5 text-[0.85rem] font-semibold text-navy hover:border-gold">
            {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onFile} disabled={busy} />
          </label>
          {value && (
            <Button variant="danger" onClick={() => onChange(null)}>
              Remove
            </Button>
          )}
          {error && <span className="text-[0.8rem] text-[#b3261e]">{error}</span>}
        </div>
      </div>
    </div>
  )
}

export function Modal({ open, title, onClose, children, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/50 p-4 pt-[6vh]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full ${wide ? 'max-w-[860px]' : 'max-w-[620px]'} rounded-[12px] bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-stone px-6 py-4">
          <h2 className="font-serif text-[1.3rem] text-navy">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[1.5rem] leading-none text-muted hover:text-navy">
            &times;
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-[10px] border border-dashed border-stone bg-white px-6 py-10 text-center text-[0.92rem] text-muted">{children}</div>
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** Move an item within a list (for manual ordering). */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
