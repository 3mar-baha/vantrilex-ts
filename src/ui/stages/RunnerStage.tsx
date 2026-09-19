import { colors, radii, spacing, typography } from '../../design/tokens'
import { BadgePill, type BadgeTone } from '../components/BadgePill'
import { Card } from '../components/Card'
import type { RunnerOption } from './types'

interface RunnerStageProps {
  runners: RunnerOption[]
  selected: string | null
  onSelect: (id: string) => void
  loading: boolean
}

function pillFor(r: RunnerOption): { tone: BadgeTone; label: string } {
  if (r.installed) {
    return { tone: 'success', label: `Installed${r.version ? ` · ${r.version}` : ''}` }
  }
  return { tone: 'warning', label: 'Not found' }
}

export function RunnerStage({ runners, selected, onSelect, loading }: RunnerStageProps) {
  return (
    <div data-testid="runner-stage">
      <h2
        style={{
          fontFamily: typography.displayMd.fontFamily,
          fontSize: typography.displayMd.fontSize,
          fontWeight: typography.displayMd.fontWeight,
          letterSpacing: typography.displayMd.letterSpacing,
          margin: `0 0 ${spacing.sm}px`
        }}
      >
        Choose your AI runner
      </h2>
      <p style={{ color: colors.body, margin: `0 0 ${spacing.lg}px` }}>
        {loading ? 'Checking installed CLIs…' : 'The runner owns its models. Pick the CLI, not the model.'}
      </p>
      <div style={{ display: 'grid', gap: spacing.md }}>
        {runners.map((r) => {
          const pill = pillFor(r)
          const active = selected === r.id
          return (
            <div
              key={r.id}
              data-testid={`runner-${r.id}`}
              data-active={active}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(r.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(r.id)
                }
              }}
              style={{
                border: active ? `2px solid ${colors.primary}` : `1px solid ${colors.hairline}`,
                borderRadius: radii.lg,
                overflow: 'hidden',
                cursor: 'pointer'
              }}
            >
              <Card variant={active ? 'dark' : 'light'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: 8 }}>
                  <span style={{ ...typography.titleMd }}>{r.name}</span>
                  <BadgePill tone={pill.tone}>{pill.label}</BadgePill>
                </div>
                <p
                  style={{
                    ...typography.bodyMd,
                    margin: 0,
                    color: active ? colors.onDarkSoft : colors.body
                  }}
                >
                  {r.hint}
                </p>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
