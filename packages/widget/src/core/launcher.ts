export interface LauncherOptions {
  placement: 'left' | 'right'
  onClick: () => void
}

export interface LauncherHandle {
  el: HTMLButtonElement
  setOpen(open: boolean): void
  /** Replace the button colors (typically called after server config fetch). */
  setColors(colors: { backgroundColor?: string; foregroundColor?: string }): void
  /** Fade the button in. Called after initial colors are set to avoid a color flash. */
  reveal(): void
  remove(): void
}

// Quackback brand defaults — shown briefly before the server theme fetch
// completes, or as the permanent colors if the fetch fails.
const DEFAULT_BG = '#000000'
const DEFAULT_FG = '#facc15'

const CHAT_ICON =
  // Lucide `messages-square` (lucide-react 1.8.0, icons/messages-square.js) :
  // deux bulles de conversation qui se chevauchent, cohérentes avec le hub
  // « Aide et idées ». Traits et non aplat, pour matcher CLOSE_ICON juste en
  // dessous (même famille visuelle que le reste de Lucide dans l'app Diafane).
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1"/></svg>'
const CLOSE_ICON =
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export function createLauncher(opts: LauncherOptions): LauncherHandle {
  let bg = DEFAULT_BG
  let fg = DEFAULT_FG

  const btn = document.createElement('button')
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    [opts.placement === 'left' ? 'left' : 'right']: '24px',
    zIndex: '2147483647',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    padding: '0',
    border: 'none',
    borderRadius: '50%',
    backgroundColor: bg,
    color: fg,
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    opacity: '0',
    transition:
      'opacity 450ms ease, transform 200ms ease, box-shadow 200ms ease, background-color 200ms ease, color 200ms ease',
  })
  btn.setAttribute('aria-label', 'Open feedback widget')
  btn.setAttribute('aria-expanded', 'false')

  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    position: 'relative',
    display: 'flex',
    width: '28px',
    height: '28px',
    flexShrink: '0',
  })

  const iconTransition =
    'opacity 220ms cubic-bezier(0.34,1.56,0.64,1), transform 220ms cubic-bezier(0.34,1.56,0.64,1)'
  const iconChat = document.createElement('span')
  Object.assign(iconChat.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    display: 'flex',
    opacity: '1',
    transform: 'rotate(0deg)',
    transition: iconTransition,
  })
  iconChat.innerHTML = CHAT_ICON
  const iconClose = document.createElement('span')
  Object.assign(iconClose.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    display: 'flex',
    opacity: '0',
    transform: 'rotate(-90deg)',
    transition: iconTransition,
  })
  iconClose.innerHTML = CLOSE_ICON
  wrapper.appendChild(iconChat)
  wrapper.appendChild(iconClose)
  btn.appendChild(wrapper)

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px)'
    btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'
  })
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)'
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  })
  btn.addEventListener('click', opts.onClick)

  document.body.appendChild(btn)

  return {
    el: btn,
    setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
      btn.setAttribute('aria-label', open ? 'Close feedback widget' : 'Open feedback widget')
      iconChat.style.opacity = open ? '0' : '1'
      iconChat.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)'
      iconClose.style.opacity = open ? '1' : '0'
      iconClose.style.transform = open ? 'rotate(0deg)' : 'rotate(-90deg)'
    },
    setColors(colors) {
      if (colors.backgroundColor) {
        bg = colors.backgroundColor
        btn.style.backgroundColor = bg
      }
      if (colors.foregroundColor) {
        fg = colors.foregroundColor
        btn.style.color = fg
      }
    },
    reveal() {
      btn.style.opacity = '1'
    },
    remove() {
      btn.remove()
    },
  }
}
