import { useState } from 'react'
import { colors, radii, spacing, typography } from '../../design/tokens'
import { Card } from '../components/Card'
import type { WizardMode } from './types'

interface ModeStageProps {
  onSelect: (mode: WizardMode) => void
}

const OPTIONS: Array<{ mode: WizardMode; title: string; hint: string; testId: string }> = [
  {
    mode: 'guided',
    title: 'Guided Experience',
    hint: 'Zero-knowledge setup. The Foundry detects your project, scaffolds docs, and provisions tools.',
    testId: 'mode-guided'
  },
  {
    mode: 'classic',
    title: 'Classic Direct Launcher',
    hint: 'Pick a runner and workspace directly. Full granular control, no interview.',
    testId: 'mode-classic'
  }
]

export function ModeStage({ onSelect }: ModeStageProps) {
  const [cursor, setCursor] = useState(0)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      setCursor((c) => (c + OPTIONS.length - 1) % OPTIONS.length)
    } else if (e.key === 'ArrowDown') {
      setCursor((c) => (c + 1) % OPTIONS.length)
    } else if (e.key === 'Enter') {
      onSelect(OPTIONS[cursor].mode)
    }
  }

  return (
    <div data-testid="mode-stage" onKeyDown={onKeyDown} tabIndex={0}>
      <h2
        style={{
          fontFamily: typography.displayMd.fontFamily,
          fontSize: typography.displayMd.fontSize,
          fontWeight: typography.displayMd.fontWeight,
          letterSpacing: typography.displayMd.letterSpacing,
          margin: `0 0 ${spacing.sm}px`
        }}
      >
        How do you want to start?
      </h2>
      <p style={{ color: colors.body, margin: `0 0 ${spacing.lg}px` }}>
        Up and Down move, Enter selects.
      </p>
      <div style={{ display: 'grid', gap: spacing.md }}>
        {OPTIONS.map((o, i) => (
          <div
            key={o.mode}
            data-testid={o.testId}
            data-active={i === cursor}
            role="button"
            tabIndex={-1}
            onClick={() => onSelect(o.mode)}
            onMouseEnter={() => setCursor(i)}
            style={{
              border:
                i === cursor ? `2px solid ${colors.primary}` : `1px solid ${colors.hairline}`,
              borderRadius: radii.lg,
              overflow: 'hidden',
              cursor: 'pointer'
            }}
          >
            <Card variant={i === cursor ? 'dark' : 'light'}>
              <div style={{ ...typography.titleMd, margin: '0 0 8px' }}>{o.title}</div>
              <p
                style={{
                  ...typography.bodyMd,
                  margin: 0,
                  color: i === cursor ? colors.onDarkSoft : colors.body
                }}
              >
                {o.hint}
              </p>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
