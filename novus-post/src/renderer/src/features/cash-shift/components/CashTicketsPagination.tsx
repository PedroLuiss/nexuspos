interface CashTicketsPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function CashTicketsPagination({
  currentPage,
  totalPages,
  onPageChange
}: CashTicketsPaginationProps): React.JSX.Element {
  return (
    <footer className="flex items-center justify-between border-t border-[#E5E5E5] bg-[#F9F9F9] px-3 py-2 text-[11px]">
      <span className="text-[#5C5C5C]">
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="rounded border border-[#D1D1D1] bg-white px-2 py-1 disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="rounded border border-[#D1D1D1] bg-white px-2 py-1 disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </footer>
  )
}
