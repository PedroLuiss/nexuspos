import type Database from 'better-sqlite3'
import type {
  BusinessConfig,
  BusinessConfigInput,
  CurrencyCode,
  TaxIdType
} from '@shared/contracts'
import type { SettingsRepository } from '../../../ports/settings.repository'

const SETTINGS_ID = 'default'

interface BusinessSettingsRow {
  id: string
  legal_name: string
  trade_name: string
  tax_id_type: string
  tax_id: string
  tax_regime: string
  owner_name: string
  owner_tax_id: string
  email: string
  phone: string
  mobile: string
  website: string
  address: string
  district: string
  city: string
  state: string
  municipality: string
  parish: string
  country: string
  postal_code: string
  currency: string
  ticket_header: string
  ticket_footer: string
  ticket_legal_note: string
  ticket_show_tax_id: number
  ticket_show_address: number
  ticket_show_cashier: number
  tax_enabled: number
  tax_name: string
  tax_rate: number
  prices_include_tax: number
  updated_at: string
  updated_by: string
}

/** Valores de fábrica cuando la fila aún no existe (instalación nueva sin migración 008). */
const FALLBACK_CONFIG: BusinessConfig = {
  legalName: '',
  tradeName: '',
  taxIdType: 'RIF',
  taxId: '',
  taxRegime: '',
  ownerName: '',
  ownerTaxId: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  address: '',
  district: '',
  city: '',
  state: '',
  municipality: '',
  parish: '',
  country: 'Venezuela',
  postalCode: '',
  currency: 'VES',
  ticketHeader: '',
  ticketFooter: '',
  ticketLegalNote: '',
  ticketShowTaxId: true,
  ticketShowAddress: true,
  ticketShowCashier: true,
  taxEnabled: true,
  taxName: 'IVA',
  taxRate: 16,
  pricesIncludeTax: false
}

/** Todas las columnas esperadas en la tabla business_settings. */
const EXPECTED_COLUMNS: { name: string; ddl: string }[] = [
  { name: 'municipality', ddl: "ALTER TABLE business_settings ADD COLUMN municipality TEXT NOT NULL DEFAULT ''" },
  { name: 'parish', ddl: "ALTER TABLE business_settings ADD COLUMN parish TEXT NOT NULL DEFAULT ''" },
  { name: 'country', ddl: "ALTER TABLE business_settings ADD COLUMN country TEXT NOT NULL DEFAULT 'Venezuela'" },
  { name: 'currency', ddl: "ALTER TABLE business_settings ADD COLUMN currency TEXT NOT NULL DEFAULT 'VES'" },
  { name: 'tax_id_type', ddl: "ALTER TABLE business_settings ADD COLUMN tax_id_type TEXT NOT NULL DEFAULT 'RIF'" },
  { name: 'tax_regime', ddl: "ALTER TABLE business_settings ADD COLUMN tax_regime TEXT NOT NULL DEFAULT ''" },
  { name: 'owner_tax_id', ddl: "ALTER TABLE business_settings ADD COLUMN owner_tax_id TEXT NOT NULL DEFAULT ''" },
  { name: 'mobile', ddl: "ALTER TABLE business_settings ADD COLUMN mobile TEXT NOT NULL DEFAULT ''" },
  { name: 'website', ddl: "ALTER TABLE business_settings ADD COLUMN website TEXT NOT NULL DEFAULT ''" },
  { name: 'district', ddl: "ALTER TABLE business_settings ADD COLUMN district TEXT NOT NULL DEFAULT ''" },
  { name: 'ticket_header', ddl: "ALTER TABLE business_settings ADD COLUMN ticket_header TEXT NOT NULL DEFAULT ''" },
  { name: 'ticket_footer', ddl: "ALTER TABLE business_settings ADD COLUMN ticket_footer TEXT NOT NULL DEFAULT ''" },
  { name: 'ticket_legal_note', ddl: "ALTER TABLE business_settings ADD COLUMN ticket_legal_note TEXT NOT NULL DEFAULT ''" },
  { name: 'ticket_show_tax_id', ddl: "ALTER TABLE business_settings ADD COLUMN ticket_show_tax_id INTEGER NOT NULL DEFAULT 1" },
  { name: 'ticket_show_address', ddl: "ALTER TABLE business_settings ADD COLUMN ticket_show_address INTEGER NOT NULL DEFAULT 1" },
  { name: 'ticket_show_cashier', ddl: "ALTER TABLE business_settings ADD COLUMN ticket_show_cashier INTEGER NOT NULL DEFAULT 1" },
  { name: 'tax_enabled', ddl: "ALTER TABLE business_settings ADD COLUMN tax_enabled INTEGER NOT NULL DEFAULT 1" },
  { name: 'tax_name', ddl: "ALTER TABLE business_settings ADD COLUMN tax_name TEXT NOT NULL DEFAULT 'IVA'" },
  { name: 'tax_rate', ddl: "ALTER TABLE business_settings ADD COLUMN tax_rate REAL NOT NULL DEFAULT 16" },
  { name: 'prices_include_tax', ddl: "ALTER TABLE business_settings ADD COLUMN prices_include_tax INTEGER NOT NULL DEFAULT 0" },
  { name: 'created_at', ddl: "ALTER TABLE business_settings ADD COLUMN created_at TEXT NOT NULL DEFAULT ''" },
  { name: 'updated_at', ddl: "ALTER TABLE business_settings ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''" },
  { name: 'updated_by', ddl: "ALTER TABLE business_settings ADD COLUMN updated_by TEXT NOT NULL DEFAULT ''" }
]

