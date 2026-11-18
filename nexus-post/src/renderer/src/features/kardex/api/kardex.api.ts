import type { KardexMovementPage, KardexMovementQuery } from '@shared/contracts'

export const kardexApi = {
  listMovements(query: KardexMovementQuery): Promise<KardexMovementPage> {
    if (typeof window === 'undefined' || !window.api) {
      throw new Error('El puente IPC no está disponible (preload no cargado)')
    }

    return window.api.inventory.listMovements(query)
  }
}

export function kardexErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}
