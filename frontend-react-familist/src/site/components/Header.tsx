import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { SiteSettings } from '../types'
import SectionLink from './SectionLink'

interface Props {
  settings: SiteSettings
  languages: { label: string; url: string; active?: boolean }[]
}

const services = [
  { to: 'services', label: 'All Services' },
  { to: 'immigration', label: 'Immigration & Trilingual' },
  { to: 'parents', label: 'Parents & Reunification' },
  { to: 'caregivers', label: 'Foster & Kinship' },
]

const links = [
  { to: 'attorneys', label: 'For Attorneys' },
  { to: 'socialworkers', label: 'For Social Workers' },
  { to: 'parents', label: 'For Parents' },
  { to: 'caregivers', label: 'For Caregivers' },
  { to: 'about', label: 'About' },
  { to: 'resources', label: 'Resources' },
]

export default function Header({ settings, languages }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeNav = () => {
    setNavOpen(false)
    setServicesOpen(false)
  }

  return (
    <header id="header" className={scrolled ? 'scrolled' : undefined}>
      <div className="header-inner">
        <SectionLink to="top" className="logo" aria-label={`${settings.brandName} ${settings.tagline} — home`} onClick={closeNav}>
          <div className="logo-mark" aria-hidden="true" />
          <div className="logo-text">
            <span className="logo-name">{settings.brandName}</span>
            <span className="logo-tagline">{settings.tagline}</span>
          </div>
        </SectionLink>

        <nav id="nav" className={navOpen ? 'active' : undefined} aria-label="Main">
          <div className={`nav-dropdown${servicesOpen ? ' active' : ''}`}>
            <SectionLink
              to="services"
              aria-haspopup="true"
              onClick={(e) => {
                // On mobile the first tap expands the submenu instead of navigating.
                if (navOpen && !servicesOpen) {
                  e.preventDefault()
                  setServicesOpen(true)
                } else {
                  closeNav()
                }
              }}
            >
              Services
            </SectionLink>
            <div className="dropdown-menu">
              {services.map((s) => (
                <SectionLink key={s.to} to={s.to} onClick={closeNav}>
                  {s.label}
                </SectionLink>
              ))}
            </div>
          </div>
          {links.map((l) => (
            <SectionLink key={l.label} to={l.to} onClick={closeNav}>
              {l.label}
            </SectionLink>
          ))}
          <Link to="/articles" onClick={closeNav}>
            Articles
          </Link>
          <SectionLink to="contact" className="nav-cta" onClick={closeNav}>
            Contact
          </SectionLink>
        </nav>

        {languages.length > 0 && (
          <div className="lang-selector">
            {languages.map((lang) => (
              <a key={lang.label} href={lang.url} className={lang.active ? 'active' : undefined}>
                {lang.label}
              </a>
            ))}
          </div>
        )}

        <button
          type="button"
          className="mobile-toggle"
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
          aria-controls="nav"
          onClick={() => setNavOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