function mapRow(row: BusinessSettingsRow): BusinessConfig {
  return {
    legalName: row.legal_name,
    tradeName: row.trade_name,
    taxIdType: row.tax_id_type as TaxIdType,
    taxId: row.tax_id,
    taxRegime: row.tax_regime,
    ownerName: row.owner_name,
    ownerTaxId: row.owner_tax_id,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    website: row.website,
    address: row.address,
    district: row.district,
    city: row.city,
    state: row.state,
    municipality: row.municipality,
    parish: row.parish,
    country: row.country,
    postalCode: row.postal_code,
    currency: row.currency as CurrencyCode,
    ticketHeader: row.ticket_header,
    ticketFooter: row.ticket_footer,
    ticketLegalNote: row.ticket_legal_note,
    ticketShowTaxId: row.ticket_show_tax_id === 1,
    ticketShowAddress: row.ticket_show_address === 1,
    ticketShowCashier: row.ticket_show_cashier === 1,
    taxEnabled: row.tax_enabled === 1,
    taxName: row.tax_name,
    taxRate: row.tax_rate,
    pricesIncludeTax: row.prices_include_tax === 1,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by || undefined
  }
}

/**
 * Adaptador SQLite de la configuración del establecimiento.
 * Tabla de fila única (`business_settings`) creada por la migración 008.
 *
 * Incluye auto-reparación defensiva: si la tabla existe pero le faltan columnas
 * (por ejemplo, bases de datos creadas con una versión antigua de la migración 008),
 * las agrega automáticamente antes de cualquier lectura o escritura.
 */
