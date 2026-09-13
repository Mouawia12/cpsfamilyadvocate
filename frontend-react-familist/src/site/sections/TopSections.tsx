import { useState } from 'react'
import type { HomeContent, SiteSettings } from '../types'
import { money } from '../data'
import { useSiteUi } from '../SiteLayout'
import SectionLink from '../components/SectionLink'
import Icon from '../components/Icon'

export function SectionHeader({
  eyebrow,
  title,
  lead,
  centered = false,
}: {
  eyebrow?: string
  title: string
  lead?: string
  centered?: boolean
}) {
  return (
    <div className={`section-header${centered ? ' centered' : ''}`}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2>{title}</h2>
      {lead && <p>{lead}</p>}
    </div>
  )
}

/** Tab strip shared by the Parents, Caregivers and Resources sections. */
function useTabs<T extends string>(first: T) {
  const [active, setActive] = useState<T>(first)
  const tab = (key: T, label: string) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={active === key}
      className={`tab-btn${active === key ? ' active' : ''}`}
      onClick={() => setActive(key)}
    >
      {label}
    </button>
  )
  const panel = (key: T) => (active === key ? ' active' : '')
  return { tab, panel }
}

export function Hero({ c }: { c: HomeContent['hero'] }) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-content">
          <div className="eyebrow">{c.eyebrow}</div>
          <h1>
            {c.titleStart} <em>{c.titleEmphasis}</em>
          </h1>
          <p className="hero-lead">{c.lead}</p>

          <div className="hero-actions">
            <SectionLink to="contact" className="btn btn-primary btn-arrow">
              {c.primaryButton}
            </SectionLink>
            <SectionLink to="services" className="btn btn-outline">
              {c.secondaryButton}
            </SectionLink>
          </div>

          <div className="hero-credentials">
            {c.credentials.map((cred) => (
              <div className="credential-item" key={cred.label}>
                <strong>{cred.value}</strong>
                <span>{cred.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-cards">
            {c.cards.map((card) => (
              <SectionLink to={card.anchor} className="hero-card" key={card.title}>
                <h4>{card.title}</h4>
                <p>{card.text}</p>
                <span className="card-link">Learn More →</span>
              </SectionLink>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function CredentialsBar({ c }: { c: HomeContent['credentialsBar'] }) {
  return (
    <div className="credentials-bar">
      <div className="credentials-inner">
        {c.items.map((item) => (
          <div className="cred-badge" key={item.strong}>
            <div className="cred-badge-icon">
              <Icon name={item.icon} />
            </div>
            <span>
              <strong>{item.strong}</strong> {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii']

export function Services({ c }: { c: HomeContent['services'] }) {
  return (
    <section id="services" className="bg-cream">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />

        <div className="services-grid">
          {c.items.map((s, i) => (
            <div className="service-card" key={s.title}>
              <div className="service-num">{String(i + 1).padStart(2, '0')}</div>
              <h4>{s.title}</h4>
              <p>{s.text}</p>
            </div>
          ))}
        </div>

        <div className="process-section">
          <div className="process-header">
            <div className="eyebrow eyebrow-center">{c.processEyebrow}</div>
            <h3>{c.processTitle}</h3>
          </div>
          <div className="process-grid">
            {c.steps.map((step, i) => (
              <div className="process-step" key={step.title}>
                <div className="step-marker">{ROMAN[i] ?? i + 1}</div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function InlineCta({ c, settings }: { c: HomeContent['inlineCta']; settings: SiteSettings }) {
  const { open } = useSiteUi()
  return (
    <div className="inline-cta">
      <div className="inline-cta-content">
        <h4>{c.title}</h4>
        <p>{c.text}</p>
      </div>
      <button type="button" className="btn btn-primary btn-arrow" onClick={() => open('booking')}>
        {c.button} — {money(settings.pricing.consultationPrice, settings.pricing.currency)}
      </button>
    </div>
  )
}

export function Attorneys({ c }: { c: HomeContent['attorneys'] }) {
  return (
    <section id="attorneys">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} />

        <div className="split-layout">
          <div className="split-content">
            <h3>{c.heading}</h3>
            <p>{c.body}</p>
            <ul className="service-list">
              {c.services.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <SectionLink to="contact" className="btn btn-primary btn-arrow">
              {c.button}
            </SectionLink>
          </div>

          <div className="info-box">
            <h4>{c.credentialsTitle}</h4>
            <ul className="info-list">
              {c.credentials.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="tag-group">
              <h5>{c.practiceAreasTitle}</h5>
              <div className="tags">
                {c.practiceAreas.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PointsCard({ className, card }: { className: string; card: { title: string; text: string; points: string[] } }) {
  return (
    <div className={className}>
      <h4>{card.title}</h4>
      <p>{card.text}</p>
      <ul>
        {card.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  )
}

export function SocialWorkers({ c }: { c: HomeContent['socialWorkers'] }) {
  return (
    <section id="socialworkers" className="bg-cream">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} />

        <div className="sw-intro">
          <div>
            <h3>{c.heading}</h3>
            <p>{c.body}</p>
            <div className="language-highlight">
              <strong>{c.languageTitle}</strong>
              <span>{c.languageText}</span>
            </div>
            <SectionLink to="contact" className="btn btn-primary btn-arrow">
              {c.button}
            </SectionLink>
          </div>

          <div className="info-box">
            <h4>{c.whyTitle}</h4>
            <ul className="info-list">
              {c.why.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sw-cards">
          {c.cards.map((card) => (
            <PointsCard className="sw-card" card={card} key={card.title} />
          ))}
        </div>
      </div>
    </section>
  )
}

export function Parents({ c }: { c: HomeContent['parents'] }) {
  const { tab, panel } = useTabs<'rights' | 'caseplan' | 'reunification'>('rights')
  const { rights, casePlan, reunification } = c

  return (
    <section id="parents">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />

        <div className="parents-container">
          <div className="tab-nav" role="tablist">
            {tab('rights', rights.tabLabel)}
            {tab('caseplan', casePlan.tabLabel)}
            {tab('reunification', reunification.tabLabel)}
          </div>

          <div id="rights" className={`parent-panel${panel('rights')}`} role="tabpanel">
            <div className="panel-intro">
              <div>
                <h3>{rights.title}</h3>
                <p>{rights.body}</p>
                <SectionLink to="contact" className="btn btn-primary btn-arrow">
                  {rights.button}
                </SectionLink>
              </div>
              <div className="highlight-box">
                <h4>{rights.boxTitle}</h4>
                <ul className="highlight-list">
                  {rights.items.map((item) => (
                    <li key={item.strong}>
                      <strong>{item.strong}</strong> — {item.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div id="caseplan" className={`parent-panel${panel('caseplan')}`} role="tabpanel">
            <div className="section-header centered panel-subheader">
              <h3>{casePlan.title}</h3>
              <p>{casePlan.body}</p>
            </div>
            <div className="panel-cards">
              {casePlan.cards.map((card) => (
                <PointsCard className="panel-card" card={card} key={card.title} />
              ))}
            </div>
          </div>

          <div id="reunification" className={`parent-panel${panel('reunification')}`} role="tabpanel">
            <div className="panel-intro">
              <div>
                <h3>{reunification.title}</h3>
                <p>{reunification.body}</p>
                <SectionLink to="contact" className="btn btn-primary btn-arrow">
                  {reunification.button}
                </SectionLink>
              </div>
              <div className="timeline-box">
                <h4>{reunification.timelineTitle}</h4>
                {reunification.timeline.map((step, i) => (
                  <div className="timeline-item" key={step.title}>
                    <div className="timeline-marker">{i + 1}</div>
                    <div>
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-cards">
              {reunification.cards.map((card) => (
                <PointsCard className="panel-card panel-card-gold" card={card} key={card.title} />
              ))}
            </div>
            <div className="keys-section">
              <h4>{reunification.keysTitle}</h4>
              <div className="keys-grid">
                {reunification.keys.map((key) => (
                  <div className="key-item" key={key.title}>
                    <strong>{key.title}</strong>
                    <p>{key.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <ul className="simple-list">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  )
}

export function Caregivers({ c }: { c: HomeContent['caregivers'] }) {
  const { tab, panel } = useTabs<'foster' | 'kinship' | 'family'>('foster')
  const { foster, kinship, family } = c

  return (
    <section id="caregivers" className="bg-cream">
      <div className="container">
        <SectionHeader eyebrow={c.eyebrow} title={c.title} lead={c.lead} centered />

        <div className="caregivers-container">
          <div className="tab-nav" role="tablist">
            {tab('foster', foster.tabLabel)}
            {tab('kinship', kinship.tabLabel)}
            {tab('family', family.tabLabel)}
          </div>

          <div id="foster" className={`tab-panel${panel('foster')}`} role="tabpanel">
            <div className="caregiver-grid">
              <div>
                <h3>{foster.title}</h3>
                <p>{foster.body}</p>
                <SimpleList items={foster.points} />
              </div>
              <div>
                <h3>{foster.sideTitle}</h3>
                <SimpleList items={foster.sidePoints} />
              </div>
            </div>
          </div>

          <div id="kinship" className={`tab-panel${panel('kinship')}`} role="tabpanel">
            <div className="caregiver-grid">
              <div>
                <h3>{kinship.title}</h3>
                <p>{kinship.body}</p>
                <SimpleList items={kinship.points} />
              </div>
              <div>
                <div className="assistance-box">
                  <h4>{kinship.assistanceTitle}</h4>
                  <div className="assistance-grid">
                    {kinship.assistance.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="family" className={`tab-panel${panel('family')}`} role="tabpanel">
            <div className="caregiver-grid">
              <div>
                <h3>{family.title}</h3>
                <p>{family.body}</p>
                <SimpleList items={family.points} />
              </div>
              <div>
                <h3>{family.sideTitle}</h3>
                <SimpleList items={family.sidePoints} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Immigration({ c }: { c: HomeContent['immigration'] }) {
  return (
    <section id="immigration" className="immigration-section">
      <div className="container">
        <div className="immigration-layout">
          <div className="immigration-content">
            <div className="eyebrow">{c.eyebrow}</div>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            {c.arabicText && (
              <div className="arabic-display">
                <div className="arabic-text" lang="ar" dir="rtl">
                  {c.arabicText}
                </div>
                <div className="arabic-translation">{c.arabicTranslation}</div>
              </div>
            )}
            <SectionLink to="contact" className="btn btn-gold btn-arrow">
              {c.button}
            </SectionLink>
          </div>

          <div className="immigration-services">
            {c.items.map((item) => (
              <div className="imm-item" key={item}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
