// PDF Export Utility
// Location: src/lib/pdf.ts
// Uses html2canvas + jsPDF to convert a DOM element into a downloadable PDF.

'use client';

export async function exportProposalPDF(
  elementId: string,
  filename: string = 'Schmidt-Construction-Proposal.pdf'
): Promise<void> {
  if (typeof window === 'undefined') return;

  // Dynamic imports so the large libraries are code-split and never loaded server-side
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[PDF] Element #${elementId} not found.`);
    return;
  }

  // Temporarily expand the element so html2canvas captures the full height
  const originalOverflow = element.style.overflow;
  element.style.overflow = 'visible';

  try {
    const canvas = await html2canvas(element, {
      scale: 2,           // 2× resolution for sharper text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    element.style.overflow = originalOverflow;

    const imgData = canvas.toDataURL('image/png');

    // A4 dimensions in mm
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10; // mm on each side

    const usableWidth = pageWidth - margin * 2;

    // Scale canvas image to fit the usable width
    const imgWidthMm = usableWidth;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    let yOffset = margin;
    let remainingHeight = imgHeightMm;
    let sourceY = 0; // tracks which portion of the canvas we've already rendered

    while (remainingHeight > 0) {
      // How many mm of image can fit on this page
      const pageContentHeight = pageHeight - margin * 2;
      const sliceHeight = Math.min(remainingHeight, pageContentHeight);

      // Convert mm slice height back to canvas pixels
      const sliceHeightPx = (sliceHeight / imgHeightMm) * canvas.height;

      // Create a temp canvas for just this slice
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;
      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
      }

      const sliceData = sliceCanvas.toDataURL('image/png');
      pdf.addImage(sliceData, 'PNG', margin, yOffset, imgWidthMm, sliceHeight);

      remainingHeight -= sliceHeight;
      sourceY += sliceHeightPx;

      if (remainingHeight > 0) {
        pdf.addPage();
        yOffset = margin;
      }
    }

    pdf.save(filename);
  } catch (err) {
    element.style.overflow = originalOverflow;
    console.error('[PDF] Export failed:', err);
    throw err;
  }
}