export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: Database.Database) {}

  /**
   * Verifica que la tabla tenga todas las columnas esperadas.
   * Si faltan columnas, las agrega con ALTER TABLE (idempotente y seguro).
   * Envuelto en try-catch para no romper el POS si algo falla.
   */
  private ensureColumns(): void {
    try {
      const tableExists = this.db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'business_settings'")
        .get() as { name: string } | undefined

      if (!tableExists) return

      const existingColumns = new Set(
        (this.db.prepare('PRAGMA table_info(business_settings)').all() as { name: string }[]).map(
          (c) => c.name
        )
      )

      for (const col of EXPECTED_COLUMNS) {
        if (!existingColumns.has(col.name)) {
          this.db.exec(col.ddl)
        }
      }
    } catch {
      // Si algo falla, dejamos que la consulta original falle con su error nativo
      // para no ocultar problemas reales.
    }
  }

  getBusiness(): BusinessConfig {
    this.ensureColumns()

    const row = this.db
      .prepare<[string], BusinessSettingsRow>('SELECT * FROM business_settings WHERE id = ?')
      .get(SETTINGS_ID)

    if (row) return mapRow(row)

    // Auto-reparación: la fila debería existir por migración, pero nunca debe romper el POS.
    return this.insertDefault()
  }

  updateBusiness(input: BusinessConfigInput, updatedBy?: string): BusinessConfig {
    this.ensureColumns()

    const now = new Date().toISOString()

    this.db
      .prepare(
        `UPDATE business_settings SET
          legal_name = ?, trade_name = ?, tax_id_type = ?, tax_id = ?, tax_regime = ?,
          owner_name = ?, owner_tax_id = ?, email = ?, phone = ?, mobile = ?, website = ?,
          address = ?, district = ?, city = ?, state = ?, municipality = ?, parish = ?,
          country = ?, postal_code = ?,
          currency = ?, ticket_header = ?, ticket_footer = ?, ticket_legal_note = ?,
          ticket_show_tax_id = ?, ticket_show_address = ?, ticket_show_cashier = ?,
          tax_enabled = ?, tax_name = ?, tax_rate = ?, prices_include_tax = ?,
          updated_at = ?, updated_by = ?
        WHERE id = ?`
      )
      .run(
        input.legalName,
        input.tradeName,
        input.taxIdType,
        input.taxId,
        input.taxRegime,
        input.ownerName,
        input.ownerTaxId,
        input.email,
        input.phone,
        input.mobile,
        input.website,
        input.address,
        input.district,
        input.city,
        input.state,
        input.municipality,
        input.parish,
        input.country,
        input.postalCode,
        input.currency,
        input.ticketHeader,
        input.ticketFooter,
        input.ticketLegalNote,
        input.ticketShowTaxId ? 1 : 0,
        input.ticketShowAddress ? 1 : 0,
        input.ticketShowCashier ? 1 : 0,
        input.taxEnabled ? 1 : 0,
        input.taxName,
        input.taxRate,
        input.pricesIncludeTax ? 1 : 0,
        now,
        updatedBy ?? '',
        SETTINGS_ID
      )

    return this.getBusiness()
  }

  private insertDefault(): BusinessConfig {
    const now = new Date().toISOString()
    const base = FALLBACK_CONFIG

    this.db
      .prepare(
        `INSERT OR IGNORE INTO business_settings (
          id, legal_name, trade_name, tax_id_type, tax_id, tax_regime,
          owner_name, owner_tax_id, email, phone, mobile, website,
          address, district, city, state, municipality, parish, country, postal_code, currency,
          ticket_header, ticket_footer, ticket_legal_note,
          ticket_show_tax_id, ticket_show_address, ticket_show_cashier,
          tax_enabled, tax_name, tax_rate, prices_include_tax,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?
        )`
      )
      .run(
        SETTINGS_ID,
        base.legalName,
        base.tradeName,
        base.taxIdType,
        base.taxId,
        base.taxRegime,
        base.ownerName,
        base.ownerTaxId,
        base.email,
        base.phone,
        base.mobile,
        base.website,
        base.address,
        base.district,
        base.city,
        base.state,
        base.municipality,
        base.parish,
        base.country,
        base.postalCode,
        base.currency,
        base.ticketHeader,
        base.ticketFooter,
        base.ticketLegalNote,
        base.ticketShowTaxId ? 1 : 0,
        base.ticketShowAddress ? 1 : 0,
        base.ticketShowCashier ? 1 : 0,
        base.taxEnabled ? 1 : 0,
        base.taxName,
        base.taxRate,
        base.pricesIncludeTax ? 1 : 0,
        now,
        now
      )

    return this.getBusiness()
  }
}
