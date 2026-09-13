import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { ArticleCard, Faq, HomeContent, PodcastEpisode, Product, SiteSettings, Testimonial } from '../types'
import { money } from '../data'
import { useSiteUi } from '../SiteLayout'
import { formValues, useLead } from '../lib/forms'
import { track } from '../lib/analytics'
import SectionLink from '../components/SectionLink'
import Icon from '../components/Icon'
import { Honeypot } from '../components/CheckoutModals'
import { SectionHeader } from './TopSections'

export function Resources({
  c,
  episodes,
  articles,
}: {
  c: HomeContent['resources']
  episodes: PodcastEpisode[]
  articles: ArticleCard[]
}) {
  const [active, setActive] = useState<'media' | 'library' | 'training'>('media')
  const tab = (key: typeof active, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={active === key}
      className={`tab-btn${active === key ? ' active' : ''}`}
      onClick={() => setActive(key)}
    >
      {label}
    </button>
  )
  const { media, library, training } = c

  return (
    <section id="resources" className="bg-cream">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />

        <div className="resources-container">
          <div className="tab-nav" role="tablist">
            {tab('media', media.tabLabel)}
            {tab('library', library.tabLabel)}
            {tab('training', training.tabLabel)}
          </div>

          <div id="media" className={`resource-panel${active === 'media' ? ' active' : ''}`} role="tabpanel">
            <div className="media-grid">
              <div className="media-card">
                <div className="media-visual podcast">
                  <div className="media-visual-icon"><Icon name="mic" /></div>
                </div>
                <div className="media-content">
                  <h4>{media.podcastTitle}</h4>
                  <p>{media.podcastText}</p>
                  {episodes.length > 0 ? (
                    <Link to="/podcast" className="btn btn-sm btn-primary">Listen Now</Link>
                  ) : (
                    <span className="badge-soon">Coming Soon</span>
                  )}
                </div>
              </div>
              <div className="media-card">
                <div className="media-visual newsletter">
                  <div className="media-visual-icon"><Icon name="mail" /></div>
                </div>
                <div className="media-content">
                  <h4>{media.newsletterTitle}</h4>
                  <p>{media.newsletterText}</p>
                  <SectionLink to="free-guides" className="btn btn-sm btn-primary">{media.newsletterButton}</SectionLink>
                </div>
              </div>
              <div className="media-card">
                <div className="media-visual blog">
                  <div className="media-visual-icon"><Icon name="pen" /></div>
                </div>
                <div className="media-content">
                  <h4>{media.blogTitle}</h4>
                  <p>{media.blogText}</p>
                  {articles.length > 0 ? (
                    <Link to="/articles" className="btn btn-sm btn-primary">Read Articles</Link>
                  ) : (
                    <span className="badge-soon">Coming Soon</span>
                  )}
                </div>
              </div>
            </div>
            <div className="topics-wrap">
              <h4>{media.topicsTitle}</h4>
              <div className="topic-list">
                {media.topics.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>

          <div id="library" className={`resource-panel${active === 'library' ? ' active' : ''}`} role="tabpanel">
            <div className="library-grid">
              {library.items.map((item) => (
                <div className="library-card" key={item.title}>
                  <div className="library-icon"><Icon name={item.icon} /></div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                  {item.url ? (
                    <a href={item.url} className="btn btn-sm btn-primary" target="_blank" rel="noopener noreferrer"
                      onClick={() => track('resource_download', { resource: item.title })}>
                      Download
                    </a>
                  ) : (
                    <span className="badge-soon">Coming Soon</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div id="training" className={`resource-panel${active === 'training' ? ' active' : ''}`} role="tabpanel">
            <div className="training-layout">
              <div className="training-info">
                <h3>{training.title}</h3>
                <p>{training.body}</p>
                <ul className="module-list">
                  {training.modules.map((m) => (
                    <li key={m.title}>
                      <strong>{m.title}</strong>
                      <span>{m.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="training-sidebar">
                <h4>{training.applyTitle}</h4>
                <ul className="apply-list">
                  {training.apply.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <div className="cert-notice">{training.certNotice}</div>
                <SectionLink to="contact" className="btn btn-primary btn-arrow">{training.button}</SectionLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Store({ c, products, currency }: { c: HomeContent['store']; products: Product[]; currency: string }) {
  if (products.length === 0) return null

  return (
    <section id="store">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />
        <div className="store-intro"><p>{c.intro}</p></div>

        <div className="store-grid">
          {products.map((p) => (
            <div className="product-card" key={p.id}>
              <div className="product-visual">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="product-image" loading="lazy" />
                ) : (
                  <div className="product-icon"><Icon name={p.icon} /></div>
                )}
              </div>
              <div className="product-info">
                <h4>{p.name}</h4>
                {p.tagline && <p>{p.tagline}</p>}
                <span className="product-price">{money(p.price, currency)}</span>
                {p.status === 'available' && p.buy_url ? (
                  <a href={p.buy_url} className="btn btn-sm btn-primary" target="_blank" rel="noopener noreferrer">Buy Now</a>
                ) : (
                  <span className="badge-soon">Coming Soon</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="store-cta">
          <h4>{c.ctaTitle}</h4>
          <p>{c.ctaText}</p>
          <SectionLink to="free-guides" className="btn btn-primary btn-arrow">{c.ctaButton}</SectionLink>
        </div>
      </div>
    </section>
  )
}

export function FreeGuides({ c }: { c: HomeContent['freeGuides'] }) {
  const { status, error, submit } = useLead()
  const nameId = useId()
  const emailId = useId()
  const roleId = useId()

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const v = formValues(e.currentTarget)
    submit({ first_name: v.first_name, email: v.email, role: v.role, source: 'guides', website: v.website })
  }

  return (
    <section className="lead-magnet-section" id="free-guides">
      <div className="lead-magnet-inner">
        <div className="lead-magnet-content">
          <div className="eyebrow eyebrow-light">{c.eyebrow}</div>
          <h2>{c.title}</h2>
          <p>{c.body}</p>
          <div className="guide-preview">
            {c.guides.map((g) => (
              <div className="guide-item" key={g}>
                <Icon name="checkbox" /> {g}
              </div>
            ))}
          </div>
        </div>

        <div className="lead-form">
          {status === 'done' ? (
            <div className="form-success">
              <h3>✓ {c.successTitle}</h3>
              <p>{c.successText}</p>
            </div>
          ) : (
            <>
              <h3>{c.formTitle}</h3>
              <p>{c.formText}</p>
              <form onSubmit={onSubmit}>
                <Honeypot />
                <div className="form-group">
                  <label htmlFor={nameId}>First Name</label>
                  <input id={nameId} type="text" name="first_name" required maxLength={80} placeholder="Your first name" autoComplete="given-name" />
                </div>
                <div className="form-group">
                  <label htmlFor={emailId}>Email Address</label>
                  <input id={emailId} type="email" name="email" required placeholder="your@email.com" autoComplete="email" />
                </div>
                <div className="form-group">
                  <label htmlFor={roleId}>I Am A...</label>
                  <select id={roleId} name="role">
                    <option value="parent">Parent Facing CPS</option>
                    <option value="caregiver">Foster Parent / Kinship Caregiver</option>
                    <option value="attorney">Attorney / GAL</option>
                    <option value="social_worker">Social Worker</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button type="submit" className="form-submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : c.button}
                </button>
              </form>
              <p className="form-note">{c.note}</p>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

function initials(name: string) {
  return name
    .replace(/,.*$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() + '.')
    .join('')
}

export function Testimonials({ c, items }: { c: HomeContent['testimonials']; items: Testimonial[] }) {
  if (items.length === 0) return null

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />
        <div className="testimonials-grid">
          {items.map((t) => (
            <div className="testimonial-card" key={t.id}>
              {t.rating ? (
                <div className="testimonial-stars" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: t.rating }, (_, i) => (
                    <Icon name="star" key={i} />
                  ))}
                </div>
              ) : null}
              <p className="testimonial-text">"{t.quote}"</p>
              <div className="testimonial-author">
                <div className="author-avatar">{initials(t.name)}</div>
                <div className="author-info">
                  <strong>{t.name}</strong>
                  {t.role && <span>{t.role}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** YouTube / Vimeo watch links → privacy-friendly embed URLs. */
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

export function VideoTestimonials({ c, items }: { c: HomeContent['videoTestimonials']; items: Testimonial[] }) {
  const [playing, setPlaying] = useState<number | null>(null)
  const withVideo = items.filter((t) => t.video_url && embedUrl(t.video_url))
  if (withVideo.length === 0) return null

  return (
    <section className="video-testimonials-section" id="video-testimonials">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />
        <div className="video-testimonials-grid">
          {withVideo.map((t) => (
            <div className="video-testimonial-card" key={t.id}>
              <div className="video-wrapper">
                {playing === t.id ? (
                  <iframe
                    src={`${embedUrl(t.video_url!)}?autoplay=1`}
                    title={`Video testimonial from ${t.name}`}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="video-embed"
                  />
                ) : (
                  <button type="button" className="video-placeholder" onClick={() => setPlaying(t.id)} aria-label={`Play video from ${t.name}`}>
                    <div className="play-button"><Icon name="play" /></div>
                  </button>
                )}
                {t.duration && playing !== t.id && <span className="video-duration">{t.duration}</span>}
              </div>
              <div className="video-testimonial-info">
                {t.quote && <p className="video-testimonial-quote">"{t.quote}"</p>}
                <div className="video-testimonial-author">
                  <div className="video-author-avatar">{initials(t.name)}</div>
                  <div className="video-author-details">
                    <strong>{t.name}</strong>
                    {t.role && <span>{t.role}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CaseStudies({ c, items }: { c: HomeContent['caseStudies']; items: Testimonial[] }) {
  const { open } = useSiteUi()
  if (items.length === 0) return null

  return (
    <section className="case-studies-section" id="case-studies">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />
        <div className="case-studies-grid">
          {items.map((t) => {
            const d = t.details ?? {}
            return (
              <div className="case-study-card" key={t.id}>
                <div className="case-study-header">
                  {d.outcome && <span className="case-study-outcome">{d.outcome}</span>}
                  {d.type && <div className="case-study-type">{d.type}</div>}
                  <h4>{d.title || t.name}</h4>
                </div>
                <div className="case-study-body">
                  {d.challenge && (
                    <div className="case-study-challenge">
                      <div className="case-label">Challenge</div>
                      <p>{d.challenge}</p>
                    </div>
                  )}
                  {d.approach && (
                    <div className="case-study-solution">
                      <div className="case-label">Our Approach</div>
                      <p>{d.approach}</p>
                    </div>
                  )}
                  {d.result && (
                    <div className="case-study-result">
                      <div className="case-label">Result</div>
                      <p>{d.result}</p>
                    </div>
                  )}
                </div>
                {d.stats && d.stats.length > 0 && (
                  <div className="case-study-stats">
                    {d.stats.map((s) => (
                      <div className="case-stat" key={s.label}>
                        <div className="case-stat-value">{s.value}</div>
                        <div className="case-stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="case-studies-cta">
          <button type="button" className="btn-primary" onClick={() => open('booking')}>{c.button}</button>
        </div>
      </div>
    </section>
  )
}

export function FaqSection({ c, faqs }: { c: HomeContent['faq']; faqs: Faq[] }) {
  const [openId, setOpenId] = useState<number | null>(null)
  if (faqs.length === 0) return null

  return (
    <section className="faq-section" id="faq">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />
        <div className="faq-container">
          {faqs.map((f) => {
            const isOpen = openId === f.id
            return (
              <div className={`faq-item${isOpen ? ' active' : ''}`} key={f.id}>
                <button
                  type="button"
                  className="faq-question"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${f.id}`}
                  onClick={() => setOpenId(isOpen ? null : f.id)}
                >
                  <h4>{f.question}</h4>
                  <div className="faq-icon" aria-hidden="true" />
                </button>
                <div className="faq-answer" id={`faq-${f.id}`}>
                  {f.answer.split(/\n{2,}/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function TrustBadges({ c }: { c: HomeContent['trustBadges'] }) {
  if (c.items.length === 0) return null
  return (
    <div className="trust-badges">
      {c.items.map((b) => (
        <div className="trust-badge" key={b.text}>
          <div className="trust-badge-icon"><Icon name={b.icon} /></div>
          <span>{b.text}</span>
        </div>
      ))}
    </div>
  )
}

export function About({ c }: { c: HomeContent['about'] }) {
  return (
    <section className="about-section" id="about">
      <div className="about-grid">
        <div className="about-content">
          <div className="eyebrow">{c.eyebrow}</div>
          <h2>{c.title}</h2>
          {c.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <div className="about-credentials">
            {c.credentials.map((cred) => (
              <div className="credential-item" key={cred.text}>
                <div className="credential-icon"><Icon name={cred.icon} /></div>
                <span>{cred.text}</span>
              </div>
            ))}
          </div>
        </div>

        {c.image ? (
          <div className="about-photo">
            <img src={c.image} alt={c.title} loading="lazy" />
          </div>
        ) : (
          <div className="familist-model-visual">
            <div className="model-title">{c.modelTitle}</div>
            <div className="model-diagram">
              <div className="model-item top"><h5>{c.modelTop}</h5></div>
              {c.modelMiddle.map((m) => (
                <div className="model-item" key={m.title}>
                  <h5>{m.title}</h5>
                  <p>{m.text}</p>
                </div>
              ))}
              <div className="model-item bottom">
                <h5>{c.modelBottomTitle}</h5>
                <p>{c.modelBottomText}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export function Contact({ c, settings }: { c: HomeContent['contact']; settings: SiteSettings }) {
  return (
    <section id="contact" className="contact-section">
      <div className="contact-inner">
        <div className="eyebrow eyebrow-center">{c.eyebrow}</div>
        <h2>{c.title}</h2>
        <div className="contact-tagline">{c.tagline}</div>

        <div className="contact-grid">
          <div className="contact-item">
            <div className="contact-label">Phone</div>
            <div className="contact-value">
              <a href={`tel:${settings.phoneNumber}`} onClick={() => track('phone_click', { event_category: 'Contact' })}>
                {settings.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-label">Email</div>
            <div className="contact-value">
              <a href={`mailto:${settings.email}`} onClick={() => track('email_click', { event_category: 'Contact' })}>
                {settings.email}
              </a>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-label">Location</div>
            <div className="contact-address">
              {settings.address.split('\n').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function GetStarted({ c, settings }: { c: HomeContent['getStarted']; settings: SiteSettings }) {
  const { open } = useSiteUi()
  const { pricing } = settings

  const features = (items: string[]) => (
    <ul className="cta-option-features">
      {items.map((f) => (
        <li key={f}>
          <Icon name="check" /> {f}
        </li>
      ))}
    </ul>
  )

  return (
    <section className="bottom-cta-section" id="get-started">
      <h2>{c.title}</h2>
      <p>{c.lead}</p>

      <div className="cta-options">
        <div className="cta-option-card">
          <div className="cta-option-icon"><Icon name="calendar" /></div>
          <h4>{c.consultationTitle}</h4>
          <p className="desc">{c.consultationText}</p>
          {features(c.consultationFeatures)}
          <button type="button" className="btn btn-gold" onClick={() => open('booking')}>{c.consultationButton}</button>
        </div>

        <div className="cta-option-card featured">
          <div className="cta-option-icon"><Icon name="video" /></div>
          <h4>{c.trainingTitle}</h4>
          <div className="price">
            {money(pricing.trainingPrice, pricing.currency)} <span>one-time</span>
          </div>
          <p className="desc">{c.trainingText}</p>
          {features(c.trainingFeatures)}
          <button type="button" className="btn btn-gold" onClick={() => open('training')}>
            {c.trainingButton} — {money(pricing.trainingPrice, pricing.currency)}
          </button>
        </div>
      </div>
    </section>
  )
}
