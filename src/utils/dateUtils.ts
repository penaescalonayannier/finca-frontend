// src/utils/dateUtils.ts

/**
 * Formatea una fecha en formato YYYY-MM-DD a una cadena legible en español
 * @param date - Fecha en formato YYYY-MM-DD
 * @returns Fecha formateada (ej: "1 de julio de 2026")
 */
export const formatDate = (date: string): string => {
  if (!date) return '-'
  
  // Dividir la fecha en partes para evitar problemas de zona horaria
  const partes = date.split('-')
  if (partes.length === 3) {
    const year = parseInt(partes[0])
    const month = parseInt(partes[1]) - 1 // Meses en JS son 0-11
    const day = parseInt(partes[2])
    
    const d = new Date(year, month, day)
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Fallback: intentar con el constructor normal
  try {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return date
  }
}

/**
 * Formatea una fecha en formato corto (ej: "01/07/2026")
 */
export const formatDateShort = (date: string): string => {
  if (!date) return '-'
  
  const partes = date.split('-')
  if (partes.length === 3) {
    const year = parseInt(partes[0])
    const month = parseInt(partes[1]) - 1
    const day = parseInt(partes[2])
    
    const d = new Date(year, month, day)
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }
  
  try {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return date
  }
}