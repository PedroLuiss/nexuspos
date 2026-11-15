import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter,
  CustomerDebt,
  CustomerPayment,
  CustomerAccountSummary,
  CustomerPaymentInput,
  CreateCreditSaleInput,
  ApplyPaymentToDebtInput
} from '@shared/contracts'
import { customersApi, customersErrorMessage } from '../api/customers.api'

interface CustomersHookValue {
  customers: Customer[]
  isLoading: boolean
  error: string | null
  reload: (filter?: CustomerFilter) => Promise<boolean>
  clearError: () => void
  createCustomer: (input: CustomerInput) => Promise<Customer>
  updateCustomer: (input: CustomerUpdateInput) => Promise<Customer>
  deleteCustomer: (id: string) => Promise<void>
  toggleStatus: (id: string) => Promise<Customer>
  getAccountSummary: (customerId: string) => Promise<CustomerAccountSummary | null>
  listDebts: (customerId: string) => Promise<CustomerDebt[]>
  listPayments: (customerId: string) => Promise<CustomerPayment[]>
  recordPayment: (input: CustomerPaymentInput) => Promise<CustomerPayment>
  createCreditSale: (input: CreateCreditSaleInput) => Promise<CustomerDebt>
  applyPaymentToDebt: (input: ApplyPaymentToDebtInput) => Promise<CustomerDebt>
}

/**
 * Hook transversal de clientes, crédito y cobranza.
 * Lo consumen el módulo de Clientes y el POS para asociar clientes a ventas.
 */
export function useCustomers(enabled = true): CustomersHookValue {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const load = async (): Promise<void> => {
      try {
        const data = await customersApi.list()
        if (!cancelled && mounted.current) {
          setCustomers(data)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled && mounted.current) {
          setError(customersErrorMessage(err))
        }
      } finally {
        if (!cancelled && mounted.current) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [enabled])

  const reload = useCallback(async (filter?: CustomerFilter): Promise<boolean> => {
    setError(null)
    try {
      const data = await customersApi.list(filter)
      if (mounted.current) setCustomers(data)
      return true
    } catch (err: unknown) {
      if (mounted.current) setError(customersErrorMessage(err))
      return false
    }
  }, [])

  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  const createCustomer = useCallback(
    async (input: CustomerInput): Promise<Customer> => {
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
    },
    []
  )

  const updateCustomer = useCallback(
    async (input: CustomerUpdateInput): Promise<Customer> => {
      setError(null)
      try {
        const updated = await customersApi.update(input)
        if (mounted.current) {
          setCustomers((prev) =>
            prev.map((c) => (c.id === input.id ? updated : c))
          )
        }
        return updated
      } catch (err: unknown) {
        const message = customersErrorMessage(err)
        setError(message)
        throw new Error(message)
      }
    },
    []
  )

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
  },
  [])

  const toggleStatus = useCallback(async (id: string): Promise<Customer> => {
    setError(null)
    try {
      const updated = await customersApi.toggleStatus(id)
      if (mounted.current) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === id ? updated : c))
        )
      }
      return updated
    } catch (err: unknown) {
      const message = customersErrorMessage(err)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const getAccountSummary = useCallback(
    async (customerId: string): Promise<CustomerAccountSummary | null> => {
      setError(null)
      try {
        return await customersApi.getAccountSummary(customerId)
      } catch (err: unknown) {
        const message = customersErrorMessage(err)
        setError(message)
        throw new Error(message)
      }
    },
    []
  )

  const listDebts = useCallback(async (customerId: string): Promise<CustomerDebt[]> => {
    setError(null)
    try {
      return await customersApi.listDebts(customerId)
    } catch (err: unknown) {
      const message = customersErrorMessage(err)
      setError(message)
      throw new Error(message)
    }
  }, [])

  const listPayments = useCallback(
    async (customerId: string): Promise<CustomerPayment[]> => {
      setError(null)
      try {
        return await customersApi.listPayments(customerId)
      } catch (err: unknown) {
        const message = customersErrorMessage(err)
        setError(message)
        throw new Error(message)
      }
    },
    []
  )

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

  const createCreditSale = useCallback(
    async (input: CreateCreditSaleInput): Promise<CustomerDebt> => {
      setError(null)
      try {
        const debt = await customersApi.createCreditSale(input)
        if (mounted.current) {
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === input.customerId
                ? { ...c, currentDebt: c.currentDebt + input.totalAmount }
                : c
            )
          )
        }
        return debt
      } catch (err: unknown) {
        const message = customersErrorMessage(err)
        setError(message)
        throw new Error(message)
      }
    },
    []
  )

  const applyPaymentToDebt = useCallback(
    async (input: ApplyPaymentToDebtInput): Promise<CustomerDebt> => {
      setError(null)
      try {
        return await customersApi.applyPaymentToDebt(input)
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
      clearError,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      toggleStatus,
      getAccountSummary,
      listDebts,
      listPayments,
      recordPayment,
      createCreditSale,
      applyPaymentToDebt
    }),
    [
      customers,
      isLoading,
      error,
      reload,
      clearError,
      createCustomer,
      updateCustomer,
      deleteCustomer,
      toggleStatus,
      getAccountSummary,
      listDebts,
      listPayments,
      recordPayment,
      createCreditSale,
      applyPaymentToDebt
    ]
  )

  return value
}
