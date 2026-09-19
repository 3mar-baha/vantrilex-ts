import type { CSSProperties, ReactNode } from 'react'
import { colors, radii, spacing } from '../../design/tokens'

export type CardVariant = 'light' | 'dark'

interface CardProps {
  variant?: CardVariant
  children: ReactNode
  testId?: string
}

const base: CSSProperties = {
  borderRadius: radii.lg,
  padding: spacing.xl
}

const variants: Record<CardVariant, CSSProperties> = {
  light: { ...base, backgroundColor: colors.surfaceCard, color: colors.ink },
  dark: { ...base, backgroundColor: colors.surfaceDark, color: colors.onDark }
}

export function Card({ variant = 'light', children, testId }: CardProps) {
  return (
    <section data-testid={testId ?? `card-${variant}`} style={variants[variant]}>
      {children}
    </section>
  )
}
