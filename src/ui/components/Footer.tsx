import type { CSSProperties } from 'react'
import { colors, maxContentWidth, typography } from '../../design/tokens'

const band: CSSProperties = {
  backgroundColor: colors.surfaceDark,
  color: colors.onDarkSoft,
  padding: 64,
  fontFamily: typography.bodySm.fontFamily,
  fontSize: typography.bodySm.fontSize
}

const inner: CSSProperties = {
  maxWidth: maxContentWidth,
  margin: '0 auto'
}

export function Footer() {
  return (
    <footer data-testid="footer" style={band}>
      <div style={inner}>
        <div style={{ color: colors.onDark }}>Vantrilex</div>
        <div>Next-Gen Agentic Workbench and Launcher</div>
      </div>
    </footer>
  )
}
