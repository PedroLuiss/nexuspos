import React, { useEffect, useState } from 'react'
import type { Product, ProductBarcode, ProductBarcodeLabelInput } from '@shared/contracts'
import { getProductBarcodeValidationError } from '@shared/lib/product-barcode'
import { Barcode, X } from '../../../shared/icons/Icons'
import ProductSearchSelect from './ProductSearchSelect'
import BarcodeLabelControls from './BarcodeLabelControls'
import BarcodeLabelActions from './BarcodeLabelActions'
import BarcodeLabelPreview from './BarcodeLabelPreview'

interface BarcodeGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  products
}) => {
  const [selectedProductIdValue, setSelectedProductId] = useState<string>('')
  const [selectedProductOption, setSelectedProductOption] = useState<Product | null>(null)
  const selectedProductId = products.some((product) => product.id === selectedProductIdValue)
    ? selectedProductIdValue
    : selectedProductOption?.id === selectedProductIdValue
      ? selectedProductIdValue
      : (products[0]?.id ?? '')
  const [widthMm, setWidthMm] = useState<number>(50)
  const [heightMm, setHeightMm] = useState<number>(30)
  const [marginMm, setMarginMm] = useState<number>(3)
  const [copies, setCopies] = useState<number>(10)
  const [includePrice, setIncludePrice] = useState<boolean>(true)
  const [barcodeLoad, setBarcodeLoad] = useState<{
    productId: string
    barcodes: ProductBarcode[]
    error: string | null
  } | null>(null)
  const [selectedBarcodeIdValue, setSelectedBarcodeId] = useState('')
  const [barcodePreview, setBarcodePreview] = useState<{
    key: string
    svg: string
    error: string | null
  }>({ key: '', svg: '', error: null })
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const selectedProduct =
    products.find((p) => p.id === selectedProductId) ??
    (selectedProductOption?.id === selectedProductId ? selectedProductOption : undefined) ??
    products[0]
  const productBarcodes =
    barcodeLoad && barcodeLoad.productId === selectedProduct?.id ? barcodeLoad.barcodes : []
  const isLoadingBarcodes = Boolean(
    isOpen && selectedProductId && barcodeLoad?.productId !== selectedProductId
  )
  const barcodeLoadError =
    barcodeLoad?.productId === selectedProductId ? barcodeLoad.error : null
  const activeBarcodes = productBarcodes.filter(
    (barcode) =>
      barcode.productId === selectedProduct?.id && barcode.active && !barcode.deleted
  )
  const selectedBarcode =
    activeBarcodes.find((barcode) => barcode.id === selectedBarcodeIdValue) ??
    activeBarcodes.find((barcode) => barcode.isPrimary) ??
    activeBarcodes[0]
  const barcodeValue = selectedBarcode?.barcode ?? selectedProduct?.code ?? ''
  const barcodeFormat = selectedBarcode?.format ?? 'Code128'
  const barcodeValidationError = getProductBarcodeValidationError(barcodeValue, barcodeFormat)
  const barcodePreviewKey = `${barcodeFormat}:${barcodeValue}`
  const barcodeSvg =
    barcodeValidationError || barcodePreview.key !== barcodePreviewKey ? '' : barcodePreview.svg
  const barcodePreviewError =
    barcodeValidationError ??
    (barcodePreview.key === barcodePreviewKey ? barcodePreview.error : null)

  useEffect(() => {
    if (!isOpen || !selectedProductId) return

    let active = true
    void window.api.productBarcodes
      .list({ productId: selectedProductId, onlyActive: true })
      .then((items) => {
        if (active) setBarcodeLoad({ productId: selectedProductId, barcodes: items, error: null })
      })
      .catch((err: unknown) => {
        if (active) {
          setBarcodeLoad({
            productId: selectedProductId,
            barcodes: [],
            error:
              err instanceof Error
                ? err.message
                : 'No se pudieron cargar los códigos de barras.'
          })
        }
      })
    return () => {
      active = false
    }
  }, [isOpen, selectedProductId])

  useEffect(() => {
    if (!isOpen || isLoadingBarcodes) return
    if (barcodeValidationError) return

    let active = true
    void window.api.productBarcodes
      .previewLabel({ barcode: barcodeValue, format: barcodeFormat })
      .then((svg) => {
        if (active) setBarcodePreview({ key: barcodePreviewKey, svg, error: null })
      })
      .catch((err: unknown) => {
        if (active) {
          setBarcodePreview({
            key: barcodePreviewKey,
            svg: '',
            error:
              err instanceof Error
                ? err.message
                : 'No se pudo generar la vista previa del código.'
          })
        }
      })
    return () => {
      active = false
    }
  }, [
    barcodeFormat,
    barcodePreviewKey,
    barcodeValidationError,
    barcodeValue,
    isLoadingBarcodes,
    isOpen
  ])

  if (!isOpen) return null

  const labelInput = (): ProductBarcodeLabelInput => ({
    productId: selectedProduct?.id ?? '',
    barcodeId: selectedBarcode?.id,
    copies,
    widthMm,
    heightMm,
    marginMm,
    includePrice
  })

  const handlePrint = async (): Promise<void> => {
    if (!selectedProduct || isLoadingBarcodes) return
    setActionError(null)
    setActionMessage(null)
    setIsPrinting(true)
    try {
      await window.api.productBarcodes.printLabels(labelInput())
      setActionMessage('La etiqueta se envió al diálogo de impresión de Windows.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudieron imprimir las etiquetas.')
    } finally {
      setIsPrinting(false)
    }
  }

  const handleDownloadPdf = async (): Promise<void> => {
    if (!selectedProduct || isLoadingBarcodes) return
    setActionError(null)
    setActionMessage(null)
    setIsDownloadingPdf(true)
    try {
      const saved = await window.api.productBarcodes.downloadLabelsPdf(labelInput())
      if (saved) setActionMessage('El PDF de etiquetas se guardó correctamente.')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo crear el PDF de etiquetas.')
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-2xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 w-8 h-8 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center">
              <Barcode size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Generador de Etiquetas y Códigos de Barras
              </h2>
              <p className="text-[11px] text-[#717783]">
                Configuración de dimensiones térmicas para impresoras de etiquetas (Zebra /
                Xprinter)
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="kbd-badge">ESC</span>
            <button
              onClick={onClose}
              className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content: 2 Columns (Config Left, Preview Right) */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings Left */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Seleccionar Producto
              </label>
              <ProductSearchSelect
                products={products}
                value={selectedProductId}
                onChange={(id, product) => {
                  setSelectedProductId(id)
                  setSelectedProductOption(product ?? null)
                }}
                label="Seleccionar producto"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm focus:border-[#0078D4]"
              />
            </div>

            <BarcodeLabelControls
              productCode={selectedProduct?.code}
              barcodes={activeBarcodes}
              selectedBarcodeId={selectedBarcode?.id}
              barcodeFormat={barcodeFormat}
              widthMm={widthMm}
              heightMm={heightMm}
              marginMm={marginMm}
              copies={copies}
              includePrice={includePrice}
              isLoading={isLoadingBarcodes}
              loadError={barcodeLoadError}
              onBarcodeChange={setSelectedBarcodeId}
              onWidthChange={setWidthMm}
              onHeightChange={setHeightMm}
              onMarginChange={setMarginMm}
              onCopiesChange={setCopies}
              onIncludePriceChange={setIncludePrice}
            />
          </div>

          <BarcodeLabelPreview
            productName={selectedProduct?.name}
            salePrice={selectedProduct?.salePrice}
            barcodeValue={barcodeValue}
            barcodeSvg={barcodeSvg}
            barcodeFormat={barcodeFormat}
            widthMm={widthMm}
            heightMm={heightMm}
            includePrice={includePrice}
            isLoading={isLoadingBarcodes}
            error={barcodePreviewError}
          />
        </div>

        <BarcodeLabelActions
          copies={copies}
          canRun={
            Boolean(selectedProduct) &&
            copies >= 1 &&
            copies <= 500 &&
            !isLoadingBarcodes &&
            !barcodeValidationError
          }
          isPrinting={isPrinting}
          isDownloadingPdf={isDownloadingPdf}
          error={actionError}
          message={actionMessage}
          onClose={onClose}
          onPrint={() => void handlePrint()}
          onDownloadPdf={() => void handleDownloadPdf()}
        />
      </div>
    </div>
  )
}

export default BarcodeGeneratorModal
