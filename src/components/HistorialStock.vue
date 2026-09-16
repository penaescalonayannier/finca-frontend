<template>
  <div class="historial-container">
    <div class="header-section">
      <h1 class="main-title">
        <span class="icon">📦</span>
        Historial de Stock
      </h1>
      <p class="subtitle">Auditoría completa de movimientos de inventario</p>
    </div>

    <div class="stats-cards">
      <div class="stat-card entradas">
        <div class="stat-icon">📥</div>
        <div class="stat-info">
          <span class="stat-value">{{ totalEntradas }}</span>
          <span class="stat-label">Entradas</span>
        </div>
      </div>
      <div class="stat-card salidas">
        <div class="stat-icon">📤</div>
        <div class="stat-info">
          <span class="stat-value">{{ totalSalidas }}</span>
          <span class="stat-label">Salidas</span>
        </div>
      </div>
      <div class="stat-card ajustes">
        <div class="stat-icon">🔧</div>
        <div class="stat-info">
          <span class="stat-value">{{ totalAjustes }}</span>
          <span class="stat-label">Ajustes</span>
        </div>
      </div>
    </div>

    <div class="filters-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>Tipo de Movimiento</label>
          <select v-model="filtroTipo" @change="buscarConReset" class="filter-select">
            <option value="">Todos</option>
            <option value="ENTRADA_PRODUCCION">Entrada Producción</option>
            <option value="ENTRADA_FACTURA">Entrada por factura</option>
            <option value="ENTRADA_CONDUCE">Entrada por conduce</option>
            <option value="ENTRADA_AJUSTE">Ajuste de entrada</option>
            <option value="SALIDA_VENTA">Salida / venta</option>
            <option value="SALIDA_AUTOCONSUMO">Salida a trabajadores</option>
            <option value="SALIDA_COMEDOR">Salida a comedor</option>
            <option value="SALIDA_AJUSTE">Ajuste de salida</option>
            <option value="TRANSFERENCIA_ENTRADA">Transferencia recibida</option>
            <option value="TRANSFERENCIA_SALIDA">Transferencia enviada</option>
            <option value="DEVOLUCION">Devolución</option>
            <option value="AJUSTE_MANUAL">Ajuste manual</option>
            <option value="STOCK_INICIAL">Stock Inicial</option>
            <option value="AJUSTE_EDICION">Ajuste Edición</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Finca</label>
          <select v-model="filtroFinca" @change="buscarConReset" class="filter-select">
            <option value="">Todas</option>
            <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
              {{ finca.name }}
            </option>
          </select>
        </div>
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            placeholder="Buscar por producto..."
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
      <div class="empty-icon">📦</div>
      <h3>No hay movimientos registrados</h3>
      <p>No se encontraron registros con los filtros aplicados</p>
    </div>

    <div v-else class="movimientos-table-container">
      <table class="movimientos-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Finca</th>
            <th>Almacén</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Stock Ant.</th>
            <th>Stock Nuevo</th>
            <th>Referencia</th>
            <th>Descripción</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mov in movimientos" :key="mov.id" :class="getRowClass(mov.tipo)">
            <td>
              <span class="badge-tipo" :class="getTipoClass(mov.tipo)">
                {{ getTipoIcon(mov.tipo) }} {{ getTipoLabel(mov.tipo) }}
              </span>
            </td>
            <td>
              <span class="finca-name">{{ mov.fincaNombre || 'N/A' }}</span>
            </td>
            <td>
              <span class="finca-name">{{ mov.almacenNombre || 'Sin almacén' }}</span>
              <span v-if="mov.almacenInventario" class="subtext">{{ mov.almacenInventario }}</span>
            </td>
            <td>
              <span class="producto-name">{{ mov.productoNombre || 'N/A' }}</span>
            </td>
            <td class="text-center">
              <span :class="mov.cantidad >= 0 ? 'cantidad-positiva' : 'cantidad-negativa'">
                {{ mov.cantidad >= 0 ? '+' : '' }}{{ mov.cantidad }}
              </span>
            </td>
            <td class="text-center">{{ mov.stockAnterior }}</td>
            <td class="text-center">
              <span class="stock-nuevo">{{ mov.stockNuevo }}</span>
            </td>
            <td>
              <span v-if="mov.referenciaTabla" class="referencia-badge">
                {{ formatReferencia(mov.referenciaTabla) }}
              </span>
              <span v-else class="sin-referencia">-</span>
            </td>
            <td class="descripcion-cell">{{ mov.descripcion || '-' }}</td>
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
import MovimientoStockService from '@/services/MovimientoStockService'
import FincaService from '@/services/FincaService'
import { TIPO_MOVIMIENTO_LABELS, type MovimientoStock, type TipoMovimientoStock } from '@/types/MovimientoStock'
import type { Finca } from '@/types/Finca'
import type { SearchFilter } from '@/types/EstadoCuenta'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const movimientos = ref<MovimientoStock[]>([])
const fincas = ref<Finca[]>([])
const searchQuery = ref('')
const filtroTipo = ref('')
const filtroFinca = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(20)
const totalElementos = ref(0)
const isLoading = ref(false)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const TIPOS_ENTRADA: TipoMovimientoStock[] = [
  'ENTRADA_PRODUCCION', 'ENTRADA_FACTURA', 'ENTRADA_CONDUCE', 'ENTRADA_AJUSTE',
  'TRANSFERENCIA_ENTRADA', 'DEVOLUCION', 'STOCK_INICIAL'
]
const TIPOS_SALIDA: TipoMovimientoStock[] = [
  'SALIDA_VENTA', 'SALIDA_AUTOCONSUMO', 'SALIDA_COMEDOR', 'SALIDA_AJUSTE',
  'TRANSFERENCIA_SALIDA', 'REVERSION_PRODUCCION', 'REVERSION_SALIDA'
]
const totalEntradas = computed(() => movimientos.value.filter(m => TIPOS_ENTRADA.includes(m.tipo)).length)
const totalSalidas = computed(() => movimientos.value.filter(m => TIPOS_SALIDA.includes(m.tipo)).length)
const totalAjustes = computed(() =>
  movimientos.value.filter(m => m.tipo === 'ENTRADA_AJUSTE' || m.tipo === 'SALIDA_AJUSTE' || m.tipo === 'AJUSTE_MANUAL' || m.tipo === 'AJUSTE_EDICION').length
)

