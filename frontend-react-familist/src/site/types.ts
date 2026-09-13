/** Shapes of the public content API. Mirrors backend-familist/database/data/home.json. */

export interface SiteSettings {
  brandName: string
  tagline: string
  phoneDisplay: string
  phoneNumber: string
  email: string
  whatsappNumber: string
  whatsappMessage: string
  address: string
  hours: string
  footerBlurb: string
  disclaimer: string
  crisisBar: { enabled: boolean; title: string; text: string }
  pricing: { currency: string; consultationPrice: number; consultationMinutes: number; trainingPrice: number }
  integrations: { gaMeasurementId: string; spotifyShowUrl: string }
  social: Record<string, string>
}

export interface TitleText {
  title: string
  text: string
}

export interface CardWithPoints extends TitleText {
  points: string[]
}

export interface SectionHeader {
  eyebrow: string
  title: string
  lead: string
}

export interface HomeContent {
  seo: { title: string; description: string; keywords: string; ogImage: string }
  header: { languages: { label: string; url: string; active?: boolean }[] }
  hero: {
    eyebrow: string
    titleStart: string
    titleEmphasis: string
    lead: string
    primaryButton: string
    secondaryButton: string
    credentials: { value: string; label: string }[]
    cards: (TitleText & { anchor: string })[]
  }
  credentialsBar: { items: { icon: string; strong: string; text: string }[] }
  services: SectionHeader & { items: TitleText[]; processEyebrow: string; processTitle: string; steps: TitleText[] }
  inlineCta: TitleText & { button: string }
  attorneys: SectionHeader & {
    heading: string
    body: string
    services: string[]
    button: string
    credentialsTitle: string
    credentials: string[]
    practiceAreasTitle: string
    practiceAreas: string[]
  }
  socialWorkers: SectionHeader & {
    heading: string
    body: string
    languageTitle: string
    languageText: string
    button: string
    whyTitle: string
    why: string[]
    cards: CardWithPoints[]
  }
  parents: SectionHeader & {
    rights: {
      tabLabel: string
      title: string
      body: string
      button: string
      boxTitle: string
      items: { strong: string; text: string }[]
    }
    casePlan: { tabLabel: string; title: string; body: string; cards: CardWithPoints[] }
    reunification: {
      tabLabel: string
      title: string
      body: string
      button: string
      timelineTitle: string
      timeline: TitleText[]
      cards: CardWithPoints[]
      keysTitle: string
      keys: TitleText[]
    }
  }
  caregivers: SectionHeader & {
    foster: CaregiverTab & { sideTitle: string; sidePoints: string[] }
    kinship: CaregiverTab & { assistanceTitle: string; assistance: string[] }
    family: CaregiverTab & { sideTitle: string; sidePoints: string[] }
  }
  immigration: {
    eyebrow: string
    title: string
    body: string
    arabicText: string
    arabicTranslation: string
    button: string
    items: string[]
  }
  resources: SectionHeader & {
    media: {
      tabLabel: string
      podcastTitle: string
      podcastText: string
      newsletterTitle: string
      newsletterText: string
      newsletterButton: string
      blogTitle: string
      blogText: string
      topicsTitle: string
      topics: string[]
    }
    library: { tabLabel: string; items: (TitleText & { icon: string; url: string })[] }
    training: {
      tabLabel: string
      title: string
      body: string
      modules: TitleText[]
      applyTitle: string
      apply: string[]
      certNotice: string
      button: string
    }
  }
  store: SectionHeader & { intro: string; ctaTitle: string; ctaText: string; ctaButton: string }
  freeGuides: {
    eyebrow: string
    title: string
    body: string
    guides: string[]
    formTitle: string
    formText: string
    button: string
    note: string
    successTitle: string
    successText: string
  }
  testimonials: SectionHeader
  videoTestimonials: SectionHeader
  caseStudies: SectionHeader & { button: string }
  faq: SectionHeader
  trustBadges: { items: { icon: string; text: string }[] }
  about: {
    eyebrow: string
    title: string
    paragraphs: string[]
    credentials: { icon: string; text: string }[]
    image: string
    modelTitle: string
    modelTop: string
    modelMiddle: TitleText[]
    modelBottomTitle: string
    modelBottomText: string
  }
  contact: { eyebrow: string; title: string; tagline: string }
  getStarted: {
    title: string
    lead: string
    consultationTitle: string
    consultationText: string
    consultationFeatures: string[]
    consultationButton: string
    trainingTitle: string
    trainingText: string
    trainingFeatures: string[]
    trainingButton: string
  }
  bookingModal: ModalContent
  trainingModal: ModalContent & { featuresTitle: string; features: string[] }
  exitPopup: {
    enabled: boolean
    title: string
    text: string
    guides: string[]
    button: string
    skip: string
    successTitle: string
    successText: string
  }
}

interface CaregiverTab {
  tabLabel: string
  title: string
  body: string
  points: string[]
}

interface ModalContent {
  title: string
  text: string
  button: string
  note: string
  successTitle: string
  successText: string
}

export interface Faq {
  id: number
  question: string
  answer: string
}

export interface Testimonial {
  id: number
  kind: 'text' | 'video' | 'case_study'
  name: string
  role: string | null
  quote: string | null
  rating: number | null
  video_url: string | null
  duration: string | null
  details: {
    outcome?: string
    type?: string
    title?: string
    challenge?: string
    approach?: string
    result?: string
    stats?: { value: string; label: string }[]
  } | null
}

export interface Product {
  id: number
  name: string
  tagline: string | null
  price: number
  icon: 'shirt' | 'mug' | 'book'
  image_url: string | null
  status: 'coming_soon' | 'available'
  buy_url: string | null
}

export interface PodcastEpisode {
  id: number
  title: string
  episode_number: number | null
  description: string | null
  spotify_url: string | null
  image_url: string | null
  duration: string | null
  published_at: string | null
}

export interface ArticleCard {
  id: number
  title: string
  slug: string
  image_url: string | null
  excerpt: string | null
  read_time: string | null
  published_at: string | null
  category?: { name: string; slug: string }
}

export interface Article extends ArticleCard {
  seo_title: string | null
  body: string | null
  meta_description: string | null
  author: string | null
  faqs: { q: string; a: string }[]
}

export interface HomeBundle {
  settings: SiteSettings
  page: HomeContent
  faqs: Faq[]
  testimonials: Record<Testimonial['kind'], Testimonial[]>
  products: Product[]
  episodes: PodcastEpisode[]
  articles: ArticleCard[]
}

export interface LegalPage {
  title: string
  updated: string
  body: string
}
