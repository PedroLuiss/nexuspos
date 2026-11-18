import { useCallback, useState } from 'react'
import type { Product } from '@shared/contracts'
import { toErrorMessage } from '../api/products.api'

interface UseProductDeleteOptions {
  deleteProduct: (id: string) => Promise<void>
}

interface UseProductDeleteResult {
  productToDelete: Product | null
  deletingProductId: string | null
  requestDelete: (product: Product) => void
  cancelDelete: () => void
  confirmDelete: () => Promise<void>
}

export function useProductDelete({
  deleteProduct
}: UseProductDeleteOptions): UseProductDeleteResult {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const requestDelete = useCallback((product: Product) => {
    setProductToDelete(product)
  }, [])

  const cancelDelete = useCallback(() => {
    setProductToDelete(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!productToDelete) return
    const product = productToDelete
    setProductToDelete(null)
    setDeletingProductId(product.id)
    try {
      await deleteProduct(product.id)
    } catch (error) {
      window.alert(toErrorMessage(error))
    } finally {
      setDeletingProductId(null)
    }
  }, [deleteProduct, productToDelete])

  return {
    productToDelete,
    deletingProductId,
    requestDelete,
    cancelDelete,
    confirmDelete
  }
}
