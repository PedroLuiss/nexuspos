import type { ReportsApi } from '@shared/contracts'

export const reportsApi: ReportsApi = {
  getDashboard: (query) => window.api.reports.getDashboard(query),
  getCustomerDetail: (customerId) => window.api.reports.getCustomerDetail(customerId)
}

export function reportsErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
