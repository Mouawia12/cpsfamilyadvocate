import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { adminApi } from './api/adminApi'

const groups: { title: string; items: { to: string; label: string; end?: boolean }[] }[] = [
  { title: '', items: [{ to: '/admin', label: 'Overview', end: true }] },
  {
    title: 'Website',
    items: [
      { to: '/admin/content', label: 'Page text & images' },
      { to: '/admin/testimonials', label: 'Testimonials' },
      { to: '/admin/faqs', label: 'FAQs' },
      { to: '/admin/products', label: 'Store products' },
      { to: '/admin/legal', label: 'Legal pages' },
    ],
  },
  {
    title: 'Publishing',
    items: [
      { to: '/admin/articles', label: 'Articles' },
      { to: '/admin/categories', label: 'Categories' },
      { to: '/admin/import', label: 'Import from Word' },
      { to: '/admin/podcast', label: 'Podcast' },
    ],
  },
  {
    title: 'Clients',
    items: [
      { to: '/admin/orders', label: 'Bookings & payments' },
      { to: '/admin/leads', label: 'Sign-ups' },
    ],
  },
  { title: 'Setup', items: [{ to: '/admin/settings', label: 'Settings & prices' }] },
]

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const onLogout = async () => {
    try {
      await adminApi.logout()
    } catch {
      /* token may already be invalid */
    }
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col overflow-y-auto bg-navy text-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center border border-white/60 font-serif text-[1.2rem] italic">F</span>
          <div className="leading-tight">
            <div className="font-serif text-[1.15rem]">Familist</div>
            <div className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-gold-light">Admin</div>
          </div>
        </div>
        <nav className="flex flex-col gap-4 px-3 pb-6">
          {groups.map((group) => (
            <div key={group.title || 'main'}>
              {group.title && (
                <p className="px-3 pb-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/40">{group.title}</p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-md px-3 py-2 text-[0.92rem] font-medium transition-colors ${
                        isActive ? 'bg-gold text-navy' : 'text-white/75 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 px-5 py-4 text-[0.8rem]">
          <a href="/" target="_blank" rel="noopener noreferrer" className="text-gold-light hover:underline">
            View website ↗
          </a>
          <p className="mt-2 truncate text-white/50">{user?.email}</p>
          <button type="button" onClick={onLogout} className="mt-2 w-full rounded-md border border-white/15 py-1.5 font-semibold hover:bg-white/5">
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen && <div className="fixed inset-0 z-30 bg-navy/40 md:hidden" onClick={() => setMenuOpen(false)} />}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-stone bg-white px-4 py-3 md:hidden">
          <button type="button" onClick={() => setMenuOpen(true)} className="font-semibold text-navy" aria-label="Open menu">
            ☰ Menu
          </button>
          <span className="font-serif text-navy">Familist Admin</span>
        </div>
        <main className="mx-auto max-w-[1040px] px-5 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
