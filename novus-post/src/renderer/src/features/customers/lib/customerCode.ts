import type { Customer } from '@shared/contracts'

export function getNextCustomerCode(customers: Customer[]): string {
  const existingCodes = new Set(customers.map((customer) => customer.code.toUpperCase()))
  let code = `CLI-${Date.now()}`
  while (existingCodes.has(code)) {
    code = `CLI-${Number(code.slice(4)) + 1}`
  }
  return code
}
