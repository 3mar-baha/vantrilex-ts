import { colors, radii, spacing, typography } from '../../design/tokens'
import { ButtonPrimary } from '../components/ButtonPrimary'
import { Card } from '../components/Card'
import type { SessionView } from '../../../electron/channels'

interface HandoverStageProps {
  runner: string
  workspace: string
  resumeId: string | null
  onSelectResume: (id: string | null) => void
  sessions: SessionView[]
  onDeleteSession: (id: string) => void
  launching: boolean
  onLaunch: () => void
  onBack: () => void
}

export function HandoverStage({
  runner,
  workspace,
  resumeId,
  onSelectResume,
  sessions,
  onDeleteSession,
  launching,
  onLaunch,
  onBack
}: HandoverStageProps) {
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
              {resumeId ? `Resuming ${resumeId.slice(0, 19)}` : 'Fresh session'}
            </dd>
          </div>
        </dl>
        {sessions.length > 0 && (
          <div style={{ marginTop: spacing.md }}>
            <div style={{ ...typography.caption, color: colors.onDarkSoft, marginBottom: spacing.xs }}>
              Recent sessions in this folder
            </div>
            <ul data-testid="handover-sessions" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: spacing.xs }}>
              {sessions.slice(0, 5).map((s) => (
                <li
                  key={s.id}
                  data-testid={`handover-session-${resumeId === s.id ? 'active' : 'idle'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}
                >
                  <button
                    data-testid={`handover-resume-${s.id}`}
                    onClick={() => onSelectResume(resumeId === s.id ? null : s.id)}
                    style={{
                      backgroundColor: resumeId === s.id ? colors.primary : colors.surfaceDarkElevated,
                      color: colors.onDark,
                      borderRadius: radii.pill,
                      padding: '4px 12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: typography.caption.fontFamily,
                      fontSize: typography.caption.fontSize
                    }}
                  >
                    {resumeId === s.id ? 'Selected' : 'Resume'}
                  </button>
                  <span style={{ ...typography.bodySm, color: colors.onDarkSoft }}>
                    {s.runner} · {s.timestamp.slice(0, 10)}
                  </span>
                  <button
                    data-testid={`handover-delete-${s.id}`}
                    onClick={() => onDeleteSession(s.id)}
                    aria-label={`Delete session ${s.id}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: colors.onDarkSoft,
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
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
