import { useState, useEffect, useCallback, useRef } from 'react'
import type { User, CreateUserInput, UpdateUserInput } from '@shared/contracts'
import { usersApi, toErrorMessage } from '../api/users.api'

export interface UseUsersResult {
  users: User[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createUser: (input: CreateUserInput) => Promise<User>
  updateUser: (input: UpdateUserInput) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  toggleStatus: (id: string) => Promise<User>
  clearError: () => void
}

/**
 * Estado de la gestión de usuarios contra SQLite (vía IPC).
 * `enabled = false` evita consultar la base de datos cuando la sesión no es Administrador.
 */
export function useUsers(enabled = true): UseUsersResult {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await usersApi.list()
      if (mounted.current) {
        setUsers(data)
      }
    } catch (err) {
      if (mounted.current) {
        setError(toErrorMessage(err))
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    usersApi
      .list()
      .then((data) => {
        if (!cancelled && mounted.current) {
          setUsers(data)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled && mounted.current) {
          setError(toErrorMessage(err))
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
  }, [enabled])

  const createUser = useCallback(
    async (input: CreateUserInput): Promise<User> => {
      setIsLoading(true)
      setError(null)
      try {
        const created = await usersApi.create(input)
        setUsers((prev) => [...prev, created])
        return created
      } catch (err) {
        const msg = toErrorMessage(err)
        setError(msg)
        throw new Error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const updateUser = useCallback(
    async (input: UpdateUserInput): Promise<User> => {
      setIsLoading(true)
      setError(null)
      try {
        const updated = await usersApi.update(input)
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        return updated
      } catch (err) {
        const msg = toErrorMessage(err)
        setError(msg)
        throw new Error(msg)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      await usersApi.delete(id)
      // Soft delete: el registro permanece visible como inactivo para auditoría.
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: false } : u)))
    } catch (err) {
      const msg = toErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleStatus = useCallback(async (id: string): Promise<User> => {
    setIsLoading(true)
    setError(null)
    try {
      const updated = await usersApi.toggleStatus(id)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      return updated
    } catch (err) {
      const msg = toErrorMessage(err)
      setError(msg)
      throw new Error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    users,
    isLoading,
    error,
    reload,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    clearError
  }
}
