<template>
  <div class="libro-diario">
    <div class="page-header">
      <h1>Libro Diario</h1>
      <p class="subtitle">Asientos contables generados automáticamente</p>
    </div>

    <!-- Filtros -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group">
          <label>Fecha Inicio</label>
          <input type="date" v-model="fechaInicio" @change="loadAsientos" />
        </div>
        <div class="filter-group">
          <label>Fecha Fin</label>
          <input type="date" v-model="fechaFin" @change="loadAsientos" />
        </div>
        <button class="btn btn-primary" @click="loadAsientos">
          <i class="fas fa-search"></i> Buscar
        </button>
      </div>

      <!-- Totales del período -->
      <div class="totales-row" v-if="totales">
        <div class="total-card">
          <span class="total-label">Total Débito</span>
          <span class="total-value debe">{{ formatCurrency(totales.totalDebito) }}</span>
        </div>
        <div class="total-card">
          <span class="total-label">Total Crédito</span>
          <span class="total-value haber">{{ formatCurrency(totales.totalCredito) }}</span>
        </div>
        <div class="total-card" :class="{ 'cuadrado': totales.diferencia === 0 }">
          <span class="total-label">Diferencia</span>
          <span class="total-value">{{ formatCurrency(totales.diferencia) }}</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando asientos...</p>
    </div>

    <!-- Lista de asientos -->
    <div v-else class="asientos-list">
      <div v-if="asientos.length === 0" class="empty-state">
        <i class="fas fa-book-open"></i>
        <p>No hay asientos contables en el período seleccionado</p>
      </div>

      <div v-for="asiento in asientos" :key="asiento.id" class="asiento-card">
        <div class="asiento-header">
          <div class="asiento-info">
            <span class="asiento-numero">{{ asiento.numero }}</span>
            <span class="asiento-fecha">{{ formatDate(asiento.fecha) }}</span>
          </div>
          <div class="asiento-estado" :class="{ 'asentado': asiento.asentado }">
            {{ asiento.asentado ? 'Asentado' : 'Pendiente' }}
          </div>
        </div>

        <div class="asiento-descripcion">
          {{ asiento.descripcion || 'Sin descripción' }}
        </div>

        <table class="lineas-table">
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Concepto</th>
              <th>Centro Costo</th>
              <th class="text-right">Debe</th>
              <th class="text-right">Haber</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="linea in asiento.lineas" :key="linea.id">
              <td>
                <span class="cuenta-codigo">{{ linea.codigoCuenta }}</span>
                <span class="cuenta-nombre">{{ linea.nombreCuenta }}</span>
              </td>
              <td>{{ linea.concepto || '-' }}</td>
              <td>{{ linea.centroCosto || '-' }}</td>
              <td class="text-right debe">
                {{ linea.debe > 0 ? formatCurrency(linea.debe) : '' }}
              </td>
              <td class="text-right haber">
                {{ linea.haber > 0 ? formatCurrency(linea.haber) : '' }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" class="text-right"><strong>Totales:</strong></td>
              <td class="text-right debe"><strong>{{ formatCurrency(asiento.totalDebe) }}</strong></td>
              <td class="text-right haber"><strong>{{ formatCurrency(asiento.totalHaber) }}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="asiento-footer">
          <span v-if="asiento.movimientoStockId" class="movimiento-ref">
            <i class="fas fa-link"></i> Ref. técnica de movimiento: {{ asiento.movimientoStockId }}
          </span>
          <span v-if="asiento.fechaAsentado" class="fecha-asentado">
            Asentado: {{ formatDateTime(asiento.fechaAsentado) }} por {{ asiento.usuarioAsento }}
          </span>
        </div>
      </div>

      <!-- Paginación -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          class="btn btn-sm"
          :disabled="currentPage === 0"
          @click="changePage(currentPage - 1)"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="page-info">
          Página {{ currentPage + 1 }} de {{ totalPages }}
        </span>
        <button
          class="btn btn-sm"
          :disabled="currentPage >= totalPages - 1"
          @click="changePage(currentPage + 1)"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AsientoContableService } from '@/services/ContabilidadService'
import type { AsientoContable, TotalesPeriodo } from '@/types/Contabilidad'

const loading = ref(false)
const asientos = ref<AsientoContable[]>([])
const totales = ref<TotalesPeriodo | null>(null)
const currentPage = ref(0)
const totalPages = ref(0)
const pageSize = ref(10)

// Default to current month
const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const fechaInicio = ref(firstDayOfMonth.toISOString().split('T')[0])
const fechaFin = ref(today.toISOString().split('T')[0])

const loadAsientos = async () => {
  loading.value = true
  try {
    const [asientosData, totalesData] = await Promise.all([
      AsientoContableService.getByFecha(fechaInicio.value, fechaFin.value),
      AsientoContableService.getTotalesPorPeriodo(fechaInicio.value, fechaFin.value)
    ])

    // Load full details with lines for each asiento
    const asientosConLineas = await Promise.all(
      asientosData.map((a) => AsientoContableService.getById(a.id))
    )

    asientos.value = asientosConLineas
    totales.value = totalesData
    totalPages.value = Math.ceil(asientosConLineas.length / pageSize.value)
  } catch (error) {
    console.error('Error loading asientos:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  currentPage.value = page
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CU', {
    style: 'currency',
    currency: 'CUP'
  }).format(value || 0)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CU')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-CU')
}

onMounted(() => {
  loadAsientos()
})
</script>

<style scoped>
.libro-diario {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.subtitle {
  color: #6c757d;
  margin: 0.25rem 0 0 0;
}

.filters-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: #6c757d;
}

.filter-group input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.totales-row {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.total-card {
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.total-card.cuadrado {
  background: #d4edda;
}

.total-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
}

.total-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.total-value.debe {
  color: #28a745;
}

.total-value.haber {
  color: #dc3545;
}

.loading-container {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.asiento-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
}

.asiento-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.asiento-info {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.asiento-numero {
  font-weight: 600;
  color: #2c3e50;
}

.asiento-fecha {
  color: #6c757d;
}

.asiento-estado {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  background: #ffc107;
  color: #856404;
}

.asiento-estado.asentado {
  background: #d4edda;
  color: #155724;
}

.asiento-descripcion {
  padding: 0.75rem 1rem;
  color: #495057;
  font-style: italic;
  border-bottom: 1px solid #eee;
}

.lineas-table {
  width: 100%;
  border-collapse: collapse;
}

.lineas-table th,
.lineas-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.lineas-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6c757d;
}

.lineas-table tfoot td {
  background: #f8f9fa;
  border-top: 2px solid #ddd;
}

.cuenta-codigo {
  font-family: monospace;
  font-weight: 600;
  margin-right: 0.5rem;
}

.cuenta-nombre {
  color: #6c757d;
  font-size: 0.875rem;
}

.text-right {
  text-align: right;
}

.debe {
  color: #28a745;
}

.haber {
  color: #dc3545;
}

.asiento-footer {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  font-size: 0.75rem;
  color: #6c757d;
}

.movimiento-ref i {
  margin-right: 0.25rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.page-info {
  color: #6c757d;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  color: #495057;
}

.btn-sm:hover:not(:disabled) {
  background: #dee2e6;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
