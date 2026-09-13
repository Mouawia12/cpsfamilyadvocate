import { useEffect } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

/**
 * A small, self-hosted WYSIWYG editor built on TipTap.
 * Emits clean HTML via onChange so the same markup renders on the public site.
 */

function isActive(editor: Editor, name: string, attrs?: Record<string, unknown>) {
  try {
    return editor.isActive(name, attrs)
  } catch {
    return false
  }
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    `flex h-8 min-w-8 items-center justify-center rounded-[5px] px-2 text-[0.85rem] font-semibold leading-none transition-colors ${
      active ? 'bg-navy text-ivory' : 'text-navy hover:bg-cream'
    }`

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Link URL (leave empty to remove)', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-stone bg-cream px-2 py-1.5">
      <button type="button" title="Bold" className={btn(isActive(editor, 'bold'))} onClick={() => editor.chain().focus().toggleBold().run()}>
        B
      </button>
      <button type="button" title="Italic" className={`${btn(isActive(editor, 'italic'))} italic`} onClick={() => editor.chain().focus().toggleItalic().run()}>
        i
      </button>
      <button type="button" title="Underline" className={`${btn(isActive(editor, 'underline'))} underline`} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        U
      </button>
      <span className="mx-1 h-5 w-px bg-stone" />
      <button type="button" title="Heading" className={btn(isActive(editor, 'heading', { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </button>
      <button type="button" title="Subheading" className={btn(isActive(editor, 'heading', { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </button>
      <span className="mx-1 h-5 w-px bg-stone" />
      <button type="button" title="Bullet list" className={btn(isActive(editor, 'bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        • List
      </button>
      <button type="button" title="Numbered list" className={btn(isActive(editor, 'orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1. List
      </button>
      <button type="button" title="Quote" className={btn(isActive(editor, 'blockquote'))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        &ldquo; &rdquo;
      </button>
      <span className="mx-1 h-5 w-px bg-stone" />
      <button type="button" title="Link" className={btn(isActive(editor, 'link'))} onClick={setLink}>
        Link
      </button>
      <button type="button" title="Clear formatting" className={btn(false)} onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        Clear
      </button>
    </div>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  minHeight = 160,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  minHeight?: number
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'prose-cms focus:outline-none',
        style: `min-height:${minHeight}px`,
        ...(placeholder ? { 'data-placeholder': placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Sync when the value changes from outside (e.g. async load) without disturbing the cursor.
  useEffect(() => {
    if (!editor) return
    const incoming = value || ''
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) {
    return <div className="rounded-[8px] border border-stone bg-white" style={{ minHeight }} />
  }

  return (
    <div className="overflow-hidden rounded-[8px] border border-stone bg-white focus-within:border-gold">
      <Toolbar editor={editor} />
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
