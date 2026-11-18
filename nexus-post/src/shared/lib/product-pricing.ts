/**
 * Resolución de precio unitario por escalas de mayoreo (price tiers).
 *
 * Vive en `src/shared/lib` porque lo consumen **main** y **renderer**:
 * el POS muestra el precio que se cobrará y el backend recalcula la venta
 * antes de persistirla. Una sola implementación evita diferencias de centavos.
 */
import type { ProductPriceTier } from '../contracts/product-price-tier.contract'

/**
 * Devuelve el precio aplicable para una cantidad dada según los tiers activos.
 * Si hay varios tiers aplicables, gana el de mayor `minQuantity` (más específico).
 * Si ningún tier aplica, devuelve `basePrice` (precio de venta estándar).
 */
export function resolveUnitPrice(
  tiers: ProductPriceTier[] | undefined,
  quantity: number,
  basePrice: number
): number {
  if (!tiers || tiers.length === 0) return basePrice

  const applicable = tiers
    .filter(
      (t) =>
        !t.deleted &&
        t.active &&
        t.minQuantity <= quantity &&
        (t.maxQuantity === undefined || t.maxQuantity === null || quantity <= t.maxQuantity)
    )
    .sort((a, b) => b.minQuantity - a.minQuantity)

  return applicable.length > 0 ? applicable[0].price : basePrice
}

/** Devuelve el tier aplicable (para mostrar etiquetas), o null si no hay. */
export function resolveApplicableTier(
  tiers: ProductPriceTier[] | undefined,
  quantity: number
): ProductPriceTier | null {
  if (!tiers || tiers.length === 0) return null
  const applicable = tiers
    .filter(
      (t) =>
        !t.deleted &&
        t.active &&
        t.minQuantity <= quantity &&
        (t.maxQuantity === undefined || t.maxQuantity === null || quantity <= t.maxQuantity)
    )
    .sort((a, b) => b.minQuantity - a.minQuantity)
  return applicable[0] ?? null
}
