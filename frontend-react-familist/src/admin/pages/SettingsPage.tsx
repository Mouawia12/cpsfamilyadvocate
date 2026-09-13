import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api'
import type { SiteSettings } from '@/site/types'
import { adminApi } from '../api/adminApi'
import { Button, Card, ErrorNote, Field, PageTitle, Toggle, inputCls, useSavedFlash } from '../components/ui'

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-[1.2rem] text-navy">{title}</h2>
        {hint && <p className="text-[0.85rem] text-muted">{hint}</p>}
      </div>
      {children}
    </Card>
  )
}

function PasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const { flash, node } = useSavedFlash()

  const save = useMutation({
    mutationFn: () => adminApi.updatePassword(current, next, confirm),
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setConfirm('')
      setError('')
      flash()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not change the password')),
  })

  return (
    <form onSubmit={(e: FormEvent) => { e.preventDefault(); save.mutate() }}>
      <Section title="Change password" hint="At least 8 characters. Other signed-in devices will be signed out.">
        <ErrorNote message={error} />
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Current password"><input type="password" autoComplete="current-password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} required /></Field>
          <Field label="New password"><input type="password" autoComplete="new-password" minLength={8} className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} required /></Field>
          <Field label="Repeat new password"><input type="password" autoComplete="new-password" minLength={8} className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></Field>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={save.isPending}>Change password</Button>
          {node}
        </div>
      </Section>
    </form>
  )
}

export default function SettingsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings })
  const [s, setS] = useState<SiteSettings | null>(null)
  const [error, setError] = useState('')
  const { flash, node } = useSavedFlash()

  useEffect(() => {
    if (data) setS(data)
  }, [data])

  const save = useMutation({
    mutationFn: () => adminApi.updateSettings(s!),
    onSuccess: (fresh) => {
      qc.setQueryData(['admin-settings'], fresh)
      qc.invalidateQueries({ queryKey: ['settings'] })
      qc.invalidateQueries({ queryKey: ['home'] })
      setError('')
      flash()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save settings')),
  })

  if (!s) return <p className="text-muted">Loading…</p>

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => setS({ ...s, [key]: value })
  const text = (key: keyof SiteSettings) => ({
    className: inputCls,
    value: (s[key] as string) ?? '',
    onChange: (e: { target: { value: string } }) => set(key, e.target.value as never),
  })

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="flex flex-col gap-6">
        <PageTitle
          title="Settings & prices"
          actions={
            <>
              {node}
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</Button>
            </>
          }
        />
        <ErrorNote message={error} />

        <Section title="Prices" hint="Used everywhere on the website and charged at checkout.">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Urgent consultation price (USD)">
              <input type="number" min={0} step="1" className={inputCls} value={s.pricing.consultationPrice}
                onChange={(e) => set('pricing', { ...s.pricing, consultationPrice: Number(e.target.value) })} />
            </Field>
            <Field label="Consultation length (minutes)">
              <input type="number" min={5} className={inputCls} value={s.pricing.consultationMinutes}
                onChange={(e) => set('pricing', { ...s.pricing, consultationMinutes: Number(e.target.value) })} />
            </Field>
            <Field label="Crisis training price (USD)">
              <input type="number" min={0} step="1" className={inputCls} value={s.pricing.trainingPrice}
                onChange={(e) => set('pricing', { ...s.pricing, trainingPrice: Number(e.target.value) })} />
            </Field>
          </div>
        </Section>

        <Section title="Contact details" hint="Shown in the contact section, WhatsApp button and Google business information.">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Phone (as displayed)"><input {...text('phoneDisplay')} /></Field>
            <Field label="Phone (for dialing)" hint="With country code, e.g. +19073101560"><input {...text('phoneNumber')} /></Field>
            <Field label="Email"><input type="email" {...text('email')} /></Field>
            <Field label="WhatsApp number" hint="Digits with country code, no + or spaces"><input {...text('whatsappNumber')} /></Field>
          </div>
          <Field label="WhatsApp pre-filled message"><input {...text('whatsappMessage')} /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Address" hint="Street on the first line, City, ST ZIP on the second">
              <textarea rows={2} {...text('address')} />
            </Field>
            <Field label="Opening hours" hint="Google format, e.g. Mo-Fr 09:00-17:00"><input {...text('hours')} /></Field>
          </div>
        </Section>

        <Section title="Brand & footer">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Brand name"><input {...text('brandName')} /></Field>
            <Field label="Tagline"><input {...text('tagline')} /></Field>
          </div>
          <Field label="Footer text"><textarea rows={2} {...text('footerBlurb')} /></Field>
          <Field label="Disclaimer bar"><textarea rows={3} {...text('disclaimer')} /></Field>
        </Section>

        <Section title="Crisis bar" hint="Red bar that appears at the top once visitors scroll down.">
          <Toggle checked={s.crisisBar.enabled} onChange={(v) => set('crisisBar', { ...s.crisisBar, enabled: v })} label="Show the crisis bar" />
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Bold text"><input className={inputCls} value={s.crisisBar.title} onChange={(e) => set('crisisBar', { ...s.crisisBar, title: e.target.value })} /></Field>
            <Field label="Text"><input className={inputCls} value={s.crisisBar.text} onChange={(e) => set('crisisBar', { ...s.crisisBar, text: e.target.value })} /></Field>
          </div>
        </Section>

        <Section title="Integrations" hint="Stripe keys are kept on the server for security and are not entered here.">
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Google Analytics 4 Measurement ID" hint="Looks like G-XXXXXXXXXX. Visitors are asked for cookie consent first.">
              <input className={inputCls} value={s.integrations.gaMeasurementId} placeholder="G-…"
                onChange={(e) => set('integrations', { ...s.integrations, gaMeasurementId: e.target.value.trim() })} />
            </Field>
            <Field label="Spotify podcast show link" hint="Shows a player at the top of the Podcast page.">
              <input type="url" className={inputCls} value={s.integrations.spotifyShowUrl} placeholder="https://open.spotify.com/show/…"
                onChange={(e) => set('integrations', { ...s.integrations, spotifyShowUrl: e.target.value.trim() })} />
            </Field>
          </div>
        </Section>

        <Section title="Social media" hint="Full profile links. Empty ones are hidden.">
          <div className="grid gap-3 md:grid-cols-2">
            {Object.keys(s.social).map((network) => (
              <Field key={network} label={network.charAt(0).toUpperCase() + network.slice(1)}>
                <input type="url" className={inputCls} value={s.social[network]} onChange={(e) => set('social', { ...s.social, [network]: e.target.value.trim() })} />
              </Field>
            ))}
          </div>
        </Section>
      </form>

      <div className="mt-6">
        <PasswordForm />
      </div>
    </div>
  )
}
