<template>
  <div class="historial-container">
    <div class="header-section">
      <h1 class="main-title">
        <span class="icon">📜</span>
        Historial de Movimientos
      </h1>
      <p class="subtitle">Registro completo de compras y pagos de todos los trabajadores</p>
    </div>

    <div class="stats-cards">
      <div class="stat-card compras">
        <div class="stat-icon">🛒</div>
        <div class="stat-info">
          <span class="stat-value">{{ totalCompras }}</span>
          <span class="stat-label">Compras</span>
        </div>
      </div>
      <div class="stat-card pagos">
        <div class="stat-icon">💵</div>
        <div class="stat-info">
          <span class="stat-value">{{ totalPagos }}</span>
          <span class="stat-label">Pagos</span>
        </div>
      </div>
    </div>

    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>Tipo de Movimiento</label>
          <select v-model="filtroTipo" @change="buscarConReset" class="filter-select">
            <option value="">Todos</option>
            <option value="COMPRA">Compras</option>
            <option value="PAGO">Pagos</option>
          </select>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            placeholder="Buscar por trabajador..."
            class="search-input"
            @keyup.enter="buscarConReset"
          />
        </div>
        <button @click="buscarConReset" class="btn-primary">Buscar</button>
        <button @click="descargarPdf" class="btn-pdf" :disabled="movimientos.length === 0">
          <span class="pdf-icon">📄</span>
          Descargar PDF
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>Cargando historial...</span>
    </div>

    <div v-else-if="movimientos.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No hay movimientos registrados</h3>
      <p>No se encontraron registros con los filtros aplicados</p>
    </div>

    <div v-else class="movimientos-table-container">
      <table class="movimientos-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Trabajador</th>
            <th>Detalle</th>
            <th>Cantidad</th>
            <th>P. Unit.</th>
            <th>Importe</th>
            <th>Estado</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mov in movimientos" :key="mov.id" :class="{ 'row-pago': mov.tipoMovimiento === 'PAGO' }">
            <td>
              <span class="badge-tipo" :class="mov.tipoMovimiento?.toLowerCase() || 'compra'">
                {{ mov.tipoMovimiento === 'PAGO' ? '💵 PAGO' : '🛒 COMPRA' }}
              </span>
            </td>
            <td>
              <div class="trabajador-cell">
                <div class="avatar-small">{{ getInitials(mov.trabajadorNombre || '') }}</div>
                <div>
                  <span class="nombre">{{ mov.trabajadorNombre }}</span>
                  <span class="ruc">{{ mov.trabajadorRuc }}</span>
                </div>
              </div>
            </td>
            <td>
              <div v-if="mov.tipoMovimiento === 'PAGO'" class="detalle-pago">
                <span class="pago-label">Abono a deuda</span>
                <span v-if="mov.formaPago" class="forma-pago" :class="mov.formaPago?.toLowerCase()">
                  {{ mov.formaPago === 'EFECTIVO' ? '💵 Efectivo' : '🏦 Transferencia' }}
                </span>
                <span v-if="mov.referenciaBancaria" class="referencia">Ref: {{ mov.referenciaBancaria }}</span>
              </div>
              <div v-else class="detalle-compra">
                <span class="doc-tipo" :class="mov.salidaTipo?.toLowerCase()">{{ mov.salidaTipo }}</span>
                <span class="doc-numero">{{ mov.salidaNumero }}</span>
                <span class="producto">{{ mov.productoCodigo }} - {{ mov.productoNombre }}</span>
              </div>
            </td>
            <td class="text-center">{{ mov.tipoMovimiento === 'PAGO' ? '-' : mov.cantidad }}</td>
            <td class="text-right">{{ mov.tipoMovimiento === 'PAGO' ? '-' : formatCurrency(mov.precioUnitario) }}</td>
            <td class="text-right">
              <span :class="mov.tipoMovimiento === 'PAGO' ? 'importe-pago' : 'importe-compra'">
                {{ mov.tipoMovimiento === 'PAGO' ? '-' : '' }}{{ formatCurrency(mov.importe) }}
              </span>
            </td>
            <td>
              <span v-if="mov.tipoMovimiento === 'PAGO'" class="badge-estado pago">PAGO</span>
              <span v-else class="badge-estado compra">COMPRA</span>
            </td>
            <td class="fecha-cell">{{ formatDate(mov.fecha) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!isLoading && movimientos.length > 0" class="pagination-section">
      <div class="pagination-info">
        <span>Mostrando {{ movimientos.length }} de {{ totalElementos }} registros</span>
      </div>
      <div class="pagination-controls">
        <button class="btn-pag" :disabled="paginaActual === 0" @click="cambiarPagina(paginaActual - 1)">
          ← Anterior
        </button>
        <span class="page-number">{{ paginaActual + 1 }} / {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1" @click="cambiarPagina(paginaActual + 1)">
          Siguiente →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DeudaTrabajadorService from '@/services/DeudaTrabajadorService'
import type { DeudaTrabajadorDetalle } from '@/types/DeudaTrabajador'
import type { SearchFilter } from '@/types/EstadoCuenta'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const movimientos = ref<DeudaTrabajadorDetalle[]>([])
const searchQuery = ref('')
const filtroTipo = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(20)
const totalElementos = ref(0)
const isLoading = ref(false)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const totalCompras = computed(() => movimientos.value.filter(m => m.tipoMovimiento !== 'PAGO').length)
const totalPagos = computed(() => movimientos.value.filter(m => m.tipoMovimiento === 'PAGO').length)

const formatCurrency = (value?: number) => {
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

const cargarMovimientos = async () => {
  isLoading.value = true
  movimientos.value = []
  try {
    const filters: SearchFilter[] = []

    // Agregar filtros de búsqueda por texto
    if (searchQuery.value.trim()) {
      filters.push({
        key: 'trabajador.nombre',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'productoNombre',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'salidaNumero',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
    }

    if (filtroTipo.value) {
      filters.push({
        key: 'tipoMovimiento',
        operator: 'EQUALS',
        value: filtroTipo.value,
        logicalOperation: 'AND'
      })
    }

    // Solo mostrar activos
    filters.push({
      key: 'activo',
      operator: 'IS_TRUE',
      value: 'true',
      logicalOperation: 'AND'
    })

    const response = await DeudaTrabajadorService.buscarHistorial({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
      filter: filters,
      sortBy: 'fecha',
      sortType: 'DES'
    })

    const data = response.data as Record<string, unknown>

    if (data.content) {
      movimientos.value = (data.content as DeudaTrabajadorDetalle[]) || []
      totalElementos.value = (data.totalElements as number) || movimientos.value.length
    } else if (data.data) {
      movimientos.value = (data.data as DeudaTrabajadorDetalle[]) || []
      totalElementos.value = (data.total as number) || movimientos.value.length
    }
  } catch (error) {
    console.error('Error al cargar historial:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarMovimientos()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarMovimientos()
  }
}

const descargarPdf = () => {
  const doc = new jsPDF('landscape')
  const fechaActual = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  doc.setFontSize(18)
  doc.setTextColor(26, 26, 46)
  doc.text('Historial de Movimientos', 148, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Fecha de generación: ${fechaActual}`, 148, 22, { align: 'center' })

  const tableData = movimientos.value.map((mov) => [
    mov.tipoMovimiento === 'PAGO' ? 'PAGO' : 'COMPRA',
    mov.trabajadorNombre || 'N/A',
    mov.tipoMovimiento === 'PAGO'
      ? `Abono - ${mov.formaPago || ''}`
      : `${mov.salidaTipo || ''} ${mov.salidaNumero || ''} - ${mov.productoNombre || ''}`,
    mov.tipoMovimiento === 'PAGO' ? '-' : (mov.cantidad?.toString() || ''),
    mov.tipoMovimiento === 'PAGO' ? '-' : formatCurrency(mov.precioUnitario),
    (mov.tipoMovimiento === 'PAGO' ? '-' : '') + formatCurrency(mov.importe),
    mov.tipoMovimiento === 'PAGO' ? 'PAGO' : 'COMPRA',
    formatDate(mov.fecha).split(',')[0]
  ])

  autoTable(doc, {
    startY: 28,
    head: [['Tipo', 'Trabajador', 'Detalle', 'Cant.', 'P. Unit.', 'Importe', 'Estado', 'Fecha']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 7,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 40 },
      2: { cellWidth: 70 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'center', cellWidth: 22 },
      7: { cellWidth: 30 }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        if (data.column.index === 0) {
          const value = data.cell.raw as string
          if (value === 'PAGO') {
            data.cell.styles.textColor = [17, 153, 142]
            data.cell.styles.fontStyle = 'bold'
          }
        }
        if (data.column.index === 5) {
          const value = data.cell.raw as string
          if (value.startsWith('-')) {
            data.cell.styles.textColor = [17, 153, 142]
          } else {
            data.cell.styles.textColor = [245, 87, 108]
          }
        }
        if (data.column.index === 6) {
          const value = data.cell.raw as string
          if (value === 'PAGO') {
            data.cell.styles.textColor = [46, 125, 50]
            data.cell.styles.fontStyle = 'bold'
          } else {
            data.cell.styles.textColor = [194, 24, 91]
            data.cell.styles.fontStyle = 'bold'
          }
        }
      }
    }
  })

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Página ${i} de ${pageCount}`, 148, doc.internal.pageSize.height - 10, { align: 'center' })
    doc.text('Sistema de Gestión de Finca', 14, doc.internal.pageSize.height - 10)
  }

  doc.save(`Historial_Movimientos_${new Date().toISOString().split('T')[0]}.pdf`)
}

onMounted(() => {
  cargarMovimientos()
})
</script>

<style scoped>
.historial-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

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

.stats-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-card {
  border-radius: 16px;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  min-width: 200px;
}

.stat-card.compras {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.3);
}

.stat-card.pagos {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  box-shadow: 0 10px 30px rgba(17, 153, 142, 0.3);
}

.stat-icon {
  font-size: 2em;
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

.filters-section {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 0.85em;
  color: #666;
  font-weight: 600;
}

.filter-select {
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1em;
  min-width: 150px;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f8f9ff;
  border-radius: 10px;
  padding: 5px 15px;
  flex: 1;
  max-width: 400px;
  border: 2px solid #e0e0e0;
}

.search-box:focus-within {
  border-color: #667eea;
}

.search-icon {
  font-size: 1.1em;
  margin-right: 10px;
}

.search-input {
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 1em;
  flex: 1;
  background: transparent;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 10px;
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
  padding: 12px 20px;
  border-radius: 10px;
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

.movimientos-table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.movimientos-table {
  width: 100%;
  border-collapse: collapse;
}

.movimientos-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9em;
}

.movimientos-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #eee;
  font-size: 0.9em;
}

.movimientos-table tr:hover {
  background: #f8f9ff;
}

.movimientos-table tr.row-pago {
  background: linear-gradient(90deg, #e8f5e9 0%, #ffffff 50%);
}

.movimientos-table tr.row-pago:hover {
  background: linear-gradient(90deg, #c8e6c9 0%, #f8f9ff 50%);
}

.badge-tipo {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
}

.badge-tipo.compra {
  background: #fce4ec;
  color: #c2185b;
}

.badge-tipo.pago {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.trabajador-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-small {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8em;
}

.trabajador-cell .nombre {
  display: block;
  font-weight: 600;
  color: #333;
}

.trabajador-cell .ruc {
  display: block;
  font-size: 0.85em;
  color: #888;
}

.detalle-compra, .detalle-pago {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-tipo {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  font-weight: 600;
  width: fit-content;
}

.doc-tipo.vale {
  background: #e3f2fd;
  color: #1976d2;
}

.doc-tipo.factura {
  background: #fce4ec;
  color: #c2185b;
}

.doc-numero {
  font-weight: 600;
  color: #333;
}

.producto {
  font-size: 0.9em;
  color: #666;
}

.pago-label {
  font-weight: 600;
  color: #11998e;
}

.forma-pago {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  width: fit-content;
}

.forma-pago.efectivo {
  background: #fff8e1;
  color: #f57f17;
}

.forma-pago.transferencia {
  background: #e3f2fd;
  color: #1565c0;
}

.referencia {
  font-size: 0.85em;
  color: #888;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.importe-compra {
  color: #f5576c;
  font-weight: 700;
}

.importe-pago {
  color: #11998e;
  font-weight: 700;
}

.badge-estado {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75em;
  font-weight: 700;
}

.badge-estado.pago {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #2e7d32;
}

.badge-estado.compra {
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%);
  color: #c2185b;
}

.fecha-cell {
  white-space: nowrap;
  color: #666;
  font-size: 0.85em;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
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

@media (max-width: 1024px) {
  .movimientos-table-container {
    overflow-x: auto;
  }

  .movimientos-table {
    min-width: 900px;
  }
}

@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .stats-cards {
    flex-direction: column;
  }
}
</style>
