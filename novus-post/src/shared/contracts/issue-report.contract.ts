export const ISSUE_REPORT_CATEGORIES = [
  'sales',
  'inventory',
  'cash',
  'customers',
  'reports',
  'settings',
  'other'
] as const

export type IssueReportCategory = (typeof ISSUE_REPORT_CATEGORIES)[number]

export interface IssueReportInput {
  title: string
  category: IssueReportCategory
  description: string
  contactEmail?: string
}

export interface IssueReportResult {
  success: boolean
  message?: string
  error?: string
}

export interface IssueReportsApi {
  submit(input: IssueReportInput): Promise<IssueReportResult>
}
