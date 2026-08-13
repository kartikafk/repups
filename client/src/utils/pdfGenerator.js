import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePosturePDF = async (elementRef, userName) => {
  if (!elementRef.current) return;

  try {
    const canvas = await html2canvas(elementRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Scale factor from canvas pixels -> mm on the PDF page
    const pxToMm = pdfWidth / canvas.width;
    const pageHeightInCanvasPx = pdfHeight / pxToMm;

    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvas.height) {
      const sliceHeight = Math.min(pageHeightInCanvasPx, canvas.height - renderedHeight);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const pageCtx = pageCanvas.getContext('2d');
      pageCtx.fillStyle = '#ffffff';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0, renderedHeight, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight
      );

      const imgData = pageCanvas.toDataURL('image/png');

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, sliceHeight * pxToMm);

      renderedHeight += sliceHeight;
      pageIndex += 1;
    }

    pdf.save(`RepUps_Posture_Report_${userName || 'Athlete'}.pdf`);
    return true;
  } catch (error) {
    // avoid logging full error stack in client console in production
    console.error('PDF Generation Failed');
    return false;
  }
};
