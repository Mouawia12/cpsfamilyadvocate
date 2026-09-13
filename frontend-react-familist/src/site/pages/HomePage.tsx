import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useHome } from '../data'
import { scrollToAnchor } from '../lib/anchors'
import {
  Attorneys,
  Caregivers,
  CredentialsBar,
  Hero,
  Immigration,
  InlineCta,
  Parents,
  Services,
  SocialWorkers,
} from '../sections/TopSections'
import {
  About,
  CaseStudies,
  Contact,
  FaqSection,
  FreeGuides,
  GetStarted,
  Resources,
  Store,
  Testimonials,
  TrustBadges,
  VideoTestimonials,
} from '../sections/BottomSections'

export default function HomePage() {
  const { data } = useHome()
  const location = useLocation()

  // Arriving at /#section from another page: jump there once the content exists.
  useEffect(() => {
    if (!data || !location.hash) return
    const id = decodeURIComponent(location.hash.slice(1))
    requestAnimationFrame(() => scrollToAnchor(id, 'auto'))
  }, [data, location.hash])

  useEffect(() => {
    if (data) document.title = data.page.seo.title
  }, [data])

  if (!data) return <div className="page-loading" aria-busy="true" />

  const { page: c, settings, testimonials } = data

  return (
    <>
      <Hero c={c.hero} />
      <CredentialsBar c={c.credentialsBar} />
      <Services c={c.services} />
      <InlineCta c={c.inlineCta} settings={settings} />
      <Attorneys c={c.attorneys} />
      <SocialWorkers c={c.socialWorkers} />
      <Parents c={c.parents} />
      <Caregivers c={c.caregivers} />
      <Immigration c={c.immigration} />
      <Resources c={c.resources} episodes={data.episodes} articles={data.articles} />
      <Store c={c.store} products={data.products} currency={settings.pricing.currency} />
      <FreeGuides c={c.freeGuides} />
      <Testimonials c={c.testimonials} items={testimonials.text} />
      <VideoTestimonials c={c.videoTestimonials} items={testimonials.video} />
      <CaseStudies c={c.caseStudies} items={testimonials.case_study} />
      <FaqSection c={c.faq} faqs={data.faqs} />
      <TrustBadges c={c.trustBadges} />
      <About c={c.about} />
      <Contact c={c.contact} settings={settings} />
      <GetStarted c={c.getStarted} settings={settings} />
    </>
  )
}
