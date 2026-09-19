import { colors, radii, spacing, typography } from '../../design/tokens'
import { BadgePill } from '../components/BadgePill'
import { ButtonPrimary } from '../components/ButtonPrimary'
import { Card } from '../components/Card'
import { caseBadgeLabel, type DetectionView } from './types'

interface WorkspaceStageProps {
  workspace: string
  onWorkspaceChange: (value: string) => void
  detection: DetectionView | null
  detecting: boolean
  onRunDetection: () => void
  onConfirm: () => void
  onOverride: () => void
}

export function WorkspaceStage({
  workspace,
  onWorkspaceChange,
  detection,
  detecting,
  onRunDetection,
  onConfirm,
  onOverride
}: WorkspaceStageProps) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!detection) {
      if (e.key === 'Enter') {
        e.preventDefault()
        onConfirm()
      }
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      onConfirm()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      onOverride()
    }
  }

  return (
    <div data-testid="workspace-stage" onKeyDown={onKeyDown}>
      <h2
        style={{
          fontFamily: typography.displayMd.fontFamily,
          fontSize: typography.displayMd.fontSize,
          fontWeight: typography.displayMd.fontWeight,
          letterSpacing: typography.displayMd.letterSpacing,
          margin: `0 0 ${spacing.sm}px`
        }}
      >
        Choose project folder
      </h2>
      <p style={{ color: colors.body, margin: `0 0 ${spacing.lg}px` }}>
        Type the folder you want to work in. Detection reads it without changing anything.
      </p>
      <label
        style={{
          display: 'block',
          fontFamily: typography.caption.fontFamily,
          fontSize: typography.caption.fontSize,
          color: colors.muted,
          marginBottom: spacing.xs
        }}
      >
        Workspace path
      </label>
      <div style={{ display: 'flex', gap: spacing.sm }}>
        <input
          data-testid="workspace-input"
          value={workspace}
          onChange={(e) => onWorkspaceChange(e.target.value)}
          placeholder="C:\projects\my-app"
          spellCheck={false}
          style={{
            flex: 1,
            backgroundColor: colors.canvas,
            color: colors.ink,
            fontFamily: typography.bodyMd.fontFamily,
            fontSize: typography.bodyMd.fontSize,
            borderRadius: radii.md,
            border: `1px solid ${colors.hairline}`,
            padding: '10px 14px',
            height: 40
          }}
        />
        <ButtonPrimary data-testid="workspace-detect" onClick={onRunDetection} disabled={detecting || workspace.trim() === ''}>
          {detecting ? 'Reading…' : 'Detect'}
        </ButtonPrimary>
      </div>

      {!detection && (
        <div style={{ marginTop: spacing.md }}>
          <ButtonPrimary data-testid="workspace-continue" onClick={onConfirm} disabled={workspace.trim() === ''}>
            Continue
          </ButtonPrimary>
        </div>
      )}

      {detection && (
        <div data-testid="case-card" style={{ marginTop: spacing.lg }}>          <Card variant="dark">
            <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center', marginBottom: spacing.sm }}>
              <BadgePill tone="coral">{caseBadgeLabel(detection.projectCase)}</BadgePill>
            </div>
            <div style={{ ...typography.titleMd, margin: '0 0 8px' }}>
              Language · {detection.language}
            </div>
            <p style={{ ...typography.bodyMd, color: colors.onDarkSoft, margin: `0 0 ${spacing.sm}px` }}>
              Stack · {detection.stack}
            </p>
            <p style={{ ...typography.bodyMd, color: colors.onDark, margin: `0 0 ${spacing.md}px` }}>
              {detection.action}
            </p>
            <div style={{ display: 'flex', gap: spacing.sm }}>
              <ButtonPrimary data-testid="case-confirm" onClick={onConfirm}>
                Confirm
              </ButtonPrimary>
              <button
                data-testid="case-override"
                onClick={onOverride}
                style={{
                  backgroundColor: colors.surfaceDarkElevated,
                  color: colors.onDark,
                  borderRadius: radii.md,
                  padding: '12px 20px',
                  height: 40,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: typography.button.fontFamily,
                  fontSize: typography.button.fontSize
                }}
              >
                Override (Tab)
              </button>
            </div>
            <p style={{ ...typography.caption, color: colors.onDarkSoft, margin: `${spacing.sm}px 0 0` }}>
              Enter confirms · Tab cycles the case manually
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
