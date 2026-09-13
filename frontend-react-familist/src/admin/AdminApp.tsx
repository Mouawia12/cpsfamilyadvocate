import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/500.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import './admin.css'

import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import AdminLayout from './AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HomeContentPage from './pages/HomeContentPage'
import ArticlesListPage from './pages/ArticlesListPage'
import ArticleEditPage from './pages/ArticleEditPage'
import CategoriesPage from './pages/CategoriesPage'
import ImportPage from './pages/ImportPage'
import PodcastPage from './pages/PodcastPage'
import TestimonialsPage from './pages/TestimonialsPage'
import FaqsPage from './pages/FaqsPage'
import ProductsPage from './pages/ProductsPage'
import LegalPagesPage from './pages/LegalPagesPage'
import OrdersPage from './pages/OrdersPage'
import LeadsPage from './pages/LeadsPage'
import SettingsPage from './pages/SettingsPage'

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  if (!token || role !== 'admin') return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function AdminApp() {
  useEffect(() => {
    document.title = 'Familist Admin'
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="content" element={<HomeContentPage />} />
        <Route path="articles" element={<ArticlesListPage />} />
        <Route path="articles/new" element={<ArticleEditPage />} />
        <Route path="articles/:slug/edit" element={<ArticleEditPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="podcast" element={<PodcastPage />} />
        <Route path="testimonials" element={<TestimonialsPage />} />
        <Route path="faqs" element={<FaqsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="legal" element={<LegalPagesPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
