import { useQuery } from '@tanstack/react-query'
import { apiGet, apiGetPaginated } from '@/lib/api'
import { peekInitial, takeInitial } from '@/lib/initialState'
import type { Article, ArticleCard, HomeBundle, LegalPage, PodcastEpisode, SiteSettings } from './types'

/** Home page payload (settings + content + collections). */
export function useHome() {
  return useQuery({
    queryKey: ['home'],
    queryFn: () => apiGet<HomeBundle>('/home'),
    initialData: () => takeInitial<HomeBundle>('home'),
    staleTime: 60_000,
  })
}

/** Site settings; shared by every page (header, footer, floating buttons). */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiGet<SiteSettings>('/settings'),
    initialData: () => peekInitial<SiteSettings>('settings') ?? peekInitial<HomeBundle>('home')?.settings,
    staleTime: 5 * 60_000,
  })
}

export function useArticles(params: { page?: number; category?: string; search?: string }) {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => apiGetPaginated<ArticleCard>('/articles', { per_page: 12, ...params }),
    placeholderData: (previous) => previous,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ id: number; name: string; slug: string; articles_count: number }[]>('/categories'),
    staleTime: 5 * 60_000,
  })
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ['article', slug],
    queryFn: () => apiGet<Article>(`/articles/${slug}`),
    initialData: () => takeInitial<Article>('article', (a) => a.slug === slug),
    retry: false,
  })
}

export function useEpisodes() {
  return useQuery({
    queryKey: ['episodes'],
    queryFn: () => apiGet<PodcastEpisode[]>('/podcast'),
    initialData: () => takeInitial<PodcastEpisode[]>('episodes'),
  })
}

export function useLegalPage(key: string) {
  return useQuery({
    queryKey: ['page', key],
    queryFn: async () => (await apiGet<{ data: LegalPage }>(`/pages/${key}`)).data,
    initialData: () => takeInitial<Record<string, LegalPage>>('page', (p) => key in p)?.[key],
  })
}

/** "$150" — whole numbers without decimals. */
export function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}
