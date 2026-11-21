import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration029TicketAndInvoiceDeliverySettings: Migration = {
  version: 29,
  name: 'ticket_and_invoice_delivery_settings',
  up(db: Database.Database): void {
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'business_settings'")
      .get() as { name: string } | undefined

    if (!tableExists) return

    const existingColumns = new Set(
      (db.prepare('PRAGMA table_info(business_settings)').all() as { name: string }[]).map(
        (c) => c.name
      )
    )

    const columnsToAdd: { name: string; ddl: string }[] = [
      {
        name: 'invoice_paper_size',
        ddl: "ALTER TABLE business_settings ADD COLUMN invoice_paper_size TEXT NOT NULL DEFAULT 'TICKET_80MM'"
      },
      {
        name: 'invoice_output_mode',
        ddl: "ALTER TABLE business_settings ADD COLUMN invoice_output_mode TEXT NOT NULL DEFAULT 'PRINT_DIRECT'"
      },
      {
        name: 'email_invoice_enabled',
        ddl: 'ALTER TABLE business_settings ADD COLUMN email_invoice_enabled INTEGER NOT NULL DEFAULT 0'
      },
      {
        name: 'smtp_host',
        ddl: "ALTER TABLE business_settings ADD COLUMN smtp_host TEXT NOT NULL DEFAULT 'smtp.gmail.com'"
      },
      {
        name: 'smtp_port',
        ddl: 'ALTER TABLE business_settings ADD COLUMN smtp_port INTEGER NOT NULL DEFAULT 587'
      },
      {
        name: 'smtp_secure',
        ddl: 'ALTER TABLE business_settings ADD COLUMN smtp_secure INTEGER NOT NULL DEFAULT 0'
      },
      {
        name: 'smtp_user',
        ddl: "ALTER TABLE business_settings ADD COLUMN smtp_user TEXT NOT NULL DEFAULT ''"
      },
      {
        name: 'smtp_password',
        ddl: "ALTER TABLE business_settings ADD COLUMN smtp_password TEXT NOT NULL DEFAULT ''"
      },
      {
        name: 'smtp_from_name',
        ddl: "ALTER TABLE business_settings ADD COLUMN smtp_from_name TEXT NOT NULL DEFAULT ''"
      },
      {
        name: 'email_subject_template',
        ddl: "ALTER TABLE business_settings ADD COLUMN email_subject_template TEXT NOT NULL DEFAULT 'Factura #{numero} - {empresa}'"
      },
      {
        name: 'email_body_template',
        ddl: "ALTER TABLE business_settings ADD COLUMN email_body_template TEXT NOT NULL DEFAULT 'Estimado(a) {cliente},\n\nAdjuntamos el detalle de su factura #{numero} emitida por {empresa}.\nTotal a pagar: {total}.\n\n¡Gracias por su preferencia!'"
      },
      {
        name: 'whatsapp_invoice_enabled',
        ddl: 'ALTER TABLE business_settings ADD COLUMN whatsapp_invoice_enabled INTEGER NOT NULL DEFAULT 0'
      },
      {
        name: 'whatsapp_message_template',
        ddl: "ALTER TABLE business_settings ADD COLUMN whatsapp_message_template TEXT NOT NULL DEFAULT '¡Hola {cliente}! Le compartimos el detalle de su factura #{numero} por un total de {total} en {empresa}. ¡Muchas gracias por su compra!'"
      }
    ]

    for (const col of columnsToAdd) {
      if (!existingColumns.has(col.name)) {
        db.exec(col.ddl)
      }
    }
  }
}
