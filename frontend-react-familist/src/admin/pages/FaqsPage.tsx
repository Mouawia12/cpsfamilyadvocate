import { adminApi, type AdminFaq } from '../api/adminApi'
import CollectionManager from '../components/CollectionManager'
import { Field, Toggle, inputCls } from '../components/ui'

export default function FaqsPage() {
  return (
    <CollectionManager<AdminFaq>
      title="FAQs"
      hint="Questions in the FAQ section of the home page. They are also sent to Google as FAQ results. Use ▲▼ to reorder."
      itemName="question"
      queryKey="faqs"
      api={adminApi.faqs}
      sortable
      blank={() => ({ question: '', answer: '', visible: true, sort_order: 999 })}
      summary={(f) => (
        <>
          <div className="font-semibold text-navy">{f.question}</div>
          <div className="line-clamp-1 text-[0.8rem] text-muted">{f.answer}</div>
        </>
      )}
      form={(d, set) => (
        <>
          <Field label="Question">
            <input className={inputCls} value={d.question ?? ''} onChange={(e) => set({ question: e.target.value })} required />
          </Field>
          <Field label="Answer" hint="Leave an empty line between paragraphs.">
            <textarea className={inputCls} rows={7} value={d.answer ?? ''} onChange={(e) => set({ answer: e.target.value })} required />
          </Field>
          <Toggle checked={Boolean(d.visible)} onChange={(v) => set({ visible: v })} label="Visible on the website" />
        </>
      )}
    />
  )
}
