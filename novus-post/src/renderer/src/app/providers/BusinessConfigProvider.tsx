import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BusinessConfig, BusinessConfigInput } from '@shared/contracts'
import { DEFAULT_BUSINESS_CONFIG } from '../../shared/lib/businessConfig'
import {
  BusinessConfigContext,
  type BusinessConfigContextValue
} from '../../shared/hooks/useBusinessConfig'
import { settingsApi, settingsErrorMessage } from '../../features/settings/api/settings.api'

/**
 * Carga la configuración del negocio desde SQLite una sola vez y la comparte
 * con POS, inventario, caja y ajustes. Cualquier guardado refresca el contexto.
 */
export function BusinessConfigProvider({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_BUSINESS_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    settingsApi
      .getBusiness()
      .then((data) => {
        if (!cancelled && mounted.current) {
          setConfig(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && mounted.current) {
          setError(settingsErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled && mounted.current) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const reload = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await settingsApi.getBusiness()
      if (mounted.current) setConfig(data)
    } catch (err: unknown) {
      if (mounted.current) setError(settingsErrorMessage(err))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [])

  const saveConfig = useCallback(async (input: BusinessConfigInput): Promise<BusinessConfig> => {
    try {
      const updated = await settingsApi.updateBusiness(input)
      if (mounted.current) {
        setConfig(updated)
        setError(null)
      }
      return updated
    } catch (err: unknown) {
      throw new Error(settingsErrorMessage(err))
    }
  }, [])

  const value = useMemo<BusinessConfigContextValue>(
    () => ({ config, isLoading, error, saveConfig, reload }),
    [config, isLoading, error, saveConfig, reload]
  )

  return <BusinessConfigContext.Provider value={value}>{children}</BusinessConfigContext.Provider>
}

export default BusinessConfigProvider
