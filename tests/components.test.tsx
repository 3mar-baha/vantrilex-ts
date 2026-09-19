import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { App } from '../src/ui/App'
import { BadgePill } from '../src/ui/components/BadgePill'
import { ButtonPrimary } from '../src/ui/components/ButtonPrimary'
import { Card } from '../src/ui/components/Card'
import { colors } from '../src/design/tokens'

describe('design tokens (docs/21-DESIGN-SYSTEM.md)', () => {
  it('pins the warm-canvas palette (no cyan)', () => {
    expect(colors.canvas).toBe('#faf9f5')
    expect(colors.primary).toBe('#cc785c')
    expect(colors.primaryActive).toBe('#a9583e')
    expect(colors.ink).toBe('#141413')
    expect(colors.surfaceDark).toBe('#181715')
    expect(JSON.stringify(colors)).not.toContain('#00FFFF')
  })
})

describe('primitives', () => {
  it('renders light and dark cards with 12px radii and 32px padding', () => {
    const { rerender } = render(<Card variant="light">A</Card>)
    const light = screen.getByTestId('card-light')
    expect(light).toHaveStyle({ backgroundColor: '#efe9de', borderRadius: '12px', padding: '32px' })
    rerender(
      <Card variant="dark">
        B
      </Card>
    )
    expect(screen.getByTestId('card-dark')).toHaveStyle({ backgroundColor: '#181715' })
  })

  it('renders the coral CTA with hover and disabled states', () => {
    const { rerender } = render(<ButtonPrimary>Go</ButtonPrimary>)
    expect(screen.getByTestId('button-primary')).toHaveStyle({ backgroundColor: '#cc785c' })
    rerender(<ButtonPrimary disabled>Go</ButtonPrimary>)
    expect(screen.getByTestId('button-primary')).toHaveStyle({ backgroundColor: '#e6dfd8' })
  })

  it('renders tone pills', () => {
    render(<BadgePill tone="coral">Foundry</BadgePill>)
    expect(screen.getByTestId('badge-coral')).toHaveStyle({ backgroundColor: '#cc785c', borderRadius: '9999px' })
  })
})

describe('App shell', () => {
  it('starts on the mode fork with nav and footer', () => {
    render(<App />)
    expect(screen.getByTestId('app')).toBeTruthy()
    expect(screen.getByTestId('top-nav')).toBeTruthy()
    expect(screen.getByTestId('mode-stage')).toBeTruthy()
    expect(screen.getByTestId('mode-guided')).toBeTruthy()
    expect(screen.getByTestId('mode-classic')).toBeTruthy()
    expect(screen.getByTestId('footer')).toBeTruthy()
  })
})
