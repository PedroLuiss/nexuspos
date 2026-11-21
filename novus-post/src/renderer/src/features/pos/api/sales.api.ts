import type {
  CreateSaleInput,
  SaleResult,
  SuspendedSale
} from '@shared/contracts'

function bridge(): Window['api'] {
  if (typeof window === 'undefined' || !window.api) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api
}

export const salesApi = {
  complete: (input: CreateSaleInput): Promise<SaleResult> =>
    bridge().sales.complete(input),
  listSuspended: (): Promise<SuspendedSale[]> => bridge().sales.listSuspended(),
  suspend: (sale: SuspendedSale): Promise<void> => bridge().sales.suspend(sale),
  deleteSuspended: (id: string): Promise<void> => bridge().sales.deleteSuspended(id)
}

export function salesErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}
