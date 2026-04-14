import 'intersection-observer'
import ResizeObserver from 'resize-observer-polyfill'

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserver
}

// Polyfill for smooth scrolling if needed
import smoothscroll from 'smoothscroll-polyfill'
smoothscroll.polyfill()
