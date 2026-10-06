const STYLE_ID = 'quackback-widget-styles'

export function ensureStyles(side: 'left' | 'right'): void {
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = [
    '.quackback-panel{position:fixed;z-index:2147483647;overflow:hidden;pointer-events:none;',
    `bottom:88px;${side}:24px;width:400px;height:min(600px,calc(100vh - 108px));`,
    'border-radius:12px;border:1px solid rgba(31,29,24,0.22);box-shadow:0 24px 60px -12px rgba(31,29,24,0.38),0 2px 6px rgba(31,29,24,0.08);',
    `opacity:0;transform:scale(0);transform-origin:bottom ${side};`,
    'transition:opacity 280ms cubic-bezier(0.34,1.56,0.64,1),transform 280ms cubic-bezier(0.34,1.56,0.64,1)}',
    '.quackback-panel.quackback-open{opacity:1;transform:scale(1);pointer-events:auto}',
    '.quackback-panel.quackback-closing{opacity:0;transform:scale(0);pointer-events:none;',
    'transition:opacity 200ms cubic-bezier(0.4,0,1,1),transform 200ms cubic-bezier(0.4,0,1,1)}',
    '@media(max-width:639px){',
    '.quackback-panel{top:0;left:0;right:0;bottom:0;width:100%;height:100vh;',
    'border-radius:0;border:0;box-shadow:none;',
    'opacity:1;visibility:hidden;transform:translateY(100%);transform-origin:center;',
    'transition:transform 300ms cubic-bezier(0.4,0,0.2,1),visibility 0s linear 300ms}',
    '.quackback-panel.quackback-open{transform:translateY(0);visibility:visible;transition:transform 300ms cubic-bezier(0.4,0,0.2,1),visibility 0s linear 0s}',
    '.quackback-panel.quackback-closing{transform:translateY(100%);visibility:hidden;transition:transform 200ms cubic-bezier(0.4,0,1,1),visibility 0s linear 200ms}}',
    '.quackback-backdrop{position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,0.4);',
    'opacity:0;pointer-events:none;transition:opacity 200ms ease}',
    '.quackback-backdrop.quackback-open{opacity:1;pointer-events:auto}',
    '@media(min-width:640px){.quackback-backdrop{display:none!important}}',
  ].join('')
  document.head.appendChild(el)
}

export function removeStyles(): void {
  document.getElementById(STYLE_ID)?.remove()
}
