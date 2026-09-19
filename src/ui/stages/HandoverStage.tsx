import { colors, spacing, typography } from '../../design/tokens'
import { ButtonPrimary } from '../components/ButtonPrimary'
import { Card } from '../components/Card'

interface HandoverStageProps {
  runner: string
  workspace: string
  resuming: boolean
  launching: boolean
  onLaunch: () => void
  onBack: () => void
}

export function HandoverStage({ runner, workspace, resuming, launching, onLaunch, onBack }: HandoverStageProps) {
  return (
    <div data-testid="handover-stage">
      <h2
        style={{
          fontFamily: typography.displayMd.fontFamily,
          fontSize: typography.displayMd.fontSize,
          fontWeight: typography.displayMd.fontWeight,
          letterSpacing: typography.displayMd.letterSpacing,
          margin: `0 0 ${spacing.sm}px`
        }}
      >
        Launch your session
      </h2>
      <p style={{ color: colors.body, margin: `0 0 ${spacing.lg}px` }}>
        Everything is ready. Your assistant takes over this terminal.
      </p>
      <Card variant="dark">
        <dl style={{ margin: 0, display: 'grid', gap: spacing.sm }}>
          <div>
            <dt style={{ ...typography.caption, color: colors.onDarkSoft }}>Assistant</dt>
            <dd data-testid="handover-runner" style={{ ...typography.titleMd, color: colors.onDark, margin: 0 }}>{runner}</dd>
          </div>
          <div>
            <dt style={{ ...typography.caption, color: colors.onDarkSoft }}>Folder</dt>
            <dd data-testid="handover-workspace" style={{ ...typography.titleMd, color: colors.onDark, margin: 0 }}>{workspace}</dd>
          </div>
          <div>
            <dt style={{ ...typography.caption, color: colors.onDarkSoft }}>Session</dt>
            <dd data-testid="handover-resume" style={{ ...typography.titleMd, color: colors.onDark, margin: 0 }}>
              {resuming ? 'Resuming previous session' : 'Fresh session'}
            </dd>
          </div>
        </dl>
        <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.lg }}>
          <ButtonPrimary data-testid="handover-launch" onClick={onLaunch} disabled={launching}>
            {launching ? 'Launching…' : 'Press ENTER to launch'}
          </ButtonPrimary>
          <button
            data-testid="handover-back"
            onClick={onBack}
            style={{
              backgroundColor: colors.surfaceDarkElevated,
              color: colors.onDark,
              borderRadius: 8,
              padding: '12px 20px',
              height: 40,
              border: 'none',
              cursor: 'pointer',
              fontFamily: typography.button.fontFamily,
              fontSize: typography.button.fontSize
            }}
          >
            Back
          </button>
        </div>
      </Card>
    </div>
  )
}
