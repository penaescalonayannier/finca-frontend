<template>
  <div class="resumen-ventas-pagos">
    <h1>Resumen de Ventas y Pagos</h1>
    <p class="subtitle">Reporte consolidado por rango de fechas</p>

    <!-- Filtros -->
    <div class="filtros-section">
      <div class="filtro-group">
        <label for="fechaInicio">Fecha Inicio</label>
        <input type="date" v-model="fechaInicio" id="fechaInicio" />
      </div>

      <div class="filtro-group">
        <label for="fechaFin">Fecha Fin</label>
        <input type="date" v-model="fechaFin" id="fechaFin" />
      </div>

      <div class="filtro-group">
        <label for="finca">Finca (opcional)</label>
        <select v-model="fincaSeleccionada" id="finca">
          <option value="">Todas las fincas</option>
          <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
            {{ finca.code }} - {{ finca.name }}
          </option>
        </select>
      </div>

      <button @click="cargarDatos" class="btn-consultar" :disabled="isLoading">
        {{ isLoading ? 'Cargando...' : 'Consultar' }}
      </button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="['tab', { active: tabActiva === 'pagos' }]"
        @click="tabActiva = 'pagos'"
      >
        Pagos Recibidos
      </button>
      <button
        :class="['tab', { active: tabActiva === 'ventas' }]"
        @click="tabActiva = 'ventas'"
      >
        Ventas Realizadas
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>

    <!-- Tab Pagos -->
    <div v-else-if="tabActiva === 'pagos'" class="tab-content">
      <div v-if="resumenPagos" class="contenido-reporte">
        <!-- KPIs Pagos -->
        <div class="kpi-grid">
          <div class="kpi-card efectivo">
            <div class="kpi-icon">💵</div>
            <div class="kpi-content">
              <div class="kpi-value">${{ formatNumber(resumenPagos.resumen.montoEfectivo) }}</div>
              <div class="kpi-label">Efectivo</div>
              <div class="kpi-percent">{{ resumenPagos.resumen.porcentajeEfectivo }}%</div>
            </div>
          </div>

          <div class="kpi-card transferencia">
            <div class="kpi-icon">🏦</div>
            <div class="kpi-content">
              <div class="kpi-value">${{ formatNumber(resumenPagos.resumen.montoTransferencia) }}</div>
              <div class="kpi-label">Transferencia</div>
              <div class="kpi-percent">{{ resumenPagos.resumen.porcentajeTransferencia }}%</div>
            </div>
          </div>

          <div class="kpi-card total">
            <div class="kpi-icon">💰</div>
            <div class="kpi-content">
              <div class="kpi-value">${{ formatNumber(resumenPagos.resumen.montoTotal) }}</div>
              <div class="kpi-label">Total Recibido</div>
              <div class="kpi-percent">{{ resumenPagos.resumen.totalPagos }} pagos</div>
            </div>
          </div>
        </div>

        <!-- Tabla Desglose por Metodo -->
        <div class="tabla-section">
          <h3>Desglose por Forma de Pago</h3>
          <table class="tabla-datos">
            <thead>
              <tr>
                <th>Forma de Pago</th>
                <th>Cantidad</th>
                <th>Monto</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="detalle in resumenPagos.detallePorMetodo" :key="detalle.formaPago">
                <td>
                  <span :class="['badge', detalle.formaPago.toLowerCase()]">
                    {{ detalle.formaPago }}
                  </span>
                </td>
                <td>{{ detalle.cantidad }}</td>
                <td>${{ formatNumber(detalle.monto) }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: detalle.porcentaje + '%' }"></div>
                    <span class="progress-text">{{ detalle.porcentaje }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabla Documentos -->
        <div class="tabla-section">
          <h3>Detalle de Pagos ({{ resumenPagos.documentos.length }})</h3>
          <table class="tabla-datos tabla-documentos">
            <thead>
              <tr>
                <th>Recibo</th>
                <th>Fecha</th>
                <th>Trabajador</th>
                <th>RUC</th>
                <th>Finca</th>
                <th>Monto</th>
                <th>Forma Pago</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in resumenPagos.documentos" :key="doc.numeroRecibo">
                <td>{{ doc.numeroRecibo }}</td>
                <td>{{ formatDate(doc.fecha) }}</td>
                <td>{{ doc.trabajadorNombre }}</td>
                <td>{{ doc.trabajadorRuc }}</td>
                <td>{{ doc.fincaNombre }}</td>
                <td class="monto">${{ formatNumber(doc.monto) }}</td>
                <td>
                  <span :class="['badge', doc.formaPago?.toLowerCase()]">
                    {{ doc.formaPago }}
                  </span>
                </td>
                <td>{{ doc.referenciaBancaria || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="no-data">
        <p>No hay datos de pagos para el rango seleccionado.</p>
      </div>
    </div>

    <!-- Tab Ventas -->
    <div v-else-if="tabActiva === 'ventas'" class="tab-content">
      <div v-if="resumenVentas" class="contenido-reporte">
        <!-- KPIs Ventas -->
        <div class="kpi-grid">
          <div class="kpi-card salidas">
            <div class="kpi-icon">📦</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ resumenVentas.resumen.totalSalidas }}</div>
              <div class="kpi-label">Total Salidas</div>
            </div>
          </div>

          <div class="kpi-card items">
            <div class="kpi-icon">🛒</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ resumenVentas.resumen.totalItems }}</div>
              <div class="kpi-label">Total Items</div>
            </div>
          </div>

          <div class="kpi-card total">
            <div class="kpi-icon">💰</div>
            <div class="kpi-content">
              <div class="kpi-value">${{ formatNumber(resumenVentas.resumen.valorTotal) }}</div>
              <div class="kpi-label">Valor Total</div>
            </div>
          </div>
        </div>

        <!-- Tabla Desglose por Destino -->
        <div class="tabla-section">
          <h3>Desglose por Destino</h3>
          <table class="tabla-datos">
            <thead>
              <tr>
                <th>Destino</th>
                <th>Salidas</th>
                <th>Items</th>
                <th>Valor</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="detalle in resumenVentas.detallePorDestino" :key="detalle.destino">
                <td>
                  <span :class="['badge', 'destino-' + detalle.destino.toLowerCase()]">
                    {{ formatDestino(detalle.destino) }}
                  </span>
                </td>
                <td>{{ detalle.cantidadSalidas }}</td>
                <td>{{ detalle.cantidadItems }}</td>
                <td>${{ formatNumber(detalle.valor) }}</td>
                <td>
                  <div class="progress-bar">
                    <div class="progress-fill destino" :style="{ width: detalle.porcentaje + '%' }"></div>
                    <span class="progress-text">{{ detalle.porcentaje }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Tabla Documentos -->
        <div class="tabla-section">
          <h3>Detalle de Ventas ({{ resumenVentas.documentos.length }})</h3>
          <table class="tabla-datos tabla-documentos">
            <thead>
              <tr>
                <th>Numero</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Destino</th>
                <th>Finca</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(doc, index) in resumenVentas.documentos" :key="index">
                <td>{{ doc.numero }}</td>
                <td>{{ formatDate(doc.fecha) }}</td>
                <td>
                  <span :class="['badge', 'tipo-' + doc.tipo?.toLowerCase()]">
                    {{ doc.tipo }}
                  </span>
                </td>
                <td>{{ formatDestino(doc.destino) }}</td>
                <td>{{ doc.fincaNombre }}</td>
                <td>{{ doc.productoNombre }}</td>
                <td>{{ doc.cantidad }}</td>
                <td class="monto">${{ formatNumber(doc.valorTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="no-data">
        <p>No hay datos de ventas para el rango seleccionado.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ReportesConsolidadosService from '@/services/ReportesConsolidadosService'
import FincaService from '@/services/FincaService'
import type { ResumenPagos, ResumenVentas } from '@/types/Reportes'
import { notify } from '@/composables/useNotification'

interface Finca {
  id: string
  code: string
  name: string
}

const fechaInicio = ref('')
const fechaFin = ref('')
const fincaSeleccionada = ref('')
const fincas = ref<Finca[]>([])
const tabActiva = ref<'pagos' | 'ventas'>('pagos')
const isLoading = ref(false)

const resumenPagos = ref<ResumenPagos | null>(null)
const resumenVentas = ref<ResumenVentas | null>(null)

// Initialize dates to current month
const initDates = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  fechaInicio.value = firstDay.toISOString().split('T')[0]
  fechaFin.value = lastDay.toISOString().split('T')[0]
}

const cargarFincas = async () => {
  try {
    const response = await FincaService.obtenerTodasLasFincas()
    fincas.value = response.data.data || []
  } catch (error) {
    console.error('Error loading fincas:', error)
  }
}

const cargarDatos = async () => {
  if (!fechaInicio.value || !fechaFin.value) {
    notify.warning('Fechas requeridas', 'Seleccione un rango de fechas')
    return
  }

  isLoading.value = true
  resumenPagos.value = null
  resumenVentas.value = null

  try {
    const params = {
      fechaInicio: fechaInicio.value,
      fechaFin: fechaFin.value,
      fincaId: fincaSeleccionada.value || undefined
    }

    const [pagosRes, ventasRes] = await Promise.all([
      ReportesConsolidadosService.getResumenPagos(params),
      ReportesConsolidadosService.getResumenVentas(params)
    ])

    resumenPagos.value = pagosRes.data
    resumenVentas.value = ventasRes.data
  } catch (error) {
    console.error('Error loading reports:', error)
    notify.error('Error', 'No se pudieron cargar los reportes')
  } finally {
    isLoading.value = false
  }
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return '0.00'
  return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDestino = (destino: string | undefined): string => {
  if (!destino) return '-'
  const map: Record<string, string> = {
    'TRABAJADORES': 'Trabajadores',
    'COMEDOR': 'Comedor',
    'VENTA_ESTADO': 'Venta Estado',
    'POBLACION': 'Poblacion',
    'INSUMO': 'Insumo',
    'OTROS': 'Otros',
    'SIN_DESTINO': 'Sin Destino'
  }
  return map[destino] || destino
}

onMounted(() => {
  initDates()
  cargarFincas()
})
</script>

<style scoped>
.resumen-ventas-pagos {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 5px;
}

.subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 25px;
}

/* Filtros */
.filtros-section {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: flex-end;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 25px;
}

.filtro-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filtro-group label {
  font-size: 0.85em;
  font-weight: 600;
  color: #555;
}

.filtro-group input,
.filtro-group select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  min-width: 150px;
}

.btn-consultar {
  padding: 10px 25px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-consultar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
}

.btn-consultar:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
}

.tab {
  padding: 12px 30px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #666;
  transition: all 0.3s;
}

.tab:hover {
  border-color: #3498db;
  color: #3498db;
}

.tab.active {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-color: #3498db;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 15px;
  border-left: 4px solid #3498db;
}

.kpi-card.efectivo { border-left-color: #27ae60; }
.kpi-card.transferencia { border-left-color: #9b59b6; }
.kpi-card.total { border-left-color: #f39c12; }
.kpi-card.salidas { border-left-color: #3498db; }
.kpi-card.items { border-left-color: #1abc9c; }

.kpi-icon {
  font-size: 2em;
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 1.5em;
  font-weight: 700;
  color: #2c3e50;
}

.kpi-label {
  font-size: 0.85em;
  color: #7f8c8d;
  margin-top: 3px;
}

.kpi-percent {
  font-size: 0.9em;
  color: #3498db;
  font-weight: 600;
  margin-top: 5px;
}

/* Tables */
.tabla-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
}

.tabla-section h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.tabla-datos {
  width: 100%;
  border-collapse: collapse;
}

.tabla-datos th,
.tabla-datos td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.tabla-datos th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  font-size: 0.9em;
}

.tabla-datos tbody tr:hover {
  background: #f8f9fa;
}

.tabla-documentos {
  font-size: 0.9em;
}

.tabla-documentos td {
  padding: 10px 12px;
}

.monto {
  font-weight: 600;
  color: #27ae60;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8em;
  font-weight: 600;
}

.badge.efectivo {
  background: #d5f5e3;
  color: #27ae60;
}

.badge.transferencia {
  background: #ebdef0;
  color: #9b59b6;
}

.badge.tipo-vale {
  background: #d6eaf8;
  color: #2980b9;
}

.badge.tipo-factura {
  background: #fdebd0;
  color: #e67e22;
}

.badge.destino-trabajadores { background: #d5f5e3; color: #27ae60; }
.badge.destino-comedor { background: #fdebd0; color: #e67e22; }
.badge.destino-venta_estado { background: #d6eaf8; color: #2980b9; }
.badge.destino-poblacion { background: #ebdef0; color: #9b59b6; }
.badge.destino-insumo { background: #fadbd8; color: #e74c3c; }
.badge.destino-otros { background: #eee; color: #666; }

/* Progress Bar */
.progress-bar {
  position: relative;
  height: 22px;
  background: #eee;
  border-radius: 11px;
  overflow: hidden;
  min-width: 100px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  border-radius: 11px;
  transition: width 0.5s ease;
}

.progress-fill.destino {
  background: linear-gradient(90deg, #27ae60, #2ecc71);
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75em;
  font-weight: 600;
  color: #333;
}

/* No Data */
.no-data {
  text-align: center;
  padding: 50px;
  background: #f8f9fa;
  border-radius: 12px;
  color: #7f8c8d;
}

/* Responsive */
@media (max-width: 768px) {
  .filtros-section {
    flex-direction: column;
  }

  .filtro-group input,
  .filtro-group select {
    width: 100%;
  }

  .tabs {
    flex-direction: column;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .tabla-datos {
    font-size: 0.85em;
  }

  .tabla-datos th,
  .tabla-datos td {
    padding: 8px 10px;
  }
}
</style>
