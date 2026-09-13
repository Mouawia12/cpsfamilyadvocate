import { money } from '@/site/data'
import { adminApi, type AdminProduct } from '../api/adminApi'
import CollectionManager from '../components/CollectionManager'
import { Badge, Field, ImageInput, Toggle, inputCls } from '../components/ui'

export default function ProductsPage() {
  return (
    <CollectionManager<AdminProduct>
      title="Store products"
      hint="Products in the Familist Store section. While a product is Coming Soon, no purchase button is shown. When it is available, paste the link where it can be bought (for example a Stripe Payment Link)."
      itemName="product"
      queryKey="products"
      api={adminApi.products}
      sortable
      blank={() => ({ name: '', tagline: '', price: 0, icon: 'shirt', image_url: null, status: 'coming_soon', buy_url: null, visible: true, sort_order: 999 })}
      summary={(p) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="font-semibold text-navy">{p.name}</div>
            <div className="text-[0.8rem] text-muted">{money(p.price)}{p.tagline ? ` · ${p.tagline}` : ''}</div>
          </div>
          <Badge tone={p.status === 'available' ? 'gold' : 'neutral'}>{p.status === 'available' ? 'Available' : 'Coming soon'}</Badge>
        </div>
      )}
      form={(d, set) => (
        <>
          <div className="grid grid-cols-[1fr_140px] gap-3">
            <Field label="Name">
              <input className={inputCls} value={d.name ?? ''} onChange={(e) => set({ name: e.target.value })} required />
            </Field>
            <Field label="Price (USD)">
              <input type="number" min={0} step="0.01" className={inputCls} value={d.price ?? 0} onChange={(e) => set({ price: Number(e.target.value) })} required />
            </Field>
          </div>
          <Field label="Short description">
            <input className={inputCls} value={d.tagline ?? ''} onChange={(e) => set({ tagline: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Availability">
              <select className={inputCls} value={d.status} onChange={(e) => set({ status: e.target.value as AdminProduct['status'] })}>
                <option value="coming_soon">Coming soon</option>
                <option value="available">Available</option>
              </select>
            </Field>
            <Field label="Icon (when there is no photo)">
              <select className={inputCls} value={d.icon} onChange={(e) => set({ icon: e.target.value as AdminProduct['icon'] })}>
                <option value="shirt">T-shirt</option>
                <option value="mug">Mug</option>
                <option value="book">Book</option>
              </select>
            </Field>
          </div>
          {d.status === 'available' && (
            <Field label="Purchase link" hint="Where the Buy Now button goes.">
              <input type="url" className={inputCls} value={d.buy_url ?? ''} onChange={(e) => set({ buy_url: e.target.value || null })} required />
            </Field>
          )}
          <ImageInput label="Photo (optional)" value={d.image_url} onChange={(url) => set({ image_url: url })} />
          <Toggle checked={Boolean(d.visible)} onChange={(v) => set({ visible: v })} label="Visible on the website" />
        </>
      )}
    />
  )
}
