import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiErrorMessage } from '@/lib/api'
import { adminApi, type ArticleInput } from '../api/adminApi'
import RichTextEditor from '../components/RichTextEditor'
import { Button, Card, ErrorNote, Field, ImageInput, PageTitle, Toggle, inputCls } from '../components/ui'

const EMPTY: ArticleInput = {
  title: '', slug: '', category_id: null, image_url: null, seo_title: '', excerpt: '', body: '',
  meta_description: '', focus_keywords: '', read_time: '', author: '', faqs: [], status: 'draft', featured: false,
}

function Counter({ value, ideal }: { value: string | null | undefined; ideal: number }) {
  const n = (value ?? '').length
  return <span className={n > ideal ? 'text-[#b3261e]' : 'text-muted'}>{n}/{ideal} characters</span>
}

export default function ArticleEditPage() {
  const { slug } = useParams<{ slug: string }>()
  const isEdit = Boolean(slug)
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [form, setForm] = useState<ArticleInput>(EMPTY)
  const [error, setError] = useState('')
  const [htmlMode, setHtmlMode] = useState(false)

  const { data: cats } = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories })
  const { data: existing } = useQuery({
    queryKey: ['admin-article', slug],
    queryFn: () => adminApi.article(slug as string),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title, slug: existing.slug, category_id: existing.category?.id ?? null,
        image_url: existing.image_url, seo_title: existing.seo_title, excerpt: existing.excerpt, body: existing.body,
        meta_description: existing.meta_description, focus_keywords: existing.focus_keywords, read_time: existing.read_time,
        author: existing.author, faqs: existing.faqs ?? [], status: existing.status, featured: existing.featured,
      })
    }
  }, [existing])

  const save = useMutation({
    mutationFn: (data: ArticleInput) => (isEdit ? adminApi.updateArticle(slug as string, data) : adminApi.createArticle(data)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      navigate('/admin/articles')
    },
    onError: (e) => setError(apiErrorMessage(e, 'Save failed')),
  })

  const set = <K extends keyof ArticleInput>(k: K, v: ArticleInput[K]) => setForm((f) => ({ ...f, [k]: v }))
  const setFaq = (i: number, k: 'q' | 'a', v: string) =>
    setForm((f) => ({ ...f, faqs: (f.faqs ?? []).map((q, idx) => (idx === i ? { ...q, [k]: v } : q)) }))

  return (
    <div>
      <PageTitle
        title={isEdit ? 'Edit article' : 'New article'}
        actions={<Link to="/admin/articles" className="text-[0.9rem] font-semibold text-navy hover:text-gold">← Back</Link>}
      />
      <ErrorNote message={error} />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError('')
          save.mutate(form)
        }}
        className="grid gap-6 lg:grid-cols-[1fr_300px]"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <Field label="Title">
            <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </Field>
          <Field label="Short summary (shown on article cards)">
            <textarea className={inputCls} rows={2} value={form.excerpt ?? ''} onChange={(e) => set('excerpt', e.target.value)} />
          </Field>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[0.82rem] font-semibold text-navy">Article text</span>
              <button type="button" onClick={() => setHtmlMode((m) => !m)} className="text-[0.78rem] font-semibold text-[#9a7b14] hover:underline">
                {htmlMode ? '◐ Visual editor' : '</> Edit HTML'}
              </button>
            </div>
            {htmlMode ? (
              <textarea className={`${inputCls} font-mono text-[0.85rem] leading-relaxed`} rows={18} value={form.body ?? ''} onChange={(e) => set('body', e.target.value)} />
            ) : (
              <RichTextEditor value={form.body ?? ''} onChange={(html) => set('body', html)} minHeight={360} />
            )}
          </div>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <span className="font-serif text-[1.1rem] text-navy">Questions & answers</span>
              <Button variant="secondary" onClick={() => set('faqs', [...(form.faqs ?? []), { q: '', a: '' }])}>+ Add</Button>
            </div>
            <div className="flex flex-col gap-3">
              {(form.faqs ?? []).map((f, i) => (
                <div key={i} className="rounded-[8px] bg-cream p-3">
                  <input className={`${inputCls} mb-2`} value={f.q} onChange={(e) => setFaq(i, 'q', e.target.value)} placeholder="Question" />
                  <textarea className={inputCls} rows={2} value={f.a} onChange={(e) => setFaq(i, 'a', e.target.value)} placeholder="Answer" />
                  <Button variant="danger" className="mt-1" onClick={() => set('faqs', (form.faqs ?? []).filter((_, idx) => idx !== i))}>Remove</Button>
                </div>
              ))}
              {(form.faqs ?? []).length === 0 && <p className="text-[0.85rem] text-muted">No questions yet. They also appear in Google as FAQ results.</p>}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published</option>
              </select>
            </Field>
            <Toggle checked={Boolean(form.featured)} onChange={(v) => set('featured', v)} label="Featured" />
            <Field label="Category">
              <select className={inputCls} value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value ? Number(e.target.value) : null)}>
                <option value="">— none —</option>
                {(cats ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Author">
              <input className={inputCls} value={form.author ?? ''} onChange={(e) => set('author', e.target.value)} />
            </Field>
            <Field label="Read time">
              <input className={inputCls} value={form.read_time ?? ''} onChange={(e) => set('read_time', e.target.value)} placeholder="6 min read" />
            </Field>
            <ImageInput label="Cover image" value={form.image_url} onChange={(url) => set('image_url', url)} />
          </Card>

          <Card className="flex flex-col gap-4">
            <p className="font-serif text-[1.1rem] text-navy">SEO</p>
            <Field label="Web address" hint={`/articles/${form.slug || 'auto-from-title'}`}>
              <input className={inputCls} value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="auto from title" />
            </Field>
            <Field label="Google title" hint={<Counter value={form.seo_title || form.title} ideal={60} />}>
              <input className={inputCls} value={form.seo_title ?? ''} onChange={(e) => set('seo_title', e.target.value)} placeholder="Defaults to the title" />
            </Field>
            <Field label="Meta description" hint={<Counter value={form.meta_description} ideal={160} />}>
              <textarea className={inputCls} rows={4} value={form.meta_description ?? ''} onChange={(e) => set('meta_description', e.target.value)} />
            </Field>
            <Field label="Focus keywords" hint="Comma separated">
              <textarea className={inputCls} rows={3} value={form.focus_keywords ?? ''} onChange={(e) => set('focus_keywords', e.target.value)} />
            </Field>
          </Card>

          <Button type="submit" disabled={save.isPending} className="justify-center py-2.5">
            {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create article'}
          </Button>
        </div>
      </form>
    </div>
  )
}