const getTipoLabel = (tipo: TipoMovimientoStock) => TIPO_MOVIMIENTO_LABELS[tipo] || tipo
const getTipoIcon = (tipo: TipoMovimientoStock) =>
  TIPOS_ENTRADA.includes(tipo) ? '📥' : TIPOS_SALIDA.includes(tipo) ? '📤' : '🔧'

const getTipoClass = (tipo: TipoMovimientoStock) => {
  switch (tipo) {
    case 'ENTRADA_PRODUCCION':
    case 'ENTRADA_FACTURA':
    case 'ENTRADA_CONDUCE':
    case 'ENTRADA_AJUSTE':
    case 'TRANSFERENCIA_ENTRADA':
    case 'DEVOLUCION':
    case 'STOCK_INICIAL':
      return 'entrada'
    case 'SALIDA_VENTA':
    case 'SALIDA_AUTOCONSUMO':
    case 'SALIDA_COMEDOR':
    case 'SALIDA_AJUSTE':
    case 'TRANSFERENCIA_SALIDA':
    case 'REVERSION_PRODUCCION':
    case 'REVERSION_SALIDA':
      return 'salida'
    default:
      return 'ajuste'
  }
}

const getRowClass = (tipo: TipoMovimientoStock) => {
  switch (tipo) {
    case 'ENTRADA_PRODUCCION':
    case 'ENTRADA_FACTURA':
    case 'ENTRADA_CONDUCE':
    case 'ENTRADA_AJUSTE':
    case 'TRANSFERENCIA_ENTRADA':
    case 'DEVOLUCION':
    case 'STOCK_INICIAL':
      return 'row-entrada'
    case 'SALIDA_VENTA':
    case 'SALIDA_AUTOCONSUMO':
    case 'SALIDA_COMEDOR':
    case 'SALIDA_AJUSTE':
    case 'TRANSFERENCIA_SALIDA':
    case 'REVERSION_PRODUCCION':
    case 'REVERSION_SALIDA':
      return 'row-salida'
    default:
      return ''
  }
}

