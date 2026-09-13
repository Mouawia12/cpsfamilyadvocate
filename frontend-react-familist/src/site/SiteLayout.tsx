import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useHome, useSettings } from './data'
import { trackPageView } from './lib/analytics'
import CrisisBar from './components/CrisisBar'
import Header from './components/Header'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'
import CookieBanner from './components/CookieBanner'
import { BookingModal, TrainingModal } from './components/CheckoutModals'
import ExitPopup from './components/ExitPopup'

type ModalName = 'booking' | 'training' | 'exit' | null

interface SiteUi {
  open: (modal: Exclude<ModalName, null>) => void
  close: () => void
  modal: ModalName
  openCookieSettings: () => void
}

const SiteUiContext = createContext<SiteUi | null>(null)

export function useSiteUi() {
  const ctx = useContext(SiteUiContext)
  if (!ctx) throw new Error('useSiteUi must be used inside SiteLayout')
  return ctx
}

export default function SiteLayout() {
  const { data: settings } = useSettings()
  const { data: home } = useHome()
  const location = useLocation()
  const [modal, setModal] = useState<ModalName>(null)
  const [cookieSettingsOpen, setCookieSettingsOpen] = useState(false)
  const lastPath = useRef(location.pathname)

  const close = useCallback(() => setModal(null), [])
  const ui = useMemo<SiteUi>(
    () => ({ open: setModal, close, modal, openCookieSettings: () => setCookieSettingsOpen(true) }),
    [close, modal],
  )

  // Lock page scroll while a dialog is open; Escape closes it.
  useEffect(() => {
    if (!modal) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [modal, close])

  // New page (not just a new #hash): start at the top and record the view.
  useEffect(() => {
    if (lastPath.current !== location.pathname) {
      lastPath.current = location.pathname
      if (!location.hash) window.scrollTo({ top: 0 })
      trackPageView(location.pathname)
    }
  }, [location.pathname, location.hash])

  if (!settings) return null

  const page = home?.page

  return (
    <SiteUiContext.Provider value={ui}>
      <a className="skip-link" href="#main">Skip to content</a>
      {/* The crisis bar must directly precede <header>: the design's CSS pushes the header down with `.crisis-bar.visible + header`. */}
      <CrisisBar settings={settings} />
      <Header settings={settings} languages={page?.header.languages ?? []} />

      <main id="main">
        <Outlet />
      </main>

      <div className="disclaimer-bar">
        <p className="disclaimer-text">
          <strong>Important Disclaimer:</strong> {settings.disclaimer}
        </p>
      </div>
      <Footer settings={settings} />

      <WhatsAppFloat settings={settings} />
      {page && (
        <>
          <BookingModal open={modal === 'booking'} onClose={close} content={page.bookingModal} settings={settings} />
          <TrainingModal open={modal === 'training'} onClose={close} content={page.trainingModal} settings={settings} />
          {page.exitPopup.enabled && <ExitPopup content={page.exitPopup} />}
        </>
      )}
      <CookieBanner
        measurementId={settings.integrations.gaMeasurementId}
        forceOpen={cookieSettingsOpen}
        onClosed={() => setCookieSettingsOpen(false)}
      />
    </SiteUiContext.Provider>
  )
}
