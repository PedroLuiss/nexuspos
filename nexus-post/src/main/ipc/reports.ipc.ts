import { ipcMain } from 'electron'
import { IPC_CHANNELS, type ReportsQuery } from '@shared/contracts'
import type { ReportsService } from '../domain/reports/reports.service'

export function registerReportsIpc(reports: ReportsService): void {
  ipcMain.handle(IPC_CHANNELS.reports.getDashboard, (_event, query: ReportsQuery) =>
    reports.getDashboard(query)
  )
  ipcMain.handle(IPC_CHANNELS.reports.getCustomerDetail, (_event, customerId: string) =>
    reports.getCustomerDetail(customerId)
  )
}
