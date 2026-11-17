import type { UsdVesExchangeRate } from '@shared/contracts'
import { formatVesAmount } from '../../../shared/lib/currency'

interface ReportMoneyProps {
  amount: number
  rate: UsdVesExchangeRate | null
  prominent?: boolean
}

export function ReportMoney({
  amount,
  rate,
  prominent = false
}: ReportMoneyProps): React.JSX.Element {
  return (
    <span className="block text-right">
      <strong className={prominent ? 'block font-mono text-2xl' : 'block font-mono text-xs'}>
        {`$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      </strong>
      <span className="block text-[10px] text-[#5C5C5C]">
        {rate ? `≈ ${formatVesAmount(amount * rate.rate)}` : 'Conversión VES no disponible'}
      </span>
    </span>
  )
}
