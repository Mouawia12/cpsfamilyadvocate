/** Header height the original design offsets anchor scrolling by. */
const HEADER_OFFSET = 90

export function scrollToAnchor(id: string, behavior: ScrollBehavior = 'smooth') {
  const target = document.getElementById(id)
  if (!target) return false
  const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top, behavior })
  return true
}
