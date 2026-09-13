import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { apiErrorMessage } from '@/lib/api'
import { adminApi, type ImportPreviewArticle } from '../api/adminApi'
import { Badge, Button, Card, ErrorNote, PageTitle, Toggle, inputCls } from '../components/ui'

export default function ImportPage() {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ author?: string; articles: ImportPreviewArticle[] } | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')

  const analyse = async (picked: File) => {
    setFile(picked)
    setPreview(null)
    setResult('')
    setError('')
    setBusy(true)
    try {
      const res = await adminApi.importDocx(picked, { dryRun: true })
      setPreview({ author: res.data.author, articles: res.data.articles ?? [] })
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not read this file'))
    } finally {
      setBusy(false)
    }
  }

  const runImport = async () => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const res = await adminApi.importDocx(file, { dryRun: false, overwrite, status })
      setResult(res.message)
      setPreview(null)
      setFile(null)
      qc.invalidateQueries({ queryKey: ['admin-articles'] })
      qc.invalidateQueries({ queryKey: ['admin-categories'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    } catch (e) {
      setError(apiErrorMessage(e, 'Import failed'))
    } finally {
      setBusy(false)
    }
  }

  const existing = preview?.articles.filter((a) => a.exists).length ?? 0
  const missingSeo = preview?.articles.filter((a) => !a.meta_description).length ?? 0

  return (
    <div>
      <PageTitle title="Import articles from Word" hint="Upload a .docx file. You will see a preview before anything is saved." />
      <ErrorNote message={error} />
      {result && (
        <p className="mb-4 rounded-[6px] bg-[#e4efe6] px-3 py-2 text-[0.9rem] text-[#2e5a44]">
          ✓ {result} <Link to="/admin/articles" className="font-semibold underline">Go to articles</Link>
        </p>
      )}

      <Card className="mb-6">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[10px] border-2 border-dashed border-stone bg-cream px-6 py-10 text-center hover:border-gold">
              <span className="font-serif text-[1.15rem] text-navy">{file ? file.name : 'Choose a Word file'}</span>
              <span className="mt-1 text-[0.82rem] text-muted">{busy ? 'Reading…' : '.docx, up to 20 MB'}</span>
              <input type="file" accept=".docx" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && analyse(e.target.files[0])} />
            </label>
          </div>
          <div className="text-[0.86rem] leading-relaxed text-muted">
            <p className="mb-2 font-semibold text-navy">How to format the document</p>
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Heading 1</strong> for a category (optional)</li>
              <li><strong>Heading 2</strong> for each article title</li>
              <li>Right under the title, a paragraph with <code>URL slug:</code>, <code>Meta description:</code>, <code>Focus keywords:</code>, <code>Estimated read:</code></li>
              <li><strong>Heading 3</strong> for sub-headings; bullet lists, bold, links and pictures are kept</li>
              <li>A "Frequently asked questions" heading followed by question and answer paragraphs</li>
            </ul>
          </div>
        </div>
      </Card>

      {preview && (
        <>
          <Card className="mb-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="text-[0.92rem]">
                <p className="font-serif text-[1.2rem] text-navy">{preview.articles.length} articles found</p>
                <p className="text-muted">
                  {preview.author && <>Author: {preview.author} · </>}
                  {existing > 0 && <>{existing} already exist · </>}
                  {missingSeo > 0 ? <span className="text-[#8a6112]">{missingSeo} missing a meta description</span> : 'All have SEO details'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <select className={`${inputCls} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
                  <option value="draft">Save new articles as drafts</option>
                  <option value="published">Publish new articles now</option>
                </select>
                {existing > 0 && <Toggle checked={overwrite} onChange={setOverwrite} label="Update existing articles" />}
                <Button onClick={runImport} disabled={busy}>{busy ? 'Importing…' : 'Import'}</Button>
              </div>
            </div>
          </Card>

          <div className="overflow-x-auto rounded-[10px] border border-stone bg-white">
            <table className="w-full border-collapse text-[0.86rem]">
              <thead>
                <tr className="bg-cream text-left text-[0.7rem] uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3">Article</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">SEO</th>
                  <th className="px-4 py-3">Content</th>
                </tr>
              </thead>
              <tbody>
                {preview.articles.map((a) => (
                  <tr key={a.slug} className="border-t border-stone align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy">{a.title}</div>
                      <div className="text-[0.78rem] text-muted">/articles/{a.slug}</div>
                      {a.exists && <Badge tone="amber">Already exists</Badge>}
                    </td>
                    <td className="px-4 py-3 text-muted">{a.category ?? '—'}</td>
                    <td className="max-w-[320px] px-4 py-3">
                      {a.meta_description ? <p className="line-clamp-2 text-muted">{a.meta_description}</p> : <Badge tone="amber">No description</Badge>}
                      {a.focus_keywords && <p className="mt-1 line-clamp-1 text-[0.76rem] text-muted">🔑 {a.focus_keywords}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {a.words} words · {a.faqs.length} FAQs{a.images ? ` · ${a.images} images` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
