import { Modal } from '../../../shared/ui/Modal'

interface ProductDeleteConfirmModalProps {
  productName: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ProductDeleteConfirmModal({
  productName,
  onCancel,
  onConfirm
}: ProductDeleteConfirmModalProps): React.JSX.Element | null {
  if (!productName) return null

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title="Confirmar baja de producto"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold text-[#5C5C5C] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F3F3F3] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#C42B1C] rounded-[4px] hover:bg-[#A82016] cursor-pointer"
          >
            Dar de baja
          </button>
        </>
      }
    >
      <p className="text-sm text-[#1B1B1B]">
        ¿Dar de baja el producto <strong>{productName}</strong>?
      </p>
      <p className="mt-2 text-xs text-[#5C5C5C]">
        El producto dejará de aparecer en el catálogo, pero sus ventas y movimientos históricos se
        conservarán.
      </p>
    </Modal>
  )
}
