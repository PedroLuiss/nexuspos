import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ConfirmDialog, type ConfirmDialogOptions } from '../ui/ConfirmDialog'

interface UseConfirmDialogResult {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>
  isOpen: boolean
  dialog: ReactNode
}

export function useConfirmDialog(): UseConfirmDialogResult {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null)
  const resolvePending = useRef<((confirmed: boolean) => void) | null>(null)

  const confirm = useCallback((nextOptions: ConfirmDialogOptions): Promise<boolean> => {
    if (resolvePending.current) return Promise.resolve(false)
    return new Promise((resolve) => {
      resolvePending.current = resolve
      setOptions(nextOptions)
    })
  }, [])

  const resolve = useCallback((confirmed: boolean): void => {
    const resolveActive = resolvePending.current
    if (!resolveActive) return
    resolvePending.current = null
    setOptions(null)
    resolveActive(confirmed)
  }, [])

  useEffect(
    () => () => {
      const resolveActive = resolvePending.current
      resolvePending.current = null
      resolveActive?.(false)
    },
    []
  )

  const dialog = options ? (
    <ConfirmDialog
      {...options}
      isOpen
      onCancel={() => resolve(false)}
      onConfirm={() => resolve(true)}
    />
  ) : null

  return { confirm, isOpen: options !== null, dialog }
}
