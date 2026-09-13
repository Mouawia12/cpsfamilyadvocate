/**
 * Data Laravel inlines into index.html (window.__FAMILIST__) for the URL that
 * was requested. Each key is handed out once, so client-side navigation to a
 * different page fetches fresh data instead of reusing the first page's.
 */
type InitialState = Partial<Record<'home' | 'settings' | 'article' | 'episodes' | 'page', unknown>>

declare global {
  interface Window {
    __FAMILIST__?: InitialState
  }
}

const state: InitialState = (typeof window !== 'undefined' && window.__FAMILIST__) || {}

export function takeInitial<T>(key: keyof InitialState, matches: (value: T) => boolean = () => true): T | undefined {
  const value = state[key] as T | undefined
  if (value === undefined || !matches(value)) return undefined
  delete state[key]
  return value
}

/** Read without consuming (settings are shared by every page). */
export function peekInitial<T>(key: keyof InitialState): T | undefined {
  return state[key] as T | undefined
}
