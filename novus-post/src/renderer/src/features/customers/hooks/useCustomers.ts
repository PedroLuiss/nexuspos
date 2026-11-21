import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter,
  CustomerPayment,
  CustomerPaymentInput
} from '@shared/contracts'
import { customersApi, customersErrorMessage } from '../api/customers.api'

interface CustomersHookValue {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  reload: (filter?: CustomerFilter) => Promise<boolean>
  createCustomer: (input: CustomerInput) => Promise<Customer>
  updateCustomer: (input: CustomerUpdateInput) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>
  toggleStatus: (id: string) => Promise<Customer>
  recordPayment: (input: CustomerPaymentInput) => Promise<CustomerPayment>
}

/**
 * Hook transversal de clientes, crédito y cobranza.
 * Lo consumen el módulo de Clientes y el POS para asociar clientes a ventas.
 */
export function useCustomers(enabled = true, includeInactive = false): CustomersHookValue {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const requestVersion = useRef(0)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const requestId = ++requestVersion.current

    const load = async (): Promise<void> => {
      try {
        const data = await customersApi.list(
          includeInactive ? { includeInactive: true } : undefined
        )
        if (!cancelled && mounted.current && requestId === requestVersion.current) {
          setCustomers(data)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled && mounted.current && requestId === requestVersion.current) {
          setError(customersErrorMessage(err))
        }
      } finally {
        if (!cancelled && mounted.current && requestId === requestVersion.current) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [enabled, includeInactive])

  const reload = useCallback(async (filter?: CustomerFilter): Promise<boolean> => {
    const requestId = ++requestVersion.current
    setError(null)
    try {
      const data = await customersApi.list(filter)
      if (mounted.current && requestId === requestVersion.current) setCustomers(data)
      return true
    } catch (err: unknown) {
      if (mounted.current && requestId === requestVersion.current) {
        setError(customersErrorMessage(err))
      }
      return false
    }
  }, [])

  const createCustomer = useCallback(async (input: CustomerInput): Promise<Customer> => {
    setError(null)
    try {
      const created = await customersApi.create(input)
      if (mounted.current) setCustomers((prev) => [...prev, created])
      return created
    } catch (err: unknown) {
      const message = customersErrorMessage(err)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const updateCustomer = useCallback(async (input: CustomerUpdateInput): Promise<Customer> => {
    setError(null)
    try {
      const updated = await customersApi.update(input)
      if (mounted.current) {
        setCustomers((prev) => prev.map((c) => (c.id === input.id ? updated : c)))
      }
      return updated
    } catch (err: unknown) {
      const message = customersErrorMessage(err)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    setError(null)
    try {
      await customersApi.delete(id)
      if (mounted.current) {
        setCustomers((prev) => prev.filter((c) => c.id !== id))
      }
    } catch (err: unknown) {
      const message = customersErrorMessage(err)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const toggleStatus = useCallback(async (id: string): Promise<Customer> => {
    setError(null)
    try {
      const updated = await customersApi.toggleStatus(id)
      if (mounted.current) {
        setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)))
      }
      return updated
    } catch (err: unknown) {
      const message = customersErrorMessage(err)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const recordPayment = useCallback(
    async (input: CustomerPaymentInput): Promise<CustomerPayment> => {
      setError(null)
      try {
        const payment = await customersApi.recordPayment(input)
        if (mounted.current) {
          // Actualizar la deuda del cliente en la lista
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === input.customerId
                ? { ...c, currentDebt: Math.max(0, c.currentDebt - input.amount) }
                : c
            )
          )
        }
        return payment
      } catch (err: unknown) {
        const message = customersErrorMessage(err)
        setError(message)
        throw new Error(message)
      }
    },
    []
  )

  const value = useMemo(
    () => ({
      customers,
      isLoading,
      error,
      reload,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      toggleStatus,
      recordPayment
    }),
    [
      customers,
      isLoading,
      error,
      reload,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      toggleStatus,
      recordPayment
    ]
  )

  return value
}
