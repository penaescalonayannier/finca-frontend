<template>
  <div class="deuda-container">
    <div class="header-section">
      <h1 class="main-title">
        <span class="icon">💰</span>
        Control de Deudas de Trabajadores
      </h1>
      <p class="subtitle">Seguimiento y auditoria de deudas por compras en la finca</p>
    </div>

    <div class="stats-cards">
      <div class="stat-card total">
        <div class="stat-icon">📊</div>
        <div class="stat-info">
          <span class="stat-value">{{ formatCurrency(totalDeudaGeneral) }}</span>
          <span class="stat-label">Deuda Total</span>
        </div>
      </div>
      <div class="stat-card workers">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <span class="stat-value">{{ deudas.length }}</span>
          <span class="stat-label">Trabajadores con Deuda</span>
        </div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          placeholder="Buscar por nombre de trabajador..."
          class="search-input"
          @keyup.enter="buscarConReset"
        />
      </div>
      <button @click="buscarConReset" class="btn-primary">
        <span>Buscar</span>
      </button>
      <button @click="descargarPdfListaDeudas" class="btn-pdf" :disabled="deudas.length === 0">
        <span class="pdf-icon">📄</span>
        <span>Descargar PDF</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>Cargando deudas...</span>
    </div>

    <div v-else-if="deudas.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No hay deudas registradas</h3>
      <p>Los trabajadores no tienen deudas pendientes</p>
    </div>

    <div v-else class="deudas-grid">
      <div
        v-for="deuda in deudas"
        :key="deuda.id"
        class="deuda-card"
        :class="{ 'expanded': expandedDeuda === deuda.id }"
      >
        <div class="card-header" @click="toggleDetalles(deuda)">
          <div class="worker-info">
            <div class="avatar">{{ getInitials(deuda.trabajadorNombre || '') }}</div>
            <div class="worker-details">
              <h3 class="worker-name">{{ deuda.trabajadorNombre }}</h3>
              <span class="worker-ruc">RUC: {{ deuda.trabajadorRuc }}</span>
            </div>
          </div>
          <div class="debt-amount">
            <span class="amount">{{ formatCurrency(deuda.importe) }}</span>
            <span class="label">Deuda Total</span>
          </div>
          <button
            v-if="deuda.importe > 0"
            @click.stop="abrirModalPago(deuda)"
            class="btn-pago"
          >
            💵 Registrar Pago
          </button>
          <div class="expand-icon" :class="{ 'rotated': expandedDeuda === deuda.id }">
            ▼
          </div>
        </div>

        <transition name="slide">
          <div v-if="expandedDeuda === deuda.id" class="card-body">
            <div v-if="loadingDetalles" class="loading-detalles">
              <div class="mini-spinner"></div>
              <span>Cargando historial...</span>
            </div>

            <div v-else-if="detalles.length === 0" class="no-detalles">
              <span>No hay registros de compras</span>
            </div>

            <div v-else class="detalles-container">
              <div class="detalles-header">
                <h4 class="detalles-title">
                  <span class="icon">📜</span>
                  Historial de Movimientos
                </h4>
                <button
                  @click.stop="descargarPdfHistorial(deudas.find(d => d.id === expandedDeuda)!)"
                  class="btn-pdf-small"
                >
                  <span class="pdf-icon">📄</span>
                  Descargar PDF
                </button>
              </div>

              <div class="timeline">
                <div
                  v-for="detalle in detalles"
                  :key="detalle.id"
                  class="timeline-item"
                  :class="{ 'timeline-item-pago': detalle.tipoMovimiento === 'PAGO' }"
                >
                  <!-- Marcador para PAGO -->
                  <div v-if="detalle.tipoMovimiento === 'PAGO'" class="timeline-marker pago"></div>
                  <!-- Marcador para COMPRA -->
                  <div v-else class="timeline-marker" :class="detalle.salidaTipo?.toLowerCase()"></div>

                  <div class="timeline-content" :class="{ 'timeline-content-pago': detalle.tipoMovimiento === 'PAGO' }">
                    <!-- Header para PAGO -->
                    <div v-if="detalle.tipoMovimiento === 'PAGO'" class="timeline-header">
                      <span class="badge pago">💵 PAGO</span>
                      <span class="badge-forma-pago" :class="detalle.formaPago?.toLowerCase()">
                        {{ detalle.formaPago === 'EFECTIVO' ? '💵 Efectivo' : '🏦 Transferencia' }}
                      </span>
                      <span class="fecha">{{ formatDate(detalle.fecha) }}</span>
                    </div>
                    <!-- Header para COMPRA -->
                    <div v-else class="timeline-header">
                      <span class="badge" :class="detalle.salidaTipo?.toLowerCase()">
                        {{ detalle.salidaTipo }}
                      </span>
                      <span class="doc-number">{{ detalle.salidaNumero }}</span>
                      <span v-if="detalle.pagado" class="badge-pagado">PAGADO</span>
                      <span v-else class="badge-pendiente">PENDIENTE</span>
                      <span class="fecha">{{ formatDate(detalle.fecha) }}</span>
                    </div>

                    <!-- Body para PAGO -->
                    <div v-if="detalle.tipoMovimiento === 'PAGO'" class="timeline-body pago-body">
                      <div class="pago-info">
                        <span class="pago-label">Abono a deuda</span>
                        <span v-if="detalle.referenciaBancaria" class="referencia">
                          Ref: {{ detalle.referenciaBancaria }}
                        </span>
                      </div>
                      <div class="valores">
                        <div class="valor-item importe pago-importe">
                          <span class="label">Monto</span>
                          <span class="value">-{{ formatCurrency(detalle.importe) }}</span>
                        </div>
                      </div>
                    </div>
                    <!-- Body para COMPRA -->
                    <div v-else class="timeline-body">
                      <div class="producto-info">
                        <span class="producto-codigo">{{ detalle.productoCodigo }}</span>
                        <span class="producto-nombre">{{ detalle.productoNombre }}</span>
                      </div>
                      <div class="valores">
                        <div class="valor-item">
                          <span class="label">Cantidad</span>
                          <span class="value">{{ detalle.cantidad }}</span>
                        </div>
                        <div class="valor-item">
                          <span class="label">Precio Unit.</span>
                          <span class="value">{{ formatCurrency(detalle.precioUnitario) }}</span>
                        </div>
                        <div class="valor-item importe">
                          <span class="label">Importe</span>
                          <span class="value">{{ formatCurrency(detalle.importe) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="resumen-detalles">
                <div class="resumen-row">
                  <span>Total de transacciones:</span>
                  <strong>{{ detalles.length }}</strong>
                </div>
                <div class="resumen-row total">
                  <span>Suma de compras:</span>
                  <strong>{{ formatCurrency(sumaDetalles) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="!isLoading && deudas.length > 0" class="pagination-section">
      <div class="pagination-info">
        <span>Mostrando {{ deudas.length }} de {{ totalElementos }} trabajadores</span>
      </div>
      <div class="pagination-controls">
        <button
          class="btn-pag"
          :disabled="paginaActual === 0"
          @click="cambiarPagina(paginaActual - 1)"
        >
          ← Anterior
        </button>
        <span class="page-number">{{ paginaActual + 1 }} / {{ totalPaginas || 1 }}</span>
        <button
          class="btn-pag"
          :disabled="paginaActual >= totalPaginas - 1"
          @click="cambiarPagina(paginaActual + 1)"
        >
          Siguiente →
        </button>
      </div>
    </div>

    <!-- Modal de Pago -->
    <div v-if="showModalPago" class="modal-overlay" @click.self="cerrarModalPago">
      <div class="modal-content">
        <div class="modal-header">
          <h3>💵 Registrar Pago</h3>
          <button class="btn-close" @click="cerrarModalPago">✕</button>
        </div>

        <div class="modal-body">
          <div class="trabajador-info-modal">
            <div class="avatar-modal">{{ getInitials(deudaSeleccionada?.trabajadorNombre || '') }}</div>
            <div>
              <strong>{{ deudaSeleccionada?.trabajadorNombre }}</strong>
              <span class="deuda-actual">Deuda actual: {{ formatCurrency(deudaSeleccionada?.importe || 0) }}</span>
            </div>
          </div>

          <div class="form-group">
            <label>Monto a pagar *</label>
            <input
              v-model.number="formPago.monto"
              type="number"
              step="0.01"
              min="0.01"
              :max="deudaSeleccionada?.importe"
              class="form-input"
              placeholder="0.00"
            />
            <small v-if="formPago.monto > (deudaSeleccionada?.importe || 0)" class="error-text">
              El monto no puede ser mayor a la deuda actual
            </small>
          </div>

          <div class="form-group">
            <label>Forma de Pago *</label>
            <div class="radio-group">
              <label class="radio-option">
                <input type="radio" v-model="formPago.formaPago" value="EFECTIVO" />
                <span class="radio-label">💵 Efectivo</span>
              </label>
              <label class="radio-option">
                <input type="radio" v-model="formPago.formaPago" value="TRANSFERENCIA" />
                <span class="radio-label">🏦 Transferencia</span>
              </label>
            </div>
          </div>

          <div v-if="formPago.formaPago === 'TRANSFERENCIA'" class="form-group">
            <label>Referencia Bancaria *</label>
            <input
              v-model="formPago.referenciaBancaria"
              type="text"
              class="form-input"
              placeholder="Número de referencia o confirmación"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancelar" @click="cerrarModalPago">Cancelar</button>
          <button
            class="btn-confirmar"
            @click="confirmarPago"
            :disabled="!puedeConfirmarPago || guardandoPago"
          >
            <span v-if="guardandoPago">Procesando...</span>
            <span v-else>Confirmar Pago</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DeudaTrabajadorService from '@/services/DeudaTrabajadorService'
import type { DeudaTrabajador, DeudaTrabajadorDetalle, FormaPago, RegistrarPagoRequest } from '@/types/DeudaTrabajador'
import type { SearchFilter } from '@/types/EstadoCuenta'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const deudas = ref<DeudaTrabajador[]>([])
const detalles = ref<DeudaTrabajadorDetalle[]>([])
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(20)
const totalElementos = ref(0)
const isLoading = ref(false)
const loadingDetalles = ref(false)
const expandedDeuda = ref<string | null>(null)

// Modal de pago
const showModalPago = ref(false)
const deudaSeleccionada = ref<DeudaTrabajador | null>(null)
const guardandoPago = ref(false)
const formPago = ref<{
  monto: number
  formaPago: FormaPago
  referenciaBancaria: string
}>({
  monto: 0,
  formaPago: 'EFECTIVO',
  referenciaBancaria: ''
})

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const totalDeudaGeneral = computed(() => {
  return deudas.value.reduce((sum, d) => sum + (d.importe || 0), 0)
})

const sumaDetalles = computed(() => {
  return detalles.value.reduce((sum, d) => sum + (d.importe || 0), 0)
})

const puedeConfirmarPago = computed(() => {
  if (!formPago.value.monto || formPago.value.monto <= 0) return false
  if (formPago.value.monto > (deudaSeleccionada.value?.importe || 0)) return false
  if (!formPago.value.formaPago) return false
  if (formPago.value.formaPago === 'TRANSFERENCIA' && !formPago.value.referenciaBancaria.trim()) return false
  return true
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
  }).format(value || 0)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()
}

const cargarDeudas = async () => {
  isLoading.value = true
  deudas.value = []
  try {
    const filters: SearchFilter[] = []

    // Agregar filtros de búsqueda por texto (buscar por nombre del trabajador)
    if (searchQuery.value.trim()) {
      filters.push({
        key: 'trabajador.nombre',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'trabajador.ruc',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
    }

    const response = await DeudaTrabajadorService.buscar({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
      filter: filters,
    })

    const data = response.data as Record<string, unknown>

    if (data.content) {
      deudas.value = (data.content as DeudaTrabajador[]) || []
      totalElementos.value = (data.totalElements as number) || deudas.value.length
    } else if (data.data) {
      deudas.value = (data.data as DeudaTrabajador[]) || []
      totalElementos.value = (data.total as number) || deudas.value.length
    }
  } catch (error) {
    console.error('Error al cargar deudas:', error)
  } finally {
    isLoading.value = false
  }
}

const toggleDetalles = async (deuda: DeudaTrabajador) => {
  if (expandedDeuda.value === deuda.id) {
    expandedDeuda.value = null
    detalles.value = []
    return
  }

  expandedDeuda.value = deuda.id || null
  loadingDetalles.value = true
  detalles.value = []

  try {
    if (deuda.trabajadorId) {
      const response = await DeudaTrabajadorService.obtenerDetalles(deuda.trabajadorId)
      detalles.value = response.data || []
    }
  } catch (error) {
    console.error('Error al cargar detalles:', error)
  } finally {
    loadingDetalles.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarDeudas()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarDeudas()
  }
}

const abrirModalPago = (deuda: DeudaTrabajador) => {
  deudaSeleccionada.value = deuda
  formPago.value = {
    monto: deuda.importe,
    formaPago: 'EFECTIVO',
    referenciaBancaria: ''
  }
  showModalPago.value = true
}

const cerrarModalPago = () => {
  showModalPago.value = false
  deudaSeleccionada.value = null
  formPago.value = {
    monto: 0,
    formaPago: 'EFECTIVO',
    referenciaBancaria: ''
  }
}

const confirmarPago = async () => {
  if (!puedeConfirmarPago.value || !deudaSeleccionada.value) return

  guardandoPago.value = true
  const trabajadorId = deudaSeleccionada.value.trabajadorId
  const deudaId = deudaSeleccionada.value.id

  try {
    const request: RegistrarPagoRequest = {
      trabajadorId: trabajadorId,
      monto: formPago.value.monto,
      formaPago: formPago.value.formaPago,
      referenciaBancaria: formPago.value.formaPago === 'TRANSFERENCIA' ? formPago.value.referenciaBancaria : undefined
    }

    await DeudaTrabajadorService.registrarPago(request)
    cerrarModalPago()
    await cargarDeudas()

    // Si el trabajador estaba expandido, recargar sus detalles
    if (deudaId) {
      expandedDeuda.value = deudaId
      loadingDetalles.value = true
      try {
        const response = await DeudaTrabajadorService.obtenerDetalles(trabajadorId)
        detalles.value = response.data || []
      } catch (err) {
        console.error('Error al recargar detalles:', err)
      } finally {
        loadingDetalles.value = false
      }
    }
  } catch (error) {
    console.error('Error al registrar pago:', error)
    alert('Error al registrar el pago. Por favor intente nuevamente.')
  } finally {
    guardandoPago.value = false
  }
}

onMounted(() => {
  cargarDeudas()
})

const descargarPdfListaDeudas = () => {
  const doc = new jsPDF()
  const fechaActual = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  // Titulo
  doc.setFontSize(18)
  doc.setTextColor(26, 26, 46)
  doc.text('Control de Deudas de Trabajadores', 105, 20, { align: 'center' })

  // Subtitulo con fecha
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Fecha de generación: ${fechaActual}`, 105, 28, { align: 'center' })

  // Resumen
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text(`Total de trabajadores: ${deudas.value.length}`, 14, 40)
  doc.text(`Deuda total: ${formatCurrency(totalDeudaGeneral.value)}`, 14, 48)

  // Tabla
  const tableData = deudas.value.map((deuda, index) => [
    index + 1,
    deuda.trabajadorNombre || 'N/A',
    deuda.trabajadorRuc || 'N/A',
    formatCurrency(deuda.importe)
  ])

  autoTable(doc, {
    startY: 55,
    head: [['#', 'Trabajador', 'RUC', 'Deuda']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 80 },
      2: { cellWidth: 40 },
      3: { halign: 'right', cellWidth: 40 }
    },
    foot: [['', '', 'TOTAL:', formatCurrency(totalDeudaGeneral.value)]],
    footStyles: {
      fillColor: [245, 87, 108],
      textColor: 255,
      fontStyle: 'bold'
    }
  })

  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Página ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' })
    doc.text('Sistema de Gestión de Finca', 14, doc.internal.pageSize.height - 10)
  }

  doc.save(`Deudas_Trabajadores_${new Date().toISOString().split('T')[0]}.pdf`)
}

const descargarPdfHistorial = (deuda: DeudaTrabajador) => {
  if (!deuda || detalles.value.length === 0) return

  const doc = new jsPDF()
  const fechaActual = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  // Titulo
  doc.setFontSize(18)
  doc.setTextColor(26, 26, 46)
  doc.text('Historial de Compras', 105, 20, { align: 'center' })

  // Datos del trabajador
  doc.setFontSize(12)
  doc.setTextColor(50, 50, 50)
  doc.text(`Trabajador: ${deuda.trabajadorNombre || 'N/A'}`, 14, 35)
  doc.text(`RUC: ${deuda.trabajadorRuc || 'N/A'}`, 14, 43)
  doc.text(`Deuda actual: ${formatCurrency(deuda.importe)}`, 14, 51)

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Fecha de generación: ${fechaActual}`, 14, 59)

  // Tabla de detalles
  const tableData = detalles.value.map((detalle, index) => [
    index + 1,
    detalle.salidaNumero,
    `${detalle.productoCodigo} - ${detalle.productoNombre}`,
    detalle.cantidad.toString(),
    formatCurrency(detalle.precioUnitario),
    formatCurrency(detalle.importe),
    detalle.pagado ? 'PAGADO' : 'PEND.',
    formatDate(detalle.fecha).split(',')[0]
  ])

  autoTable(doc, {
    startY: 65,
    head: [['#', 'Número', 'Producto', 'Cant.', 'P. Unit.', 'Importe', 'Estado', 'Fecha']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 6
    },
    styles: {
      fontSize: 6,
      cellPadding: 2
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 55 },
      3: { halign: 'center', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 18 },
      7: { cellWidth: 22 }
    },
    foot: [['', '', '', '', 'TOTAL:', formatCurrency(sumaDetalles.value), '', '']],
    footStyles: {
      fillColor: [245, 87, 108],
      textColor: 255,
      fontStyle: 'bold'
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const value = data.cell.raw as string
        if (value === 'PAGADO') {
          data.cell.styles.textColor = [46, 125, 50]
          data.cell.styles.fontStyle = 'bold'
        } else {
          data.cell.styles.textColor = [230, 81, 0]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    }
  })

  // Resumen
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 150
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)
  doc.text(`Total de transacciones: ${detalles.value.length}`, 14, finalY + 15)

  const pagados = detalles.value.filter(d => d.pagado).length
  const pendientes = detalles.value.filter(d => !d.pagado).length
  doc.text(`Pagados: ${pagados} | Pendientes: ${pendientes}`, 14, finalY + 23)

  // Pie de página
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Página ${i} de ${pageCount}`, 105, doc.internal.pageSize.height - 10, { align: 'center' })
    doc.text('Sistema de Gestión de Finca', 14, doc.internal.pageSize.height - 10)
  }

  const nombreArchivo = (deuda.trabajadorNombre || 'trabajador').replace(/\s+/g, '_')
  doc.save(`Historial_${nombreArchivo}_${new Date().toISOString().split('T')[0]}.pdf`)
}
</script>

<style scoped>
.deuda-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* Header */
.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.main-title {
  font-size: 2em;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.main-title .icon {
  font-size: 1.2em;
}

.subtitle {
  color: #666;
  margin-top: 8px;
  font-size: 1.1em;
}

/* Stats Cards */
.stats-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  min-width: 250px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.stat-card.total {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.3);
}

.stat-card.workers {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  box-shadow: 0 10px 30px rgba(79, 172, 254, 0.3);
}

.stat-icon {
  font-size: 2.5em;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.8em;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.9;
}

/* Search Section */
.search-section {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 50px;
  padding: 5px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  flex: 1;
  max-width: 500px;
}

.search-icon {
  font-size: 1.2em;
  margin-right: 10px;
}

.search-input {
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 1em;
  flex: 1;
  background: transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 50px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-pdf {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 50px;
  font-size: 0.95em;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-pdf:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
}

.btn-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-pdf .pdf-icon {
  font-size: 1.1em;
}

/* Loading & Empty States */
.loading-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0;
  color: #333;
}

/* Deudas Grid */
.deudas-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.deuda-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.deuda-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.deuda-card.expanded {
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 20px 25px;
  cursor: pointer;
  transition: background 0.2s;
}

.card-header:hover {
  background: #f8f9ff;
}

.worker-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1em;
}

.worker-details {
  display: flex;
  flex-direction: column;
}

.worker-name {
  margin: 0;
  font-size: 1.1em;
  color: #1a1a2e;
}

.worker-ruc {
  color: #888;
  font-size: 0.9em;
}

.debt-amount {
  text-align: right;
  margin-right: 20px;
}

.debt-amount .amount {
  display: block;
  font-size: 1.4em;
  font-weight: 700;
  color: #f5576c;
}

.debt-amount .label {
  font-size: 0.85em;
  color: #888;
}

.btn-pago {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-right: 15px;
}

.btn-pago:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4);
}

.expand-icon {
  font-size: 0.8em;
  color: #667eea;
  transition: transform 0.3s;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

/* Card Body / Detalles */
.card-body {
  border-top: 1px solid #eee;
  padding: 25px;
  background: #fafbff;
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0 25px;
}

.loading-detalles, .no-detalles {
  text-align: center;
  padding: 30px;
  color: #888;
}

.mini-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.detalles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.detalles-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  color: #1a1a2e;
  font-size: 1.1em;
}

.btn-pdf-small {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-pdf-small:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4);
}

.btn-pdf-small .pdf-icon {
  font-size: 1em;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: -26px;
  top: 5px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.timeline-marker.vale {
  background: #4facfe;
}

.timeline-marker.factura {
  background: #f5576c;
}

.timeline-marker.pago {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  width: 18px;
  height: 18px;
  left: -28px;
}

.timeline-content {
  background: white;
  border-radius: 12px;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.vale {
  background: #e3f2fd;
  color: #1976d2;
}

.badge.factura {
  background: #fce4ec;
  color: #c2185b;
}

.badge.pago {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.badge-forma-pago {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 600;
}

.badge-forma-pago.efectivo {
  background: #fff8e1;
  color: #f57f17;
}

.badge-forma-pago.transferencia {
  background: #e3f2fd;
  color: #1565c0;
}

.badge-pagado {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7em;
  font-weight: 700;
  background: #e8f5e9;
  color: #2e7d32;
  text-transform: uppercase;
}

.badge-pendiente {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.7em;
  font-weight: 700;
  background: #fff3e0;
  color: #e65100;
  text-transform: uppercase;
}

.doc-number {
  font-weight: 600;
  color: #333;
}

.fecha {
  color: #888;
  font-size: 0.9em;
  margin-left: auto;
}

.timeline-body {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.producto-info {
  flex: 1;
  min-width: 200px;
}

.producto-codigo {
  display: inline-block;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  color: #666;
  margin-right: 8px;
}

.producto-nombre {
  color: #333;
  font-weight: 500;
}

.valores {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.valor-item {
  text-align: center;
}

.valor-item .label {
  display: block;
  font-size: 0.75em;
  color: #888;
  text-transform: uppercase;
}

.valor-item .value {
  font-weight: 600;
  color: #333;
}

.valor-item.importe .value {
  color: #f5576c;
  font-size: 1.1em;
}

.valor-item.pago-importe .value {
  color: #11998e;
  font-size: 1.2em;
  font-weight: 700;
}

.timeline-content-pago {
  background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
  border-left: 3px solid #11998e;
}

.pago-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pago-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pago-label {
  font-weight: 600;
  color: #11998e;
  font-size: 1em;
}

.referencia {
  font-size: 0.85em;
  color: #666;
  background: rgba(17, 153, 142, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.timeline-item-pago {
  position: relative;
}

/* Resumen */
.resumen-detalles {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px dashed #ddd;
}

.resumen-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  color: #666;
}

.resumen-row.total {
  font-size: 1.1em;
  color: #333;
  padding-top: 10px;
}

.resumen-row.total strong {
  color: #f5576c;
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-pag {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pag:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.btn-pag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  font-weight: 600;
  color: #333;
}

/* Responsive */
@media (max-width: 768px) {
  .main-title {
    font-size: 1.5em;
  }

  .stats-cards {
    flex-direction: column;
    align-items: stretch;
  }

  .stat-card {
    min-width: auto;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 15px;
  }

  .debt-amount {
    margin-right: 0;
    text-align: left;
  }

  .timeline-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .valores {
    width: 100%;
    justify-content: space-between;
  }

  .fecha {
    margin-left: 0;
    width: 100%;
  }
}

/* Modal de Pago */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3em;
  color: #1a1a2e;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.3em;
  cursor: pointer;
  color: #888;
  padding: 5px;
  line-height: 1;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #f5576c;
}

.modal-body {
  padding: 25px;
}

.trabajador-info-modal {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9ff;
  border-radius: 12px;
  margin-bottom: 25px;
}

.avatar-modal {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1em;
}

.trabajador-info-modal strong {
  display: block;
  color: #1a1a2e;
  font-size: 1.1em;
}

.deuda-actual {
  display: block;
  color: #f5576c;
  font-size: 0.9em;
  font-weight: 600;
  margin-top: 3px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
}

.form-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1em;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.error-text {
  display: block;
  color: #f5576c;
  font-size: 0.85em;
  margin-top: 5px;
}

.radio-group {
  display: flex;
  gap: 15px;
}

.radio-option {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:has(input:checked) {
  border-color: #667eea;
  background: #f8f9ff;
}

.radio-option input {
  margin-right: 10px;
  accent-color: #667eea;
}

.radio-label {
  font-weight: 500;
  color: #333;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 25px;
  border-top: 1px solid #eee;
  background: #fafbff;
  border-radius: 0 0 20px 20px;
}

.btn-cancelar {
  padding: 12px 25px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.btn-cancelar:hover {
  border-color: #f5576c;
  color: #f5576c;
}

.btn-confirmar {
  padding: 12px 30px;
  border: none;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirmar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4);
}

.btn-confirmar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>
