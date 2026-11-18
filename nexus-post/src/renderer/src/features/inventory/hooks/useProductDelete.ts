import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product } from '@shared/contracts'
import { toErrorMessage } from '../api/products.api'
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog'

interface UseProductDeleteOptions {
  deleteProduct: (id: string) => Promise<void>
}

interface UseProductDeleteResult {
  deletingProductId: string | null
  requestDelete: (product: Product) => Promise<void>
  confirmationOpen: boolean
  confirmationDialog: ReactNode
}

export function useProductDelete({
  deleteProduct
}: UseProductDeleteOptions): UseProductDeleteResult {
  const { confirm, dialog, isOpen } = useConfirmDialog()
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const requestDelete = useCallback(
    async (product: Product): Promise<void> => {
      const confirmed = await confirm({
        title: 'Confirmar baja de producto',
        message: `¿Dar de baja el producto "${product.name}"? Las ventas y movimientos históricos se conservarán.`,
        confirmLabel: 'Dar de baja'
      })
      if (!confirmed) return

      setDeletingProductId(product.id)
      try {
        await deleteProduct(product.id)
      } catch (error) {
        window.alert(toErrorMessage(error))
      } finally {
        setDeletingProductId(null)
      }
    },
    [confirm, deleteProduct]
  )

  return {
    deletingProductId,
    requestDelete,
    confirmationOpen: isOpen,
    confirmationDialog: dialog
  }
}
