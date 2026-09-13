import { useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api'
import { Badge, Button, EmptyState, ErrorNote, Modal, PageTitle } from './ui'

interface Api<T> {
  list: (params?: object) => Promise<T[]>
  create: (data: Partial<T>) => Promise<T>
  update: (id: number, data: Partial<T>) => Promise<T>
  remove: (id: number) => Promise<null>
}

type Row = { id: number; visible?: boolean; sort_order?: number }

interface Props<T extends Row> {
  title: string
  hint?: ReactNode
  itemName: string
  api: Api<T>
  queryKey: string
  params?: object
  blank: () => Partial<T>
  summary: (item: T) => ReactNode
  form: (draft: Partial<T>, set: (patch: Partial<T>) => void) => ReactNode
  /** Enables ↑/↓ ordering through sort_order. */
  sortable?: boolean
  toolbar?: ReactNode
  wide?: boolean
}

/** List + add/edit dialog + show/hide + ordering for a small content collection. */
export default function CollectionManager<T extends Row>({
  title, hint, itemName, api, queryKey, params, blank, summary, form, sortable = false, toolbar, wide,
}: Props<T>) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState<Partial<T> | null>(null)
  const [error, setError] = useState('')
  const key = [`admin-${queryKey}`, params ?? {}]
  const { data: items, isLoading } = useQuery({ queryKey: key, queryFn: () => api.list(params) })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: [`admin-${queryKey}`] })
    qc.invalidateQueries({ queryKey: ['home'] })
    qc.invalidateQueries({ queryKey: ['admin-stats'] })
  }

  const save = useMutation({
    mutationFn: (draft: Partial<T>) => (draft.id ? api.update(draft.id, draft) : api.create(draft)),
    onSuccess: () => {
      refresh()
      setEditing(null)
      setError('')
    },
    onError: (e) => setError(apiErrorMessage(e, 'Could not save')),
  })

  const quickUpdate = useMutation({
    mutationFn: (item: T) => api.update(item.id, item),
    onSuccess: refresh,
    onError: (e) => setError(apiErrorMessage(e, 'Could not update')),
  })

  const remove = useMutation({
    mutationFn: (id: number) => api.remove(id),
    onSuccess: refresh,
    onError: (e) => setError(apiErrorMessage(e, 'Could not delete')),
  })

  const reorder = async (index: number, direction: -1 | 1) => {
    if (!items) return
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    qc.setQueryData(key, next)
    try {
      await Promise.all(next.map((item, i) => (item.sort_order !== i ? api.update(item.id, { ...item, sort_order: i }) : null)))
    } finally {
      refresh()
    }
  }

  return (
    <div>
      <PageTitle
        title={title}
        hint={hint}
        actions={<Button onClick={() => { setError(''); setEditing(blank()) }}>+ Add {itemName}</Button>}
      />
      {toolbar}
      {!editing && <ErrorNote message={error} />}

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : !items || items.length === 0 ? (
        <EmptyState>Nothing here yet.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-stone bg-white">
          {items.map((item, i) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 border-b border-stone px-4 py-3 last:border-b-0">
              {sortable && (
                <div className="flex flex-col">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => reorder(i, -1)} className="text-[0.75rem] text-muted hover:text-navy disabled:opacity-25">▲</button>
                  <button type="button" aria-label="Move down" disabled={i === items.length - 1} onClick={() => reorder(i, 1)} className="text-[0.75rem] text-muted hover:text-navy disabled:opacity-25">▼</button>
                </div>
              )}
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { setError(''); setEditing(item) }}>
                {summary(item)}
              </button>
              {item.visible !== undefined && (
                <button
                  type="button"
                  onClick={() => quickUpdate.mutate({ ...item, visible: !item.visible })}
                  title={item.visible ? 'Click to hide from the website' : 'Click to show on the website'}
                >
                  <Badge tone={item.visible ? 'green' : 'neutral'}>{item.visible ? 'Visible' : 'Hidden'}</Badge>
                </button>
              )}
              <Button variant="ghost" onClick={() => { setError(''); setEditing(item) }}>Edit</Button>
              <Button variant="danger" onClick={() => confirm(`Delete this ${itemName}?`) && remove.mutate(item.id)}>Delete</Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={editing !== null} title={editing?.id ? `Edit ${itemName}` : `Add ${itemName}`} onClose={() => setEditing(null)} wide={wide}>
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
            className="flex flex-col gap-4"
          >
            <ErrorNote message={error} />
            {form(editing, (patch) => setEditing((d) => ({ ...d, ...patch })))}
            <div className="flex justify-end gap-2 border-t border-stone pt-4">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
