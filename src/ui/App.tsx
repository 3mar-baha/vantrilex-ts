import { useCallback, useState } from 'react'
import { colors, maxContentWidth, spacing, typography } from '../design/tokens'
import type { VantrilexApi } from '../../electron/channels'
import { Footer } from './components/Footer'
import { TopNav } from './components/TopNav'
import { HandoverStage } from './stages/HandoverStage'
import { ModeStage } from './stages/ModeStage'
import { ProvisioningStage } from './stages/ProvisioningStage'
import { RunnerStage } from './stages/RunnerStage'
import { WorkspaceStage } from './stages/WorkspaceStage'
import type { DetectionView, ProvisionProgress, ProvisionStep, RunnerOption } from './stages/types'

type Step = 'mode' | 'workspace' | 'runner' | 'provisioning' | 'handover'

function bridge(): VantrilexApi | null {
  if (typeof window !== 'undefined' && window.vantrilex) {
    return window.vantrilex
  }
  return null
}

const RUNNER_META: Array<{ id: RunnerOption['id']; name: string; hint: string }> = [
  { id: 'opencode', name: 'OpenCode', hint: 'Multi-provider routing with Zen models.' },
  { id: 'claude', name: 'Claude Code', hint: 'Anthropic streaming tools and sub-agents.' },
  { id: 'codex', name: 'OpenAI Codex', hint: 'GPT execution with resume support.' }
]

export function App() {
  const [step, setStep] = useState<Step>('mode')
  const [workspace, setWorkspace] = useState('')
  const [detection, setDetection] = useState<DetectionView | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [runners, setRunners] = useState<RunnerOption[]>([])
  const [probesLoading, setProbesLoading] = useState(false)
  const [selectedRunner, setSelectedRunner] = useState<string | null>(null)
  const [steps, setSteps] = useState<ProvisionStep[]>([])
  const [progress, setProgress] = useState<ProvisionProgress>({ done: 0, total: 0, file: '' })
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState('')

  const handleMode = useCallback(() => {
    setDetection(null)
    setStep('workspace')
  }, [])

  const handleDetect = useCallback(async () => {
    const api = bridge()
    if (!api || workspace.trim() === '') {
      return
    }
    setDetecting(true)
    setError('')
    try {
      const d = await api.detect(workspace.trim())
      setDetection({ projectCase: d.projectCase, language: d.language, stack: d.stack, action: d.action })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDetecting(false)
    }
  }, [workspace])

  const handleOverride = useCallback(() => {
    setDetection((d) => {
      if (!d) {
        return d
      }
      const next = d.projectCase % 3 + 1
      return { ...d, projectCase: next }
    })
  }, [])

  const loadProbes = useCallback(async () => {
    const api = bridge()
    setProbesLoading(true)
    try {
      const statuses = api ? await api.probes() : []
      const byKey = new Map(statuses.map((s) => [s.key, s]))
      setRunners(
        RUNNER_META.map((r) => {
          const hit = byKey.get(r.id)
          return { ...r, installed: hit?.found ?? false, version: hit?.version ?? '' }
        })
      )
    } finally {
      setProbesLoading(false)
    }
  }, [])

  const goRunner = useCallback(() => {
    setSelectedRunner(null)
    setStep('runner')
    void loadProbes()
  }, [loadProbes])

  const handleProvision = useCallback(async () => {
    const api = bridge()
    if (!api) {
      return
    }
    setStep('provisioning')
    setSteps([])
    setProgress({ done: 0, total: 1, file: 'starting…' })
    try {
      const res = await api.provision(workspace.trim(), detection?.projectCase ?? 0)
      const total = Math.max(res.created.length, 1)
      setSteps(res.created.map((label) => ({ label, done: true })))
      setProgress({ done: res.created.length, total, file: 'complete' })
      if (res.errors.length > 0) {
        setError(res.errors.join('; '))
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }, [workspace, detection])

  const handleLaunch = useCallback(async () => {
    const api = bridge()
    if (!api || !selectedRunner) {
      return
    }
    setLaunching(true)
    try {
      await api.launch(selectedRunner, workspace.trim())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLaunching(false)
    }
  }, [selectedRunner, workspace])

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
        {error !== '' && (
          <p data-testid="app-error" style={{ color: colors.error }}>
            {error}
          </p>
        )}
        {step === 'mode' && <ModeStage onSelect={handleMode} />}
        {step === 'workspace' && (
          <WorkspaceStage
            workspace={workspace}
            onWorkspaceChange={(v) => {
              setWorkspace(v)
              setDetection(null)
            }}
            detection={detection}
            detecting={detecting}
            onRunDetection={handleDetect}
            onConfirm={goRunner}
            onOverride={handleOverride}
          />
        )}
        {step === 'runner' && (
          <>
            <RunnerStage
              runners={runners}
              selected={selectedRunner}
              onSelect={(id) => setSelectedRunner(id)}
              loading={probesLoading}
            />
            <div style={{ marginTop: spacing.lg }}>
              <button
                data-testid="runner-continue"
                disabled={!selectedRunner}
                onClick={handleProvision}
                style={{
                  backgroundColor: !selectedRunner ? colors.primaryDisabled : colors.primary,
                  color: !selectedRunner ? colors.muted : colors.onPrimary,
                  borderRadius: 8,
                  padding: '12px 20px',
                  height: 40,
                  border: 'none',
                  cursor: !selectedRunner ? 'not-allowed' : 'pointer',
                  fontFamily: typography.button.fontFamily,
                  fontSize: typography.button.fontSize
                }}
              >
                Continue to provisioning
              </button>
            </div>
          </>
        )}
        {step === 'provisioning' && <ProvisioningStage steps={steps} progress={progress} />}
        {step === 'handover' && (
          <HandoverStage
            runner={selectedRunner ?? ''}
            workspace={workspace}
            resuming={false}
            launching={launching}
            onLaunch={handleLaunch}
            onBack={() => setStep('runner')}
          />
        )}
        {step === 'provisioning' && steps.length > 0 && (
          <div style={{ marginTop: spacing.lg }}>
            <button
              data-testid="provisioning-continue"
              onClick={() => setStep('handover')}
              style={{
                backgroundColor: colors.primary,
                color: colors.onPrimary,
                borderRadius: 8,
                padding: '12px 20px',
                height: 40,
                border: 'none',
                cursor: 'pointer',
                fontFamily: typography.button.fontFamily,
                fontSize: typography.button.fontSize
              }}
            >
              Continue to launch
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
