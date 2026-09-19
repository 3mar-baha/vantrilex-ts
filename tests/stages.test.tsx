import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { HandoverStage } from '../src/ui/stages/HandoverStage'
import { ModeStage } from '../src/ui/stages/ModeStage'
import { ProvisioningStage } from '../src/ui/stages/ProvisioningStage'
import { RunnerStage } from '../src/ui/stages/RunnerStage'
import { WorkspaceStage } from '../src/ui/stages/WorkspaceStage'
import type { RunnerOption } from '../src/ui/stages/types'

describe('ModeStage fork selection and transitions', () => {
  it('selects guided on click and on Enter', () => {
    const onSelect = vi.fn()
    const { rerender } = render(<ModeStage onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('mode-classic'))
    expect(onSelect).toHaveBeenCalledWith('classic')
    rerender(<ModeStage onSelect={onSelect} />)
    fireEvent.keyDown(screen.getByTestId('mode-stage'), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('guided')
  })

  it('moves cursor with arrows', () => {
    render(<ModeStage onSelect={() => undefined} />)
    const stage = screen.getByTestId('mode-stage')
    expect(screen.getByTestId('mode-guided')).toHaveAttribute('data-active', 'true')
    fireEvent.keyDown(stage, { key: 'ArrowDown' })
    expect(screen.getByTestId('mode-classic')).toHaveAttribute('data-active', 'true')
    fireEvent.keyDown(stage, { key: 'ArrowUp' })
    expect(screen.getByTestId('mode-guided')).toHaveAttribute('data-active', 'true')
  })
})

describe('WorkspaceStage 3-case card and keyboard', () => {
  const base = {
    workspace: 'C:/proj',
    onWorkspaceChange: vi.fn(),
    detecting: false,
    onRunDetection: vi.fn(),
    onConfirm: vi.fn(),
    onOverride: vi.fn()
  }

  it('renders input and detect, then the case card', () => {
    const { rerender } = render(<WorkspaceStage {...base} detection={null} />)
    fireEvent.change(screen.getByTestId('workspace-input'), { target: { value: 'C:/x' } })
    expect(base.onWorkspaceChange).toHaveBeenCalledWith('C:/x')
    expect(screen.queryByTestId('case-card')).toBeNull()
    rerender(
      <WorkspaceStage
        {...base}
        detection={{ projectCase: 2, language: 'Go', stack: 'Go modules', action: 'Onboard it.' }}
      />
    )
    const card = screen.getByTestId('case-card')
    expect(card.textContent).toContain('Case 2 Established')
    expect(card.textContent).toContain('Go')
    expect(card.textContent).toContain('Go modules')
    expect(card.textContent).toContain('Onboard it.')
  })

  it('Enter confirms and Tab overrides', () => {
    const onConfirm = vi.fn()
    const onOverride = vi.fn()
    render(
      <WorkspaceStage
        {...base}
        onConfirm={onConfirm}
        onOverride={onOverride}
        detection={{ projectCase: 1, language: 'None yet', stack: 'Greenfield', action: 'Found it.' }}
      />
    )
    const stage = screen.getByTestId('workspace-stage')
    fireEvent.keyDown(stage, { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(stage, { key: 'Tab' })
    expect(onOverride).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('case-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByTestId('case-override'))
    expect(onOverride).toHaveBeenCalledTimes(2)
  })

  it('ignores Tab without a detection but Enter continues', () => {
    const onConfirm = vi.fn()
    const onOverride = vi.fn()
    render(<WorkspaceStage {...base} onConfirm={onConfirm} onOverride={onOverride} detection={null} />)
    fireEvent.keyDown(screen.getByTestId('workspace-stage'), { key: 'Tab' })
    expect(onOverride).not.toHaveBeenCalled()
    fireEvent.keyDown(screen.getByTestId('workspace-stage'), { key: 'Enter' })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('workspace-continue'))
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })
})

describe('RunnerStage picker and probe pills', () => {
  const runners: RunnerOption[] = [
    { id: 'opencode', name: 'OpenCode', hint: 'h1', installed: true, version: '1.0.0' },
    { id: 'claude', name: 'Claude Code', hint: 'h2', installed: false, version: '' },
    { id: 'codex', name: 'OpenAI Codex', hint: 'h3', installed: true, version: '' }
  ]

  it('selects on click and Enter, shows status pills', () => {
    const onSelect = vi.fn()
    render(<RunnerStage runners={runners} selected={null} onSelect={onSelect} loading={false} />)
    expect(screen.getByTestId('runner-opencode').textContent).toContain('Installed · 1.0.0')
    expect(screen.getByTestId('runner-claude').textContent).toContain('Not found')
    fireEvent.click(screen.getByTestId('runner-codex'))
    expect(onSelect).toHaveBeenCalledWith('codex')
    fireEvent.keyDown(screen.getByTestId('runner-claude'), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('claude')
  })

  it('marks the active runner', () => {
    render(<RunnerStage runners={runners} selected="claude" onSelect={() => undefined} loading={false} />)
    expect(screen.getByTestId('runner-claude')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('runner-opencode')).toHaveAttribute('data-active', 'false')
  })
})

describe('ProvisioningStage progress updates', () => {
  it('renders bar, label, and checklist states', () => {
    render(
      <ProvisioningStage
        steps={[
          { label: 'docs/01.md', done: true },
          { label: 'docs/02.md', done: false }
        ]}
        progress={{ done: 3, total: 6, file: 'docs/02.md' }}
      />
    )
    expect(screen.getByTestId('progress-track')).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByTestId('progress-fill')).toHaveStyle({ width: '50%' })
    expect(screen.getByTestId('progress-label').textContent).toContain('3 of 6')
    expect(screen.getAllByTestId('provision-step-done').length).toBe(1)
    expect(screen.getAllByTestId('provision-step-pending').length).toBe(1)
  })
})

describe('HandoverStage confirmation', () => {
  const sessions = [
    { id: 's-1', workspace: 'C:/proj', runner: 'opencode', timestamp: '2026-09-19T00:00:01Z', status: 'exited' },
    { id: 's-2', workspace: 'C:/proj', runner: 'opencode', timestamp: '2026-09-19T00:00:02Z', status: 'exited' }
  ]

  function handover(overrides = {}) {
    const props = {
      runner: 'opencode',
      workspace: 'C:/proj',
      resumeId: null as string | null,
      onSelectResume: vi.fn(),
      sessions,
      onDeleteSession: vi.fn(),
      launching: false,
      onLaunch: vi.fn(),
      onBack: vi.fn(),
      ...overrides
    }
    render(<HandoverStage {...props} />)
    return props
  }

  it('shows summary and fires launch/back', () => {
    const props = handover()
    expect(screen.getByTestId('handover-runner').textContent).toBe('opencode')
    expect(screen.getByTestId('handover-workspace').textContent).toBe('C:/proj')
    expect(screen.getByTestId('handover-resume').textContent).toBe('Fresh session')
    fireEvent.click(screen.getByTestId('handover-launch'))
    expect(props.onLaunch).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('handover-back'))
    expect(props.onBack).toHaveBeenCalledTimes(1)
  })

  it('selects and deletes recent sessions', () => {
    const props = handover()
    expect(screen.getByTestId('handover-sessions')).toBeTruthy()
    fireEvent.click(screen.getByTestId('handover-resume-s-1'))
    expect(props.onSelectResume).toHaveBeenCalledWith('s-1')
    fireEvent.click(screen.getByTestId('handover-delete-s-2'))
    expect(props.onDeleteSession).toHaveBeenCalledWith('s-2')
  })

  it('shows the active resume selection', () => {
    handover({ resumeId: 's-2' })
    expect(screen.getByTestId('handover-resume').textContent).toContain('s-2')
    expect(screen.getByTestId('handover-session-active')).toBeTruthy()
  })
})
