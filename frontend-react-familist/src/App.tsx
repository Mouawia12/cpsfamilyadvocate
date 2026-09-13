import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'

/*
 * The public site and the admin dashboard are separate lazy bundles so each
 * loads only its own stylesheet: the site uses the original design CSS, the
 * dashboard uses Tailwind. Each app declares its own top-level routes; links
 * between the two are full page loads.
 */
const SiteApp = lazy(() => import('@/site/SiteApp'))
const AdminApp = lazy(() => import('@/admin/AdminApp'))

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname === '/login' || pathname === '/admin' || pathname.startsWith('/admin/')

  return <Suspense fallback={null}>{isAdmin ? <AdminApp /> : <SiteApp />}</Suspense>
}
