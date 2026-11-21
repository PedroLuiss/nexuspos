import { useEffect } from 'react'

interface UseCustomersHotkeysOptions {
  canManageCustomers: boolean
  isLoading: boolean
  showDeactivated: boolean
  isFormOpen: boolean
  isAccountOpen: boolean
  isPaymentOpen: boolean
  onCreateCustomer: () => void
}

export function useCustomersHotkeys({
  canManageCustomers,
  isLoading,
  showDeactivated,
  isFormOpen,
  isAccountOpen,
  isPaymentOpen,
  onCreateCustomer
}: UseCustomersHotkeysOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        !canManageCustomers ||
        isLoading ||
        showDeactivated ||
        isFormOpen ||
        isAccountOpen ||
        isPaymentOpen ||
        document.querySelector('[aria-modal="true"], [role="dialog"], .fixed.inset-0') ||
        event.repeat ||
        !event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.getModifierState('AltGraph') ||
        event.key.toLowerCase() !== 'c'
      ) {
        return
      }

      event.preventDefault()
      onCreateCustomer()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    canManageCustomers,
    isAccountOpen,
    isFormOpen,
    isLoading,
    isPaymentOpen,
    onCreateCustomer,
    showDeactivated
  ])
}
