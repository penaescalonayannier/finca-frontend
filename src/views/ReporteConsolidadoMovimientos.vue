<template>
  <div class="reporte-consolidado">
    <div class="header">
      <h2>Reporte Consolidado de Movimientos</h2>
      <p class="subtitle">Balance de entradas y salidas por producto y destino</p>
    </div>

    <!-- Filtros -->
    <div class="filtros card">
      <div class="filtros-row">
        <div class="filtro-group">
          <label>Fecha Inicio</label>
          <input type="date" v-model="fechaInicio" />
        </div>
        <div class="filtro-group">
          <label>Fecha Fin</label>
          <input type="date" v-model="fechaFin" />
        </div>
        <div class="filtro-group">
          <label>Finca (opcional)</label>
          <select v-model="fincaId">
            <option value="">Todas las fincas</option>
            <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
              {{ finca.code }} - {{ finca.name }}
            </option>
          </select>
        </div>
        <button class="btn-primary" @click="cargarReporte" :disabled="loading">
          <span v-if="loading">Cargando...</span>
          <span v-else>Generar Reporte</span>
        </button>
        <button class="btn-pdf" @click="descargarPdf" :disabled="loading || generandoPdf">
          <span v-if="generandoPdf">Generando PDF...</span>
          <span v-else>Descargar PDF</span>
        </button>
      </div>
    </div>

    <!-- Resumen General -->
    <div v-if="reporte" class="resumen card">
      <h3>Resumen del Periodo: {{ formatDate(reporte.fechaInicio) }} - {{ formatDate(reporte.fechaFin) }}</h3>
      <div class="resumen-stats">
        <div class="stat entrada">
          <span class="stat-label">Total Entradas</span>
          <span class="stat-value">{{ reporte.totalEntradas.toLocaleString() }}</span>
        </div>
        <div class="stat salida">
          <span class="stat-label">Total Salidas</span>
          <span class="stat-value">{{ reporte.totalSalidas.toLocaleString() }}</span>
        </div>
        <div class="stat balance" :class="{ positivo: balance >= 0, negativo: balance < 0 }">
          <span class="stat-label">Balance</span>
          <span class="stat-value">{{ balance >= 0 ? '+' : '' }}{{ balance.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Tabla Unificada por Producto -->
    <div v-if="reporte" class="seccion card">
      <h3>Movimientos por Producto</h3>
      <div class="tabla-container">
        <table class="tabla-unificada">
          <thead>
            <tr>
              <th rowspan="2" class="col-producto">Producto</th>
              <th rowspan="2" class="col-unidad">UM</th>
              <th rowspan="2" class="col-entradas">Entradas</th>
              <th rowspan="2" class="col-salidas">Total Salidas</th>
              <th :colspan="destinos.length" class="col-destinos-header">Salidas por Destino</th>
              <th rowspan="2" class="col-balance">Balance</th>
            </tr>
            <tr>
              <th v-for="destino in destinos" :key="destino" class="col-destino">
                {{ formatDestino(destino) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="producto in tablaUnificada" :key="producto.codigo">
              <td class="col-producto">
                <strong>{{ producto.codigo }}</strong>
                <br><small>{{ producto.nombre }}</small>
              </td>
              <td class="col-unidad">{{ producto.unidad }}</td>
              <td class="col-entradas entrada-cell">{{ producto.entradas.toLocaleString() }}</td>
              <td class="col-salidas salida-cell">{{ producto.salidasTotal.toLocaleString() }}</td>
              <td v-for="destino in destinos" :key="destino" class="col-destino">
                {{ (producto.salidasPorDestino[destino] || 0).toLocaleString() }}
              </td>
              <td class="col-balance" :class="{ 'balance-positivo': producto.balance >= 0, 'balance-negativo': producto.balance < 0 }">
                {{ producto.balance >= 0 ? '+' : '' }}{{ producto.balance.toLocaleString() }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2"><strong>TOTALES</strong></td>
              <td class="col-entradas entrada-cell"><strong>{{ reporte.totalEntradas.toLocaleString() }}</strong></td>
              <td class="col-salidas salida-cell"><strong>{{ reporte.totalSalidas.toLocaleString() }}</strong></td>
              <td v-for="destino in destinos" :key="destino" class="col-destino">
                <strong>{{ getTotalPorDestino(destino).toLocaleString() }}</strong>
              </td>
              <td class="col-balance" :class="{ 'balance-positivo': balance >= 0, 'balance-negativo': balance < 0 }">
                <strong>{{ balance >= 0 ? '+' : '' }}{{ balance.toLocaleString() }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Tabla de Ingresos por Destino -->
    <div v-if="reporte && reporte.salidasPorDestino.length > 0" class="seccion card">
      <h3>Ingresos por Destino</h3>
      <table class="tabla-ingresos">
        <thead>
          <tr>
            <th>Destino</th>
            <th>Cantidad Total</th>
            <th>Valor Total</th>
            <th>% del Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="destino in reporte.salidasPorDestino" :key="destino.destino" :class="getDestinoRowClass(destino.destino)">
            <td>
              <span class="destino-badge" :class="getDestinoClass(destino.destino)">
                {{ destino.destinoNombre }}
              </span>
            </td>
            <td>{{ destino.cantidadTotal.toLocaleString() }}</td>
            <td class="valor-cell">${{ destino.valorTotal.toLocaleString('es-CU', { minimumFractionDigits: 2 }) }}</td>
            <td>{{ calcularPorcentaje(destino.valorTotal) }}%</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td><strong>TOTAL</strong></td>
            <td><strong>{{ reporte.totalSalidas.toLocaleString() }}</strong></td>
            <td class="valor-cell"><strong>${{ totalIngresos.toLocaleString('es-CU', { minimumFractionDigits: 2 }) }}</strong></td>
            <td><strong>100%</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Estado vacío -->
    <div v-if="!reporte && !loading" class="empty-state card">
      <p>Seleccione un rango de fechas y haga clic en "Generar Reporte"</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import MovimientoStockService, { type ReporteConsolidado } from '@/services/MovimientoStockService'
import FincaService from '@/services/FincaService'

interface Finca {
  id: string
  code: string
  name: string
}

interface ProductoUnificado {
  codigo: string
  nombre: string
  unidad: string
  entradas: number
  salidasTotal: number
  salidasPorDestino: Record<string, number>
  balance: number
}

const loading = ref(false)
const generandoPdf = ref(false)
const reporte = ref<ReporteConsolidado | null>(null)
const fincas = ref<Finca[]>([])

// Fechas por defecto: mes actual
const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const fechaInicio = ref(firstDayOfMonth.toISOString().split('T')[0])
const fechaFin = ref(today.toISOString().split('T')[0])
const fincaId = ref('')

// Lista de todos los destinos posibles
const destinos = ['TRABAJADORES', 'COMEDOR', 'VENTA_ESTADO', 'POBLACION', 'INSUMO', 'OTROS']

const balance = computed(() => {
  if (!reporte.value) return 0
  return reporte.value.totalEntradas - reporte.value.totalSalidas
})

const totalIngresos = computed(() => {
  if (!reporte.value) return 0
  return reporte.value.salidasPorDestino.reduce((sum, d) => sum + d.valorTotal, 0)
})

// Tabla unificada: combina entradas y salidas por producto
const tablaUnificada = computed<ProductoUnificado[]>(() => {
  if (!reporte.value) return []

  const productosMap = new Map<string, ProductoUnificado>()

  // Agregar entradas
  for (const entrada of reporte.value.entradasPorProducto) {
    productosMap.set(entrada.productoCode, {
      codigo: entrada.productoCode,
      nombre: entrada.productoName,
      unidad: entrada.unidadMedida,
      entradas: entrada.cantidadTotal,
      salidasTotal: 0,
      salidasPorDestino: {},
      balance: entrada.cantidadTotal
    })
  }

  // Agregar salidas por destino
  for (const destino of reporte.value.salidasPorDestino) {
    for (const prod of destino.productos || []) {
      let producto = productosMap.get(prod.productoCode)
      if (!producto) {
        producto = {
          codigo: prod.productoCode,
          nombre: prod.productoName,
          unidad: '',
          entradas: 0,
          salidasTotal: 0,
          salidasPorDestino: {},
          balance: 0
        }
        productosMap.set(prod.productoCode, producto)
      }
      producto.salidasTotal += prod.cantidad
      producto.salidasPorDestino[destino.destino] = (producto.salidasPorDestino[destino.destino] || 0) + prod.cantidad
      producto.balance = producto.entradas - producto.salidasTotal
    }
  }

  // Ordenar por código de producto
  return Array.from(productosMap.values()).sort((a, b) => a.codigo.localeCompare(b.codigo))
})

const getTotalPorDestino = (destino: string): number => {
  if (!reporte.value) return 0
  const destinoData = reporte.value.salidasPorDestino.find(d => d.destino === destino)
  return destinoData?.cantidadTotal || 0
}

const calcularPorcentaje = (valor: number): string => {
  if (totalIngresos.value === 0) return '0'
  return ((valor / totalIngresos.value) * 100).toFixed(1)
}

const cargarFincas = async () => {
  try {
    const response = await FincaService.buscarFincas({ size: 999 })
    fincas.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar fincas:', error)
  }
}

const cargarReporte = async () => {
  if (!fechaInicio.value || !fechaFin.value) {
    alert('Debe seleccionar un rango de fechas')
    return
  }

  loading.value = true
  try {
    const response = await MovimientoStockService.getConsolidado(
      fechaInicio.value,
      fechaFin.value,
      fincaId.value || undefined
    )
    reporte.value = response.data
  } catch (error) {
    console.error('Error cargando reporte:', error)
    alert('Error al cargar el reporte')
  } finally {
    loading.value = false
  }
}

const descargarPdf = async () => {
  if (!fechaInicio.value || !fechaFin.value) {
    alert('Debe seleccionar un rango de fechas')
    return
  }
  generandoPdf.value = true
  try {
    await MovimientoStockService.descargarConsolidadoPdf(
      fechaInicio.value,
      fechaFin.value,
      fincaId.value || undefined
    )
  } catch (error) {
    console.error('Error generando PDF:', error)
    alert('No fue posible generar el PDF del reporte')
  } finally {
    generandoPdf.value = false
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDestino = (destino: string) => {
  const nombres: Record<string, string> = {
    'TRABAJADORES': 'Trabaj.',
    'COMEDOR': 'Comedor',
    'VENTA_ESTADO': 'Vta. Edo.',
    'POBLACION': 'Poblac.',
    'INSUMO': 'Insumo',
    'OTROS': 'Otros'
  }
  return nombres[destino] || destino
}

const getDestinoClass = (destino: string) => {
  const clases: Record<string, string> = {
    'TRABAJADORES': 'destino-trabajadores',
    'COMEDOR': 'destino-comedor',
    'VENTA_ESTADO': 'destino-venta',
    'POBLACION': 'destino-poblacion',
    'INSUMO': 'destino-insumo',
    'OTROS': 'destino-otros'
  }
  return clases[destino] || ''
}

const getDestinoRowClass = (destino: string) => {
  return `row-${destino.toLowerCase().replace('_', '-')}`
}

onMounted(() => {
  cargarFincas()
})
</script>

<style scoped>
.reporte-consolidado {
  padding: 1.5rem;
  max-width: 1600px;
  margin: 0 auto;
  background: #f8fafc;
  min-height: 100vh;
}

.header {
  margin-bottom: 1.5rem;
}

.header h2 {
  margin: 0;
  color: #334155;
  font-weight: 600;
}

.subtitle {
  color: #64748b;
  margin: 0.25rem 0 0 0;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
}

.filtros-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filtro-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.filtro-group input,
.filtro-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #f8fafc;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filtro-group input:focus,
.filtro-group select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-pdf {
  background: #0f766e;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-pdf:hover:not(:disabled) {
  background: #0d5f59;
}

.btn-pdf:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.resumen h3 {
  margin: 0 0 1rem 0;
  color: #334155;
  font-weight: 600;
}

.resumen-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  min-width: 150px;
  border: 1px solid transparent;
}

.stat-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.stat.entrada {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #a7f3d0;
}

.stat.entrada .stat-value {
  color: #047857;
}

.stat.salida {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fcd34d;
}

.stat.salida .stat-value {
  color: #b45309;
}

.stat.balance.positivo {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #a7f3d0;
}

.stat.balance.positivo .stat-value {
  color: #047857;
}

.stat.balance.negativo {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  border-color: #fca5a5;
}

.stat.balance.negativo .stat-value {
  color: #dc2626;
}

.seccion h3 {
  margin: 0 0 1rem 0;
  color: #334155;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
  font-weight: 600;
}

/* Tabla unificada */
.tabla-container {
  overflow-x: auto;
  border-radius: 8px;
}

.tabla-unificada {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.875rem;
}

.tabla-unificada th,
.tabla-unificada td {
  padding: 0.6rem 0.5rem;
  text-align: center;
  border-bottom: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  color: #334155;
}

.tabla-unificada th:last-child,
.tabla-unificada td:last-child {
  border-right: none;
}

.tabla-unificada th {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}

.tabla-unificada thead tr:first-child th:first-child {
  border-top-left-radius: 8px;
}

.tabla-unificada thead tr:first-child th:last-child {
  border-top-right-radius: 8px;
}

.tabla-unificada .col-producto {
  text-align: left;
  min-width: 150px;
}

.tabla-unificada .col-unidad {
  min-width: 50px;
}

.tabla-unificada .col-entradas {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  min-width: 80px;
  color: #047857 !important;
}

.tabla-unificada .col-salidas {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  min-width: 80px;
  color: #92400e !important;
}

.tabla-unificada .col-destinos-header {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
}

.tabla-unificada .col-destino {
  min-width: 65px;
  background: #f8fafc;
  color: #475569;
}

.tabla-unificada .col-balance {
  min-width: 80px;
  font-weight: 600;
}

.tabla-unificada tbody tr {
  background: white;
  transition: background 0.15s;
  color: #334155;
}

.tabla-unificada tbody tr:nth-child(even) {
  background: #f8fafc;
}

.tabla-unificada tbody tr:hover {
  background: #f1f5f9;
}

.entrada-cell {
  background: #ecfdf5 !important;
  color: #047857;
  font-weight: 600;
}

.salida-cell {
  background: #fffbeb !important;
  color: #b45309;
  font-weight: 600;
}

.balance-positivo {
  color: #047857 !important;
  background: #d1fae5 !important;
}

.balance-negativo {
  color: #dc2626 !important;
  background: #fee2e2 !important;
}

.tabla-unificada tfoot td {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: white;
  font-weight: 600;
  border-top: 2px solid #334155;
}

.tabla-unificada tfoot tr td:first-child {
  border-bottom-left-radius: 8px;
}

.tabla-unificada tfoot tr td:last-child {
  border-bottom-right-radius: 8px;
}

.tabla-unificada tfoot .entrada-cell {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  color: white;
}

.tabla-unificada tfoot .salida-cell {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
  color: white;
}

.tabla-unificada tfoot .balance-positivo {
  background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
  color: white !important;
}

.tabla-unificada tfoot .balance-negativo {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  color: white !important;
}

/* Tabla de ingresos */
.tabla-ingresos {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 8px;
  overflow: hidden;
}

.tabla-ingresos th,
.tabla-ingresos td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}

.tabla-ingresos th {
  background: #f1f5f9;
  font-weight: 600;
  color: #475569;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.tabla-ingresos tbody tr {
  transition: background 0.15s;
}

.tabla-ingresos tbody tr:hover {
  background: #f8fafc;
}

.tabla-ingresos .valor-cell {
  font-weight: 600;
  color: #059669;
}

.tabla-ingresos tfoot td {
  background: #f1f5f9;
  font-weight: 600;
  border-top: 2px solid #e2e8f0;
}

.destino-badge {
  display: inline-block;
  padding: 0.3rem 0.85rem;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

.destino-trabajadores { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }
.destino-comedor { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.destino-venta { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.destino-poblacion { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
.destino-insumo { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
.destino-otros { background: linear-gradient(135deg, #64748b 0%, #475569 100%); }

.empty-state {
  text-align: center;
  color: #64748b;
  padding: 3rem;
}

@media (max-width: 1200px) {
  .tabla-unificada {
    font-size: 0.75rem;
  }

  .tabla-unificada th,
  .tabla-unificada td {
    padding: 0.4rem 0.3rem;
  }
}
</style>
