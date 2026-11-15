import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Configuración única del establecimiento (identidad legal, propietario,
 * domicilio fiscal, plantilla de ticket e impuestos).
 * Adaptado para Venezuela: RIF, moneda VES por defecto, dirección con
 * estado/municipio/parroquia, IVA configurable.
 * Se siembra una fila `default` con datos demostrativos editables desde Ajustes.
 */
export const migration008BusinessSettings: Migration = {
  version: 8,
  name: 'business_settings',
  up(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS business_settings (
        id TEXT PRIMARY KEY,
        legal_name TEXT NOT NULL DEFAULT '',
        trade_name TEXT NOT NULL DEFAULT '',
        tax_id_type TEXT NOT NULL DEFAULT 'RIF',
        tax_id TEXT NOT NULL DEFAULT '',
        tax_regime TEXT NOT NULL DEFAULT '',
        owner_name TEXT NOT NULL DEFAULT '',
        owner_tax_id TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        mobile TEXT NOT NULL DEFAULT '',
        website TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        district TEXT NOT NULL DEFAULT '',
        city TEXT NOT NULL DEFAULT '',
        state TEXT NOT NULL DEFAULT '',
        municipality TEXT NOT NULL DEFAULT '',
        parish TEXT NOT NULL DEFAULT '',
        country TEXT NOT NULL DEFAULT '',
        postal_code TEXT NOT NULL DEFAULT '',
        currency TEXT NOT NULL DEFAULT 'VES',
        ticket_header TEXT NOT NULL DEFAULT '',
        ticket_footer TEXT NOT NULL DEFAULT '',
        ticket_legal_note TEXT NOT NULL DEFAULT '',
        ticket_show_tax_id INTEGER NOT NULL DEFAULT 1,
        ticket_show_address INTEGER NOT NULL DEFAULT 1,
        ticket_show_cashier INTEGER NOT NULL DEFAULT 1,
        tax_enabled INTEGER NOT NULL DEFAULT 1,
        tax_name TEXT NOT NULL DEFAULT 'IVA',
        tax_rate REAL NOT NULL DEFAULT 16,
        prices_include_tax INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL DEFAULT ''
      );
    `)

    const now = new Date().toISOString()
    const insert = db.prepare(`
      INSERT OR IGNORE INTO business_settings (
        id, legal_name, trade_name, tax_id_type, tax_id, tax_regime,
        owner_name, owner_tax_id, email, phone, mobile, website,
        address, district, city, state, municipality, parish, country, postal_code, currency,
        ticket_header, ticket_footer, ticket_legal_note,
        ticket_show_tax_id, ticket_show_address, ticket_show_cashier,
        tax_enabled, tax_name, tax_rate, prices_include_tax,
        created_at, updated_at
      ) VALUES (
        'default', ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        1, 1, 1,
        1, 'IVA', 16, 0,
        ?, ?
      )
    `)

    insert.run(
      'COMERCIAL LOS ANDES C.A.',
      'Nexus Market Venezuela',
      'RIF',
      'J-00000000-0',
      'Régimen General - Persona Jurídica',
      'Carlos Morales',
      'V-12345678',
      'contacto@nexusmarket.com.ve',
      '+58 212-555.0199',
      '+58 412-555.0199',
      'https://www.nexusmarket.com.ve',
      'Av. Francisco Fajardo, Edificio Los Andes, Piso 1',
      'El Paraíso',
      'Caracas',
      'Distrito Capital',
      'Libertador',
      'Altagracia',
      'Venezuela',
      '1010',
      'VES',
      '¡Bienvenidos a Nexus Market Venezuela!',
      'Gracias por su compra. Conserve este ticket para cambios o devoluciones.',
      'Documento no fiscal. RIF: J-00000000-0. Sujeto a regulación del SENIAT.',
      now,
      now
    )
  }
}