const formatReferencia = (tabla: string) => {
  const labels: Record<string, string> = {
    'salida': 'Salida',
    'produccion_terminada': 'Producción'
  }
  return labels[tabla] || tabla
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

const cargarFincas = async () => {
  try {
    const response = await FincaService.search({ size: 100 })
    const data = response.data as { content?: Finca[], data?: Finca[] }
    fincas.value = data.content || data.data || []
  } catch (error) {
    console.error('Error al cargar fincas:', error)
  }
}

const cargarMovimientos = async () => {
  isLoading.value = true
  movimientos.value = []
  try {
    const filters: SearchFilter[] = []

    if (filtroTipo.value) {
      filters.push({
        key: 'tipo',
        operator: 'EQUALS',
        value: filtroTipo.value,
        logicalOperation: 'AND'
      })
    }

    if (filtroFinca.value) {
      filters.push({
        key: 'fincaId',
        operator: 'EQUALS',
        value: filtroFinca.value,
        logicalOperation: 'AND'
      })
    }

    const response = await MovimientoStockService.search({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
      sortBy: 'fecha',
      sortType: 'DES'
    })

    const data = response.data as Record<string, unknown>

    if (data.content) {
      movimientos.value = (data.content as MovimientoStock[]) || []
      totalElementos.value = (data.totalElements as number) || movimientos.value.length
    } else if (data.data) {
      movimientos.value = (data.data as MovimientoStock[]) || []
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
  doc.text('Historial de Movimientos de Stock', 148, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Fecha de generación: ${fechaActual}`, 148, 22, { align: 'center' })

  const tableData = movimientos.value.map((mov) => [
    getTipoLabel(mov.tipo),
    mov.fincaNombre || 'N/A',
    mov.almacenNombre || 'Sin almacén',
    mov.productoNombre || 'N/A',
    (mov.cantidad >= 0 ? '+' : '') + mov.cantidad.toString(),
    mov.stockAnterior.toString(),
    mov.stockNuevo.toString(),
    mov.referenciaTabla ? formatReferencia(mov.referenciaTabla) : '-',
    mov.descripcion || '-',
    formatDate(mov.fecha).split(',')[0]
  ])

  autoTable(doc, {
    startY: 28,
    head: [['Tipo', 'Finca', 'Almacén', 'Producto', 'Cant.', 'Stock Ant.', 'Stock Nuevo', 'Ref.', 'Descripción', 'Fecha']],
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
      0: { halign: 'center', cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 22 },
      7: { cellWidth: 50 },
      8: { cellWidth: 28 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const value = data.cell.raw as string
        if (value.startsWith('+')) {
          data.cell.styles.textColor = [46, 125, 50]
          data.cell.styles.fontStyle = 'bold'
        } else if (value.startsWith('-')) {
          data.cell.styles.textColor = [198, 40, 40]
          data.cell.styles.fontStyle = 'bold'
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

  doc.save(`Historial_Stock_${new Date().toISOString().split('T')[0]}.pdf`)
}

onMounted(() => {
  cargarFincas()
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
  min-width: 180px;
}

.stat-card.entradas {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  box-shadow: 0 10px 30px rgba(17, 153, 142, 0.3);
}

.stat-card.salidas {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.3);
}

.stat-card.ajustes {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
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
  max-width: 300px;
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

.movimientos-table tr.row-entrada {
  background: linear-gradient(90deg, #e8f5e9 0%, #ffffff 50%);
}

.movimientos-table tr.row-entrada:hover {
  background: linear-gradient(90deg, #c8e6c9 0%, #f8f9ff 50%);
}

.movimientos-table tr.row-salida {
  background: linear-gradient(90deg, #ffebee 0%, #ffffff 50%);
}

.movimientos-table tr.row-salida:hover {
  background: linear-gradient(90deg, #ffcdd2 0%, #f8f9ff 50%);
}

.badge-tipo {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  white-space: nowrap;
}

.badge-tipo.entrada {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
}

.badge-tipo.salida {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  color: white;
}

.badge-tipo.ajuste {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.finca-name, .producto-name {
  font-weight: 600;
  color: #333;
}

.text-center {
  text-align: center;
}

.cantidad-positiva {
  color: #2e7d32;
  font-weight: 700;
  font-size: 1.1em;
}

.cantidad-negativa {
  color: #c62828;
  font-weight: 700;
  font-size: 1.1em;
}

.stock-nuevo {
  background: #e3f2fd;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  color: #1565c0;
}

.referencia-badge {
  background: #f3e5f5;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.85em;
  color: #7b1fa2;
}

.sin-referencia {
  color: #999;
}

.descripcion-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #666;
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
    min-width: 1000px;
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
