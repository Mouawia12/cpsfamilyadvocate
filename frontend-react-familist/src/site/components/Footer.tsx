import { Link } from 'react-router-dom'
import type { SiteSettings } from '../types'
import { useSiteUi } from '../SiteLayout'
import SectionLink from './SectionLink'

export default function Footer({ settings }: { settings: SiteSettings }) {
  const { openCookieSettings } = useSiteUi()
  const social = Object.entries(settings.social).filter(([, url]) => url)

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="logo-name">{settings.brandName}</div>
          <div className="logo-tagline">{settings.tagline}</div>
          <p>{settings.footerBlurb}</p>
          {social.length > 0 && (
            <p className="footer-social">
              {social.map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </a>
              ))}
            </p>
          )}
        </div>
        <div className="footer-col">
          <h5>Services</h5>
          <ul>
            <li><SectionLink to="services">All Services</SectionLink></li>
            <li><SectionLink to="immigration">Immigration</SectionLink></li>
            <li><SectionLink to="attorneys">Expert Witness</SectionLink></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>For Professionals</h5>
          <ul>
            <li><SectionLink to="attorneys">Attorneys & GALs</SectionLink></li>
            <li><SectionLink to="socialworkers">Social Workers</SectionLink></li>
            <li><SectionLink to="resources">Training</SectionLink></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>For Families</h5>
          <ul>
            <li><SectionLink to="parents">Parents</SectionLink></li>
            <li><SectionLink to="caregivers">Caregivers</SectionLink></li>
            <li><SectionLink to="immigration">Immigrant Families</SectionLink></li>
          </ul>
        </div>
        <div className="footer-col">
          <h5>More</h5>
          <ul>
            <li><Link to="/articles">Articles</Link></li>
            <li><SectionLink to="store">Shop</SectionLink></li>
            <li><SectionLink to="contact">Contact</SectionLink></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} {settings.brandName} {settings.tagline}. All rights reserved.
        </p>
        <div className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/disclaimer">Disclaimer</Link>
          <button type="button" className="footer-link-button" onClick={openCookieSettings}>
            Cookie settings
          </button>
        </div>
      </div>
    </footer>
  )
}
