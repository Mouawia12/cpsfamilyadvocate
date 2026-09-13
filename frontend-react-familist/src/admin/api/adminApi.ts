import { api, apiDelete, apiGet, apiGetPaginated, apiPost, apiPut } from '@/lib/api'
import type { AuthUser } from '@/store/auth'
import type { Article, ArticleCard, Faq, HomeContent, LegalPage, PodcastEpisode, Product, SiteSettings, Testimonial } from '@/site/types'

export interface Category {
  id: number
  name: string
  slug: string
  articles_count?: number
}

export interface AdminArticle extends Article {
  status: 'draft' | 'published'
  featured: boolean
  focus_keywords: string | null
  category?: { id: number; name: string; slug: string }
}

export type ArticleInput = {
  title: string
  slug?: string
  category_id?: number | null
  image_url?: string | null
  seo_title?: string | null
  excerpt?: string | null
  body?: string | null
  meta_description?: string | null
  focus_keywords?: string | null
  read_time?: string | null
  author?: string | null
  faqs?: { q: string; a: string }[]
  status?: string
  featured?: boolean
}

export interface Order {
  id: number
  kind: 'consultation' | 'training'
  name: string
  email: string
  phone: string | null
  contact_method: string | null
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'cancelled' | 'fulfilled'
  paid_at: string | null
  created_at: string
}

export interface Lead {
  id: number
  first_name: string | null
  email: string
  role: string | null
  source: string
  created_at: string
}

export interface DashboardStats {
  articles: number
  published: number
  episodes: number
  testimonialsVisible: number
  ordersPending: number
  ordersPaid: number
  revenue: number
  leads: number
  leadsThisWeek: number
  integrations: { stripe: boolean; stripeWebhook: boolean; mail: boolean }
  recentOrders: Pick<Order, 'id' | 'kind' | 'name' | 'amount' | 'status' | 'created_at'>[]
}

export interface ImportPreviewArticle {
  title: string
  slug: string
  category: string | null
  seo_title: string | null
  meta_description: string | null
  focus_keywords: string | null
  read_time: string | null
  excerpt: string
  faqs: { q: string; a: string }[]
  images: number
  words: number
  exists: boolean
}

type AdminTestimonial = Testimonial & { visible: boolean; sort_order: number }
type AdminFaq = Faq & { visible: boolean; sort_order: number }
type AdminProduct = Product & { visible: boolean; sort_order: number }
type AdminEpisode = PodcastEpisode & { visible: boolean }

/** CRUD helpers for the small collections behind the shared CrudController. */
function collection<T extends { id: number }>(uri: string) {
  return {
    list: (params?: object) => apiGet<T[]>(`/admin/${uri}`, params),
    create: (data: Partial<T>) => apiPost<T>(`/admin/${uri}`, data),
    update: (id: number, data: Partial<T>) => apiPut<T>(`/admin/${uri}/${id}`, data),
    remove: (id: number) => apiDelete<null>(`/admin/${uri}/${id}`),
  }
}

export const adminApi = {
  login: (email: string, password: string) =>
    apiPost<{ token: string; user: AuthUser }>('/auth/login', { email, password }),
  logout: () => apiPost<null>('/auth/logout'),
  updatePassword: (current_password: string, password: string, password_confirmation: string) =>
    apiPut<null>('/auth/password', { current_password, password, password_confirmation }),

  stats: () => apiGet<DashboardStats>('/admin/stats'),

  articles: (params?: { search?: string; status?: string; page?: number; per_page?: number }) =>
    apiGetPaginated<ArticleCard & { status: string; featured: boolean }>('/admin/articles', params),
  article: (slug: string) => apiGet<AdminArticle>(`/admin/articles/${slug}`),
  createArticle: (data: ArticleInput) => apiPost<AdminArticle>('/admin/articles', data),
  updateArticle: (slug: string, data: ArticleInput) => apiPut<AdminArticle>(`/admin/articles/${slug}`, data),
  deleteArticle: (slug: string) => apiDelete<null>(`/admin/articles/${slug}`),

  categories: () => apiGet<Category[]>('/admin/categories'),
  createCategory: (data: Partial<Category>) => apiPost<Category>('/admin/categories', data),
  updateCategory: (id: number, data: Partial<Category>) => apiPut<Category>(`/admin/categories/${id}`, data),
  deleteCategory: (id: number) => apiDelete<null>(`/admin/categories/${id}`),

  importDocx: async (file: File, options: { dryRun: boolean; overwrite?: boolean; status?: string }) => {
    const form = new FormData()
    form.append('file', file)
    form.append('dry_run', options.dryRun ? '1' : '0')
    form.append('overwrite', options.overwrite ? '1' : '0')
    if (options.status) form.append('status', options.status)
    const { data } = await api.post('/admin/import/docx', form)
    return data as { message: string; data: { author?: string; articles?: ImportPreviewArticle[]; created?: number; updated?: number; skipped?: number; categories?: number } }
  },

  homeContent: async () => (await apiGet<{ data: HomeContent }>('/admin/pages/home')).data,
  updateHomeContent: (data: HomeContent) => apiPut('/admin/pages/home', { data }),
  legalPage: async (key: string) => (await apiGet<{ data: LegalPage }>(`/admin/pages/${key}`)).data,
  updateLegalPage: (key: string, data: LegalPage) => apiPut(`/admin/pages/${key}`, { data }),

  podcast: collection<AdminEpisode>('podcast'),
  testimonials: collection<AdminTestimonial>('testimonials'),
  faqs: collection<AdminFaq>('faqs'),
  products: collection<AdminProduct>('products'),

  orders: (params?: { kind?: string; status?: string; search?: string; page?: number }) =>
    apiGetPaginated<Order>('/admin/orders', params),
  updateOrder: (id: number, status: Order['status']) => apiPut<Order>(`/admin/orders/${id}`, { status }),

  leads: (params?: { source?: string; search?: string; page?: number }) => apiGetPaginated<Lead>('/admin/leads', params),
  deleteLead: (id: number) => apiDelete<null>(`/admin/leads/${id}`),
  exportLeads: async () => {
    const { data } = await api.get('/admin/leads/export', { responseType: 'blob' })
    return data as Blob
  },

  settings: () => apiGet<SiteSettings>('/admin/settings'),
  updateSettings: (data: Partial<SiteSettings>) => apiPut<SiteSettings>('/admin/settings', { data }),

  uploadMedia: async (file: File): Promise<{ url: string; path: string }> => {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post('/admin/media', form)
    return data.data
  },
}

export type { AdminEpisode, AdminFaq, AdminProduct, AdminTestimonial }
