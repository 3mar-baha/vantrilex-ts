import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { useState } from 'react'
import { colors, radii, typography } from '../../design/tokens'

interface ButtonPrimaryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function ButtonPrimary({ children, disabled, style, ...rest }: ButtonPrimaryProps) {
  const [hover, setHover] = useState(false)
  const composed: CSSProperties = {
    backgroundColor: disabled ? colors.primaryDisabled : hover ? colors.primaryActive : colors.primary,
    color: disabled ? colors.muted : colors.onPrimary,
    fontFamily: typography.button.fontFamily,
    fontSize: typography.button.fontSize,
    fontWeight: typography.button.fontWeight,
    lineHeight: typography.button.lineHeight,
    borderRadius: radii.md,
    padding: '12px 20px',
    height: 40,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 120ms ease',
    ...style
  }
  return (
    <button
      data-testid="button-primary"
      disabled={disabled}
      style={composed}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...rest}
    >
      {children}
    </button>
  )
}
