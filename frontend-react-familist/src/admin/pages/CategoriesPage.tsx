import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiErrorMessage } from '@/lib/api'
import { adminApi, type Category } from '../api/adminApi'
import { Button, ErrorNote, PageTitle, inputCls } from '../components/ui'

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { data } = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories })
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-categories'] })
  const onError = (e: unknown) => setError(apiErrorMessage(e, 'Something went wrong'))

  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ name }),
    onSuccess: () => {
      invalidate()
      setName('')
    },
    onError,
  })
  const rename = useMutation({ mutationFn: (c: Category) => adminApi.updateCategory(c.id, { name: c.name }), onSuccess: invalidate, onError })
  const del = useMutation({ mutationFn: (id: number) => adminApi.deleteCategory(id), onSuccess: invalidate, onError })

  return (
    <div>
      <PageTitle title="Categories" hint="Group articles by topic. Click a name to rename it." />
      <ErrorNote message={error} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) create.mutate()
        }}
        className="mb-6 flex gap-2"
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className={`${inputCls} max-w-[320px]`} />
        <Button type="submit">Add</Button>
      </form>

      <div className="overflow-hidden rounded-[10px] border border-stone bg-white">
        {(data ?? []).map((c) => (
          <div key={c.id} className="flex items-center gap-3 border-b border-stone px-4 py-3 last:border-b-0">
            <input
              defaultValue={c.name}
              aria-label="Category name"
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value !== c.name) rename.mutate({ ...c, name: e.target.value })
              }}
              className="flex-1 rounded-[6px] border border-transparent bg-transparent px-2 py-1 font-semibold text-navy hover:border-stone focus:border-gold focus:outline-none"
            />
            <span className="text-[0.8rem] text-muted">{c.articles_count ?? 0} articles</span>
            <Button variant="danger" onClick={() => confirm(`Delete category "${c.name}"? Its articles will be uncategorized.`) && del.mutate(c.id)}>
              Delete
            </Button>
          </div>
        ))}
        {data?.length === 0 && <p className="px-4 py-6 text-center text-muted">No categories yet.</p>}
      </div>
    </div>
  )
}
