import type { JSX, ReactNode } from 'react'
import { Modal } from './Modal'

export interface ConfirmDialogOptions {
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  intent?: 'danger' | 'primary'
}

interface ConfirmDialogProps extends ConfirmDialogOptions {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  intent = 'danger',
  onCancel,
  onConfirm
}: ConfirmDialogProps): JSX.Element {
  const confirmClass =
    intent === 'danger' ? 'bg-[#C42B1C] hover:bg-[#A82016]' : 'bg-[#0067C0] hover:bg-[#0078D4]'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-semibold text-[#5C5C5C] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F3F3F3] cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-3 py-1.5 text-xs font-bold text-white ${confirmClass} rounded-[4px] cursor-pointer`}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-[#1B1B1B]">{message}</div>
    </Modal>
  )
}
