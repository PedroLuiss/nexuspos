import type { IssueReportInput, IssueReportResult } from '@shared/contracts'

export interface IssueReportPort {
  submit(input: IssueReportInput): Promise<IssueReportResult>
}
