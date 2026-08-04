import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Evaluacion } from '@/types/Evaluacion'

class EvaluacionPDFService {
  generatePDF(evaluacion: Evaluacion) {
    const doc = new jsPDF('p', 'mm', 'letter')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let currentY = 10

    // Encabezado
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('MODELO EVALUACIÓN DEL DESEMPEÑO MENSUAL', pageWidth / 2, currentY, { align: 'center' })
    currentY += 8

    // Grupo
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`Grupo: ${evaluacion.grupoNombre}`, 15, currentY)
    currentY += 8

    // Fecha y Mes
    doc.setFontSize(10)
    doc.text(`FECHA: ${this.formatFecha(evaluacion.fecha)}`, 15, currentY)
    doc.text(`MES: ${evaluacion.mes}`, 120, currentY)
    currentY += 8

    // Línea separadora
    doc.setDrawColor(0, 0, 0)
    doc.line(15, currentY, pageWidth - 15, currentY)
    currentY += 5

    // Tabla de evaluaciones con encabezado agrupado y colspan
    const tableData = evaluacion.trabajadores?.map((trab, index) => [
      (index + 1).toString(),
      trab.trabajadorNombre,
      trab.evaluacion === 'superior' ? 'X' : '',
      trab.evaluacion === 'acuado' ? 'X' : '',
      trab.evaluacion === 'deficiente' ? 'X' : '',
      trab.firma || ''
    ]) || []

    // Encabezado con colspan y rowSpan para agrupar "Evaluación"
    const headRow1 = [
      { content: 'No', rowSpan: 2 },
      { content: 'Nombre y Apellidos', rowSpan: 2 },
      { content: 'Evaluación', colSpan: 3 },
      { content: 'Firma', rowSpan: 2 }
    ]

    const headRow2 = [
      { content: 'Superior' },
      { content: 'Acuado' },
      { content: 'Deficiente' }
    ]

    autoTable(doc, {
      head: [headRow1, headRow2] as any,
      body: tableData,
      startY: currentY,
      margin: { left: 15, right: 15 },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        halign: 'center' as const,
        valign: 'middle' as const
      } as any,
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: [255, 255, 255],
        fontStyle: 'bold' as const,
        halign: 'center' as const
      } as any,
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      } as any,
      columnStyles: {
        0: { halign: 'center' as const, cellWidth: 12 },
        1: { halign: 'left' as const, cellWidth: 70 },
        2: { halign: 'center' as const, cellWidth: 20 },
        3: { halign: 'center' as const, cellWidth: 20 },
        4: { halign: 'center' as const, cellWidth: 25 },
        5: { halign: 'center' as const, cellWidth: 30 }
      } as any
    })

    // Posición después de la tabla
    const lastTable = (doc as any).lastAutoTable
    if (lastTable) {
      currentY = lastTable.finalY + 10
    }

    // Verificar si cabe en la página, si no, nueva página
    if (currentY > pageHeight - 40) {
      doc.addPage()
      currentY = 10
    }

    // Sección Jefe del Área
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Jefe de Área:', 15, currentY)
    currentY += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`${evaluacion.jefeNombre || 'Sin asignar'}`, 15, currentY)
    currentY += 8

    // Firma del jefe
    doc.setFont('helvetica', 'bold')
    doc.text('Firma del Jefe:', 15, currentY)
    currentY += 6

    // Línea para firma
    doc.setDrawColor(0, 0, 0)
    doc.line(15, currentY, 70, currentY)

    if (evaluacion.firmaJefe) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(evaluacion.firmaJefe, 20, currentY - 2)
    }

    currentY += 10

    // Fecha de generación
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, pageWidth - 15, pageHeight - 10, { align: 'right' })

    // Descargar PDF
    const filename = `Evaluacion_${evaluacion.grupoNombre}_${evaluacion.mes}.pdf`
    doc.save(filename)
  }

  private formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES')
  }
}

export default new EvaluacionPDFService()
