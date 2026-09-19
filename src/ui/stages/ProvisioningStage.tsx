import { colors, radii, spacing, typography } from '../../design/tokens'
import type { ProvisionProgress, ProvisionStep } from './types'

interface ProvisioningStageProps {
  steps: ProvisionStep[]
  progress: ProvisionProgress
}

export function ProvisioningStage({ steps, progress }: ProvisioningStageProps) {
  const pct = progress.total > 0 ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0
  return (
    <div data-testid="provisioning-stage">
      <h2
        style={{
          fontFamily: typography.displayMd.fontFamily,
          fontSize: typography.displayMd.fontSize,
          fontWeight: typography.displayMd.fontWeight,
          letterSpacing: typography.displayMd.letterSpacing,
          margin: `0 0 ${spacing.sm}px`
        }}
      >
        Provisioning workspace
      </h2>
      <p style={{ color: colors.body, margin: `0 0 ${spacing.lg}px` }}>
        Writing docs, skills, and MCP configs. Existing files are never overwritten.
      </p>
      <div
        data-testid="progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          backgroundColor: colors.surfaceCard,
          borderRadius: radii.pill,
          height: 12,
          overflow: 'hidden',
          marginBottom: spacing.sm
        }}
      >
        <div
          data-testid="progress-fill"
          style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.primary }}
        />
      </div>
      <p data-testid="progress-label" style={{ ...typography.caption, color: colors.muted, margin: `0 0 ${spacing.md}px` }}>
        {progress.done} of {progress.total} · {progress.file}
      </p>
      <ul data-testid="provision-checklist" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: spacing.xs }}>
        {steps.map((s) => (
          <li
            key={s.label}
            data-testid={`provision-step-${s.done ? 'done' : 'pending'}`}
            style={{ ...typography.bodyMd, color: s.done ? colors.success : colors.muted }}
          >
            {s.done ? '●' : '○'} {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
