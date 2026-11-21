import { createContext, useContext } from 'react'
import type { BusinessConfig, BusinessConfigInput } from '@shared/contracts'
import { DEFAULT_BUSINESS_CONFIG } from '../lib/businessConfig'

export interface BusinessConfigContextValue {
  /** Configuración vigente del establecimiento (SQLite o valores de demostración). */
  config: BusinessConfig
  isLoading: boolean
  error: string | null
  /** Persiste los cambios (solo ADMIN) y refresca el contexto global. */
  saveConfig: (input: BusinessConfigInput) => Promise<BusinessConfig>
  /** Vuelve a leer la configuración desde SQLite. */
  reload: () => Promise<void>
}

export const BusinessConfigContext = createContext<BusinessConfigContextValue>({
  config: DEFAULT_BUSINESS_CONFIG,
  isLoading: false,
  error: null,
  saveConfig: async () => DEFAULT_BUSINESS_CONFIG,
  reload: async () => undefined
})

/**
 * Hook transversal de configuración del negocio.
 * Lo consumen POS, inventario, caja y ajustes sin acoplarse entre features.
 */
export function useBusinessConfig(): BusinessConfigContextValue {
  return useContext(BusinessConfigContext)
}
