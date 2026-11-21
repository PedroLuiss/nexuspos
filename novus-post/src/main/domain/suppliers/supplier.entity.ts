import type { SupplierInput } from '@shared/contracts'

const MAX_SUPPLIER_NAME_LENGTH = 100
const MAX_CONTACT_NAME_LENGTH = 100
const MAX_EMAIL_LENGTH = 200
const MAX_ADDRESS_LENGTH = 200

/** Normaliza y sanea los datos de entrada de un proveedor. */
export function normalizeSupplierInput(input: SupplierInput): SupplierInput {
  return {
    name: (input.name ?? '').trim().slice(0, MAX_SUPPLIER_NAME_LENGTH),
    contactName: (input.contactName ?? '').trim().slice(0, MAX_CONTACT_NAME_LENGTH),
    phone: (input.phone ?? '').trim(),
    email: (input.email ?? '').trim().slice(0, MAX_EMAIL_LENGTH),
    address: (input.address ?? '').trim().slice(0, MAX_ADDRESS_LENGTH),
    active: input.active ?? true
  }
}

/** Reglas de validación de negocio de un proveedor. */
export function validateSupplierInput(input: SupplierInput): string[] {
  const errors: string[] = []
  if (!input.name?.trim()) errors.push('El nombre del proveedor es obligatorio')
  return errors
}
