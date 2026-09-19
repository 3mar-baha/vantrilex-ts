import { colors, maxContentWidth, spacing, typography } from '../design/tokens'
import { BadgePill } from './components/BadgePill'
import { ButtonPrimary } from './components/ButtonPrimary'
import { Card } from './components/Card'
import { Footer } from './components/Footer'
import { TopNav } from './components/TopNav'

export function App() {
  return (
    <div
      data-testid="app"
      style={{
        backgroundColor: colors.canvas,
        color: colors.ink,
        minHeight: '100vh',
        fontFamily: typography.bodyMd.fontFamily
      }}
    >
      <TopNav />
      <main style={{ maxWidth: maxContentWidth, margin: '0 auto', padding: spacing.section }}>
        <h1
          style={{
            fontFamily: typography.displayLg.fontFamily,
            fontSize: typography.displayLg.fontSize,
            fontWeight: typography.displayLg.fontWeight,
            lineHeight: typography.displayLg.lineHeight,
            letterSpacing: typography.displayLg.letterSpacing,
            margin: `0 0 ${spacing.lg}px`
          }}
        >
          Vantrilex Workbench
        </h1>
        <p style={{ color: colors.body, maxWidth: 640 }}>
          Guided Smart Project setup for non-technical owners, and a full
          custom mode for developers. Provision workspaces, then hand off to
          your agent.
        </p>
        <div style={{ display: 'flex', gap: spacing.md, marginTop: spacing.lg, marginBottom: spacing.xl }}>
          <ButtonPrimary>Guided Smart Project</ButtonPrimary>
          <BadgePill tone="coral">Foundry</BadgePill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: spacing.lg }}>
          <Card variant="light" testId="card-modes">
            <h2 style={{ ...typography.titleMd, margin: '0 0 8px' }}>Two modes</h2>
            <p style={{ ...typography.bodyMd, color: colors.body, margin: 0 }}>
              Guided for zero-knowledge setup. Classic for granular control.
            </p>
          </Card>
          <Card variant="dark" testId="card-agents">
            <h2 style={{ ...typography.titleMd, margin: '0 0 8px' }}>Agent handover</h2>
            <p style={{ ...typography.bodyMd, color: colors.onDarkSoft, margin: 0 }}>
              OpenCode, Claude Code, or Codex takes over in your workspace.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
