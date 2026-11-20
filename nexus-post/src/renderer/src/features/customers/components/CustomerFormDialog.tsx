import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import type { Customer, CustomerInput } from '@shared/contracts'
import { CurrencyInput } from '../../../shared/ui/CurrencyInput'
import { Modal } from '../../../shared/ui/Modal'
import { getCurrencySymbol } from '../../../shared/lib/businessConfig'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'

interface CustomerFormDialogProps {
  isOpen: boolean
  customer: Customer | null
  suggestedCode: string
  isSaving: boolean
  onClose: () => void
  onSave: (input: CustomerInput, customerId?: string) => Promise<void>
}

const emptyForm = (code: string): CustomerInput => ({
  code,
  name: '',
  taxId: '',
  phone: '',
  email: '',
  address: '',
  creditLimit: 5000
})

export function CustomerFormDialog({
  isOpen,
  customer,
  suggestedCode,
  isSaving,
  onClose,
  onSave
}: CustomerFormDialogProps): JSX.Element | null {
  const { config } = useBusinessConfig()
  const [form, setForm] = useState<CustomerInput>(() =>
    customer
      ? {
          code: customer.code,
          name: customer.name,
          taxId: customer.taxId,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          creditLimit: customer.creditLimit
        }
      : emptyForm(suggestedCode)
  )

  const updateField = <K extends keyof CustomerInput>(key: K, value: CustomerInput[K]): void =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    void onSave({ ...form, code: form.code.trim(), name: form.name.trim() }, customer?.id)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Editar cliente' : 'Registrar cliente'}
      width="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-md border border-[#D1D1D1] bg-white px-4 py-2 text-xs font-semibold text-[#5C5C5C] hover:bg-[#F3F3F3] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="customer-form"
            disabled={isSaving}
            className="rounded-md bg-[#0067C0] px-4 py-2 text-xs font-bold text-white hover:bg-[#0078D4] disabled:cursor-wait disabled:opacity-60"
          >
            {isSaving ? 'Guardando…' : customer ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-md border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-[#5C5C5C]">
          Los datos del cliente se guardan en el directorio comercial. El límite de crédito se
          valida nuevamente al registrar ventas a crédito.
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[#1B1B1B]">
            Código de cliente
            <input
              required
              maxLength={40}
              value={form.code}
              onChange={(event) => updateField('code', event.target.value)}
              className="w-full rounded-md border border-[#D1D1D1] bg-white px-3 py-2 font-mono text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#1B1B1B]">
            RFC / identificación fiscal
            <input
              maxLength={40}
              value={form.taxId}
              onChange={(event) => updateField('taxId', event.target.value)}
              placeholder="Opcional"
              className="w-full rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
            />
          </label>
        </div>
        <label className="block space-y-1 text-xs font-semibold text-[#1B1B1B]">
          Nombre o razón social
          <input
            required
            autoFocus
            maxLength={160}
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Nombre completo o razón social"
            className="w-full rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold text-[#1B1B1B]">
            Teléfono
            <input
              maxLength={40}
              value={form.phone}
              onChange={(event) => updateField('phone', event.target.value)}
              className="w-full rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold text-[#1B1B1B]">
            Correo electrónico
            <input
              type="email"
              maxLength={160}
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              className="w-full rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
            />
          </label>
        </div>
        <label className="block space-y-1 text-xs font-semibold text-[#1B1B1B]">
          Dirección
          <input
            maxLength={240}
            value={form.address}
            onChange={(event) => updateField('address', event.target.value)}
            className="w-full rounded-md border border-[#D1D1D1] bg-white px-3 py-2 text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
          />
        </label>
        <label className="block max-w-xs space-y-1 text-xs font-semibold text-[#1B1B1B]">
          Límite de crédito
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717783]">
              {getCurrencySymbol(config.currency)}
            </span>
            <CurrencyInput
              min="0"
              required
              value={form.creditLimit}
              onValueChange={(value) => updateField('creditLimit', value)}
              className="w-full rounded-md border border-[#D1D1D1] bg-white py-2 pl-7 pr-3 font-mono text-xs outline-none focus:border-[#0067C0] focus:ring-2 focus:ring-[#0067C0]/15"
            />
          </div>
        </label>
      </form>
    </Modal>
  )
}
