import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { scrollToAnchor } from '../lib/anchors'

/**
 * Link to a home-page section. On the home page it smooth-scrolls (with the
 * header offset); elsewhere it navigates to /#section and the home page
 * scrolls once rendered.
 */
export default function SectionLink({
  to,
  onClick,
  ...props
}: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const location = useLocation()
  const navigate = useNavigate()

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.metaKey || e.ctrlKey) return
    e.preventDefault()
    if (location.pathname === '/') {
      if (to === 'top') window.scrollTo({ top: 0, behavior: 'smooth' })
      else scrollToAnchor(to)
      window.history.replaceState(null, '', to === 'top' ? '/' : `/#${to}`)
    } else {
      navigate(to === 'top' ? '/' : `/#${to}`)
    }
  }

  return <a href={to === 'top' ? '/' : `/#${to}`} onClick={handle} {...props} />
}
