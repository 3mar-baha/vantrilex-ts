export type WizardMode = 'guided' | 'classic'

export interface DetectionView {
  projectCase: number
  language: string
  stack: string
  action: string
}

export interface RunnerOption {
  id: 'opencode' | 'claude' | 'codex'
  name: string
  hint: string
  installed: boolean
  version: string
}

export interface ProvisionStep {
  label: string
  done: boolean
}

export interface ProvisionProgress {
  done: number
  total: number
  file: string
}

export function caseBadgeLabel(projectCase: number): string {
  switch (projectCase) {
    case 1:
      return 'Case 1 Fresh'
    case 2:
      return 'Case 2 Established'
    case 3:
      return 'Case 3 Brownfield'
    default:
      return 'Unknown case'
  }
}
