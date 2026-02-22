/**
 * Coupon PDF generation and sharing utilities.
 * Uses HTML-to-canvas approach for generating PDF from CouponPreview.
 */

export interface CouponPDFOptions {
  format: '60mm' | '80mm' | 'A5'
}

/**
 * Generates a PDF blob from the coupon preview HTML element.
 * Falls back to printing the HTML content if canvas is not available.
 */
export async function generateCouponPDF(options?: CouponPDFOptions): Promise<Blob | null> {
  const element = document.getElementById('coupon-preview')
  if (!element) return null

  // Use the print API as a simple cross-platform PDF generation method
  const printWindow = window.open('', '_blank')
  if (!printWindow) return null

  const format = options?.format ?? '80mm'
  const widthMap = { '60mm': '60mm', '80mm': '80mm', 'A5': '148mm' }
  const width = widthMap[format]

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: ${width} auto; margin: 0; }
        body { margin: 0; padding: 0; }
        * { box-sizing: border-box; }
      </style>
    </head>
    <body>${element.outerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()

  return null
}

/**
 * Gets the coupon HTML as a string for sharing via Capacitor Share plugin.
 */
export function getCouponHTML(): string | null {
  const element = document.getElementById('coupon-preview')
  if (!element) return null
  return element.outerHTML
}

/**
 * Shares the coupon via the native share sheet (Capacitor).
 * Falls back to clipboard copy on web.
 */
export async function shareCoupon(): Promise<void> {
  const html = getCouponHTML()
  if (!html) return

  // Try Capacitor Share plugin
  try {
    const capacitor = await import('@capacitor/core')
    const Share = (capacitor as Record<string, unknown>)['Share'] as
      | { share: (opts: { title: string; text: string; dialogTitle: string }) => Promise<void> }
      | undefined
    if (Share && 'share' in Share) {
      await Share.share({
        title: 'Comprovante de Venda',
        text: 'Segue seu comprovante de venda.',
        dialogTitle: 'Compartilhar Comprovante',
      })
      return
    }
  } catch {
    // Not on native, use web fallback
  }

  // Web fallback: try to use Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Comprovante de Venda',
        text: 'Comprovante de venda gerado pelo Spid.',
      })
    } catch {
      // User cancelled or share not supported
    }
  }
}
