import type { CSSProperties } from 'react'
import { colors, maxContentWidth, typography } from '../../design/tokens'

const bar: CSSProperties = {
  backgroundColor: colors.canvas,
  height: 64,
  display: 'flex',
  alignItems: 'center'
}

const inner: CSSProperties = {
  maxWidth: maxContentWidth,
  margin: '0 auto',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  fontFamily: typography.button.fontFamily,
  fontSize: 14,
  fontWeight: 500
}

export function TopNav() {
  return (
    <header data-testid="top-nav" style={bar}>
      <div style={inner}>
        <span style={{ color: colors.ink }}>Vantrilex</span>
        <nav style={{ display: 'flex', gap: 16, color: colors.body }}>
          <span>Projects</span>
          <span>Agents</span>
          <span>Docs</span>
        </nav>
      </div>
    </header>
  )
}
