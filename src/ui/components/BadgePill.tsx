import type { CSSProperties, ReactNode } from 'react'
import { colors, radii, typography } from '../../design/tokens'

export type BadgeTone = 'neutral' | 'coral' | 'success' | 'warning' | 'error'

interface BadgePillProps {
  tone?: BadgeTone
  children: ReactNode
}

const tones: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  neutral: { backgroundColor: colors.surfaceCard, color: colors.ink },
  coral: { backgroundColor: colors.primary, color: colors.onPrimary },
  success: { backgroundColor: colors.success, color: colors.onPrimary },
  warning: { backgroundColor: colors.warning, color: colors.onPrimary },
  error: { backgroundColor: colors.error, color: colors.onPrimary }
}

export function BadgePill({ tone = 'neutral', children }: BadgePillProps) {
  const style: CSSProperties = {
    backgroundColor: tones[tone].backgroundColor,
    color: tones[tone].color,
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.caption.fontWeight,
    borderRadius: radii.pill,
    padding: '4px 12px',
    display: 'inline-block'
  }
  return (
    <span data-testid={`badge-${tone}`} style={style}>
      {children}
    </span>
  )
}
