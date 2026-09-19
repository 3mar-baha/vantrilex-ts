export interface UpdateStatus {
  available: boolean
  version: string | null
}

export async function checkForUpdates(): Promise<UpdateStatus> {
  return { available: false, version: null }
}
