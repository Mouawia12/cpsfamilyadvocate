import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api'
import type { LegalPage } from '@/site/types'
import { adminApi } from '../api/adminApi'
import RichTextEditor from '../components/RichTextEditor'
import { Button, ErrorNote, Field, PageTitle, inputCls, useSavedFlash } from '../components/ui'

const PAGES = [
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'terms', label: 'Terms of Service' },
  { key: 'disclaimer', label: 'Disclaimer' },
] as const

export default function LegalPagesPage() {
  const qc = useQueryClient()
  const [pageKey, setPageKey] = useState<(typeof PAGES)[number]['key']>('privacy')
  const { data } = useQuery({ queryKey: ['admin-legal', pageKey], queryFn: () => adminApi.legalPage(pageKey) })
  const [draft, setDraft] = useState<LegalPage | null>(null)
  const [error, setError] = useState('')
  const { flash, node } = useSavedFlash()

  useEffect(() => {
    setDraft(data ?? null)
  }, [data])

  const save = useMutation({
    mutationFn: () => adminApi.updateLegalPage(pageKey, draft!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-legal', pageKey] })
      qc.invalidateQueries({ queryKey: ['page', pageKey] })
      setError('')
      flash()
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save')),
  })

  return (
    <div>
      <PageTitle
        title="Legal pages"
        hint="These drafts describe how the website handles information. Have them reviewed by your attorney before relying on them."
        actions={
          <>
            {node}
            <a href={`/${pageKey}`} target="_blank" rel="noopener noreferrer" className="text-[0.88rem] font-semibold text-navy hover:text-gold">View ↗</a>
            <Button onClick={() => save.mutate()} disabled={!draft || save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
          </>
        }
      />
      <div className="mb-4 flex gap-1 rounded-[8px] border border-stone bg-white p-1">
        {PAGES.map((p) => (
          <button key={p.key} type="button" onClick={() => setPageKey(p.key)}
            className={`flex-1 rounded-md px-3 py-2 text-[0.88rem] font-semibold ${pageKey === p.key ? 'bg-navy text-white' : 'text-navy hover:bg-cream'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <ErrorNote message={error} />
      {draft && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_220px] gap-3">
            <Field label="Page title">
              <input className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="Last updated">
              <input className={inputCls} value={draft.updated} onChange={(e) => setDraft({ ...draft, updated: e.target.value })} />
            </Field>
          </div>
          <RichTextEditor key={pageKey} value={draft.body} onChange={(body) => setDraft((d) => (d ? { ...d, body } : d))} minHeight={420} />
        </div>
      )}
    </div>
  )
}
