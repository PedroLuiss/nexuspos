import type { CurrencyCode, CurrencyVesExchangeRate } from '@shared/contracts'
import { formatCurrency, formatVesAmount } from '../../../shared/lib/currency'

interface ReportMoneyProps {
  amount: number
  currency: CurrencyCode
  rate: CurrencyVesExchangeRate | null
  prominent?: boolean
}

export function ReportMoney({
  amount,
  currency,
  rate,
  prominent = false
}: ReportMoneyProps): React.JSX.Element {
  return (
    <span className="block text-right">
      <strong className={prominent ? 'block font-mono text-2xl' : 'block font-mono text-xs'}>
        {formatCurrency(amount, currency)}
      </strong>
      {currency !== 'VES' && (
        <span className="block text-[10px] text-[#5C5C5C]">
          {rate?.currency === currency
            ? `≈ ${formatVesAmount(amount * rate.rate)}`
            : 'Conversión VES no disponible'}
        </span>
      )}
    </span>
  )
}
