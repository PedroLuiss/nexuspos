import type { BusinessConfig, BusinessConfigInput } from '@shared/contracts'

/**
 * Puerto de persistencia de la configuración del negocio (SQLite local).
 * La implementación concreta vive en `main/adapters/persistence/sqlite/`.
 */
export interface SettingsRepository {
  /** Devuelve la configuración única del establecimiento (la crea si no existe). */
  getBusiness(): BusinessConfig
  /** Persiste los cambios y devuelve la configuración resultante. */
  updateBusiness(input: BusinessConfigInput, updatedBy?: string): BusinessConfig
}
