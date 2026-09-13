import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/500.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/400-italic.css'
import '@fontsource/playfair-display/500-italic.css'
import '@fontsource/dm-sans/300.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/600.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/dm-sans/400-italic.css'
import './styles/index.css'

import { Route, Routes } from 'react-router-dom'
import SiteLayout from './SiteLayout'
import HomePage from './pages/HomePage'
import ArticlesPage from './pages/ArticlesPage'
import ArticlePage from './pages/ArticlePage'
import PodcastPage from './pages/PodcastPage'
import LegalPage from './pages/LegalPage'
import CheckoutResultPage from './pages/CheckoutResultPage'
import NotFoundPage from './pages/NotFoundPage'

export default function SiteApp() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<HomePage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="articles/:slug" element={<ArticlePage />} />
        <Route path="podcast" element={<PodcastPage />} />
        <Route path="privacy" element={<LegalPage pageKey="privacy" />} />
        <Route path="terms" element={<LegalPage pageKey="terms" />} />
        <Route path="disclaimer" element={<LegalPage pageKey="disclaimer" />} />
        <Route path="checkout/success" element={<CheckoutResultPage outcome="success" />} />
        <Route path="checkout/cancelled" element={<CheckoutResultPage outcome="cancelled" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
