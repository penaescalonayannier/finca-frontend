<template>
  <div class="reporte-kardex">
    <div class="header">
      <h1>Kardex Consolidado</h1>
      <router-link to="/reportes-consolidados" class="btn-back">← Volver</router-link>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Fecha Inicio:</label>
        <input type="date" v-model="filtros.fechaInicio" />
      </div>
      <div class="filter-group">
        <label>Fecha Fin:</label>
        <input type="date" v-model="filtros.fechaFin" />
      </div>
      <div class="filter-group">
        <label>Finca:</label>
        <select v-model="filtros.fincaId">
          <option value="">Todas</option>
          <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
            {{ finca.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Producto:</label>
        <select v-model="filtros.productoId">
          <option value="">Todos</option>
          <option v-for="producto in productos" :key="producto.id" :value="producto.id">
            {{ producto.code }} - {{ producto.name }}
          </option>
        </select>
      </div>
      <button class="btn-generar" @click="generarReporte" :disabled="loading">
        {{ loading ? 'Generando...' : '🔍 Generar' }}
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="reporte" class="summary-cards">
      <div class="card entradas">
        <div class="value">{{ reporte.totales.totalEntradas }}</div>
        <div class="label">Total Entradas</div>
      </div>
      <div class="card salidas">
        <div class="value">{{ reporte.totales.totalSalidas }}</div>
        <div class="label">Total Salidas</div>
      </div>
      <div class="card">
        <div class="value">{{ reporte.totales.balanceNeto }}</div>
        <div class="label">Balance Neto</div>
      </div>
      <div class="card highlight">
        <div class="value">{{ reporte.totales.stockActual }}</div>
        <div class="label">Stock Actual</div>
      </div>
    </div>

    <!-- Products Kardex -->
    <div v-if="reporte && reporte.productos.length > 0" class="section">
      <h2>Movimientos por Producto</h2>

      <div v-for="producto in reporte.productos" :key="producto.productoId" class="producto-card">
        <div class="producto-header">
          <div class="producto-info">
            <strong>{{ producto.productoCode }}</strong> - {{ producto.productoName }}
          </div>
          <div class="producto-balance">
            <span class="entradas">+{{ producto.entradasSalidas.totalEntradas }}</span>
            <span class="salidas">-{{ producto.entradasSalidas.totalSalidas }}</span>
            <span class="balance">= {{ producto.entradasSalidas.balance }}</span>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Descripcion</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mov, index) in producto.movimientos" :key="index">
              <td>{{ formatDate(mov.fecha) }}</td>
              <td>
                <span :class="['tipo-badge', mov.tipo.toLowerCase()]">
                  {{ mov.tipo }}
                </span>
              </td>
              <td>{{ mov.descripcion }}</td>
              <td class="entrada">{{ mov.entrada > 0 ? '+' + mov.entrada : '-' }}</td>
              <td class="salida">{{ mov.salida > 0 ? '-' + mov.salida : '-' }}</td>
              <td class="saldo">{{ mov.saldo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="reporte && reporte.productos.length === 0" class="empty-state">
      No hay movimientos para el periodo seleccionado.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ReportesService from '@/services/ReportesConsolidadosService'
import FincaService from '@/services/FincaService'
import ProductoService from '@/services/ProductoService'
import type { ReporteKardex } from '@/types/Reportes'
import type { Finca } from '@/types/Finca'
import type { Producto } from '@/types/Producto'

const loading = ref(false)
const reporte = ref<ReporteKardex | null>(null)
const fincas = ref<Finca[]>([])
const productos = ref<Producto[]>([])

const getDefaultDates = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    inicio: firstDay.toISOString().split('T')[0],
    fin: lastDay.toISOString().split('T')[0]
  }
}

const defaultDates = getDefaultDates()

const filtros = reactive({
  fechaInicio: defaultDates.inicio,
  fechaFin: defaultDates.fin,
  fincaId: '',
  productoId: ''
})

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('es-ES')
}

const cargarFincas = async () => {
  try {
    const response = await FincaService.getAll()
    fincas.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading fincas:', error)
  }
}

const cargarProductos = async () => {
  try {
    const response = await ProductoService.getAll()
    productos.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading productos:', error)
  }
}

const generarReporte = async () => {
  if (!filtros.fechaInicio || !filtros.fechaFin) {
    alert('Seleccione las fechas de inicio y fin')
    return
  }

  loading.value = true
  try {
    const params = {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      fincaId: filtros.fincaId || undefined,
      productoIds: filtros.productoId ? [filtros.productoId] : undefined
    }
    const response = await ReportesService.getKardexConsolidado(params)
    reporte.value = response.data
  } catch (error) {
    console.error('Error generating report:', error)
    alert('Error al generar el reporte')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarFincas()
  cargarProductos()
  generarReporte()
})
</script>

<style scoped>
.reporte-kardex {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.btn-back {
  color: #3498db;
  text-decoration: none;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 0.85rem;
  color: #666;
}

.filter-group select,
.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.btn-generar {
  padding: 10px 20px;
  background: #9b59b6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-generar:hover {
  background: #8e44ad;
}

.btn-generar:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e0e0e0;
}

.card.highlight {
  background: #9b59b6;
  color: white;
}

.card.entradas {
  border-left: 4px solid #27ae60;
}

.card.salidas {
  border-left: 4px solid #e74c3c;
}

.card .value {
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.card .label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.section h2 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.producto-card {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.producto-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.producto-info strong {
  color: #9b59b6;
}

.producto-balance {
  display: flex;
  gap: 15px;
  font-weight: bold;
}

.producto-balance .entradas {
  color: #27ae60;
}

.producto-balance .salidas {
  color: #e74c3c;
}

.producto-balance .balance {
  color: #2c3e50;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 10px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
  color: #666;
  font-size: 0.85rem;
}

.tipo-badge {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  text-transform: uppercase;
}

.tipo-badge.entrada_produccion,
.tipo-badge.entrada_factura,
.tipo-badge.entrada_conduce,
.tipo-badge.ajuste_positivo {
  background: #d4edda;
  color: #155724;
}

.tipo-badge.salida_vale,
.tipo-badge.salida_factura,
.tipo-badge.ajuste_negativo {
  background: #f8d7da;
  color: #721c24;
}

.entrada {
  color: #27ae60;
  font-weight: bold;
}

.salida {
  color: #e74c3c;
  font-weight: bold;
}

.saldo {
  font-weight: bold;
  color: #2c3e50;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}
</style>
