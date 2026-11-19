import { ipcMain, net } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { IssueReportInput, IssueReportResult } from '@shared/contracts'
import type { IssueReportService } from '../domain/issue-reports/issue-report.service'

export function registerIssueReportsIpc(service: IssueReportService): void {
  ipcMain.handle(
    IPC_CHANNELS.issueReports.submit,
    (_event, input: IssueReportInput): Promise<IssueReportResult> => {
      if (!net.isOnline()) {
        return Promise.resolve({
          success: false,
          error: 'Conéctate a internet para enviar el reporte. No se guardará en este equipo.'
        })
      }
      return service.submit(input)
    }
  )
}
