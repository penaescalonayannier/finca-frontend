<template>
  <div class="balance-comprobacion">
    <div class="page-header">
      <h1>Balance de Comprobación</h1>
      <p class="subtitle">Verificación del equilibrio contable</p>
    </div>

    <!-- Filtros -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group">
          <label>Fecha Inicio</label>
          <input type="date" v-model="fechaInicio" />
        </div>
        <div class="filter-group">
          <label>Fecha Fin</label>
          <input type="date" v-model="fechaFin" />
        </div>
        <button class="btn btn-primary" @click="loadBalance">
          <i class="fas fa-sync"></i> Generar Balance
        </button>
        <button v-if="balance" class="btn btn-secondary" @click="exportPDF">
          <i class="fas fa-file-pdf"></i> Exportar PDF
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Generando balance de comprobación...</p>
    </div>

    <!-- Resultado -->
    <div v-else-if="balance" class="balance-resultado">
      <!-- Estado del balance -->
      <div class="estado-card" :class="{ 'cuadrado': balance.cuadrado, 'descuadrado': !balance.cuadrado }">
        <i :class="balance.cuadrado ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle'"></i>
        <div class="estado-info">
          <span class="estado-titulo">
            {{ balance.cuadrado ? 'Balance Cuadrado' : 'Balance Descuadrado' }}
          </span>
          <span class="estado-detalle">
            {{ balance.cuadrado
              ? 'Los débitos y créditos están equilibrados'
              : 'Existe una diferencia de ' + formatCurrency(Math.abs(balance.totalDebe - balance.totalHaber))
            }}
          </span>
        </div>
      </div>

      <!-- Totales -->
      <div class="totales-row">
        <div class="total-card">
          <span class="total-label">Total Débitos</span>
          <span class="total-value debe">{{ formatCurrency(balance.totalDebe) }}</span>
        </div>
        <div class="total-card">
          <span class="total-label">Total Créditos</span>
          <span class="total-value haber">{{ formatCurrency(balance.totalHaber) }}</span>
        </div>
        <div class="total-card">
          <span class="total-label">Cuentas con Movimiento</span>
          <span class="total-value">{{ balance.cuentas.length }}</span>
        </div>
      </div>

      <!-- Tabla de balance -->
      <div class="balance-card">
        <table class="balance-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre de la Cuenta</th>
              <th class="text-right">Debe</th>
              <th class="text-right">Haber</th>
              <th class="text-right">Saldo Deudor</th>
              <th class="text-right">Saldo Acreedor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="balance.cuentas.length === 0">
              <td colspan="6" class="empty-row">
                No hay movimientos en el período seleccionado
              </td>
            </tr>
            <tr
              v-for="cuenta in cuentasConNombre"
              :key="cuenta.codigoCuenta"
              class="cuenta-row"
              @click="verDetalleCuenta(cuenta.codigoCuenta, cuenta.nombreCuenta)"
              title="Clic para ver detalle de movimientos"
            >
              <td class="cuenta-codigo">{{ cuenta.codigoCuenta }}</td>
              <td>{{ cuenta.nombreCuenta || 'Sin nombre' }} <i class="fas fa-search-plus detalle-icon"></i></td>
              <td class="text-right">{{ formatCurrency(cuenta.debe) }}</td>
              <td class="text-right">{{ formatCurrency(cuenta.haber) }}</td>
              <td class="text-right debe">
                {{ cuenta.saldoDeudor > 0 ? formatCurrency(cuenta.saldoDeudor) : '' }}
              </td>
              <td class="text-right haber">
                {{ cuenta.saldoAcreedor > 0 ? formatCurrency(cuenta.saldoAcreedor) : '' }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="text-right"><strong>TOTALES:</strong></td>
              <td class="text-right"><strong>{{ formatCurrency(balance.totalDebe) }}</strong></td>
              <td class="text-right"><strong>{{ formatCurrency(balance.totalHaber) }}</strong></td>
              <td class="text-right debe"><strong>{{ formatCurrency(totalSaldoDeudor) }}</strong></td>
              <td class="text-right haber"><strong>{{ formatCurrency(totalSaldoAcreedor) }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Pie de página -->
      <div class="balance-footer">
        <span>Período: {{ formatDate(balance.fechaInicio) }} - {{ formatDate(balance.fechaFin) }}</span>
        <span>Generado: {{ new Date().toLocaleString('es-CU') }}</span>
      </div>
    </div>

    <!-- Modal de detalle de cuenta -->
    <div v-if="showDetalleModal" class="modal-overlay" @click.self="closeDetalleModal">
      <div class="modal-content modal-large">
        <div class="modal-header">
          <h3>
            <i class="fas fa-book"></i>
            Mayor de Cuenta: {{ detalleCuenta?.codigoCuenta }} - {{ detalleCuenta?.nombreCuenta }}
          </h3>
          <button class="btn-close" @click="closeDetalleModal">&times;</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingDetalle" class="loading-container">
            <div class="spinner"></div>
            <p>Cargando movimientos...</p>
          </div>
          <div v-else-if="mayorDetalle">
            <!-- Resumen -->
            <div class="detalle-resumen">
              <div class="resumen-item">
                <span class="resumen-label">Total Debe</span>
                <span class="resumen-value debe">{{ formatCurrency(mayorDetalle.totalDebe) }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Total Haber</span>
                <span class="resumen-value haber">{{ formatCurrency(mayorDetalle.totalHaber) }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Saldo</span>
                <span class="resumen-value" :class="mayorDetalle.saldo >= 0 ? 'debe' : 'haber'">
                  {{ formatCurrency(Math.abs(mayorDetalle.saldo)) }}
                  {{ mayorDetalle.saldo >= 0 ? '(D)' : '(A)' }}
                </span>
              </div>
            </div>

            <!-- Tabla de movimientos -->
            <table class="detalle-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Asiento</th>
                  <th>Concepto</th>
                  <th>Centro Costo</th>
                  <th class="text-right">Debe</th>
                  <th class="text-right">Haber</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="mayorDetalle.movimientos.length === 0">
                  <td colspan="6" class="empty-row">No hay movimientos</td>
                </tr>
                <tr v-for="mov in mayorDetalle.movimientos" :key="mov.id">
                  <td>{{ formatDate(mov.fecha) }}</td>
                  <td class="asiento-numero">{{ mov.numeroAsiento }}</td>
                  <td class="concepto-cell">{{ mov.concepto }}</td>
                  <td>{{ mov.centroCosto || '-' }}</td>
                  <td class="text-right debe">
                    {{ mov.debe > 0 ? formatCurrency(mov.debe) : '' }}
                  </td>
                  <td class="text-right haber">
                    {{ mov.haber > 0 ? formatCurrency(mov.haber) : '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDetalleModal">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="empty-state">
      <i class="fas fa-balance-scale"></i>
      <p>Seleccione un período y genere el balance de comprobación</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { AsientoContableService, CuentaContableService } from '@/services/ContabilidadService'
import type { BalanceComprobacion, BalanceCuenta, CuentaContable, MayorPorCuenta } from '@/types/Contabilidad'

const loading = ref(false)
const balance = ref<BalanceComprobacion | null>(null)
const cuentasMap = ref<Map<string, CuentaContable>>(new Map())

// Modal de detalle
const showDetalleModal = ref(false)
const loadingDetalle = ref(false)
const detalleCuenta = ref<{ codigoCuenta: string; nombreCuenta: string } | null>(null)
const mayorDetalle = ref<MayorPorCuenta | null>(null)

const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const fechaInicio = ref(firstDayOfMonth.toISOString().split('T')[0])
const fechaFin = ref(today.toISOString().split('T')[0])

interface BalanceCuentaConNombre extends BalanceCuenta {
  nombreCuenta: string
}

const cuentasConNombre = computed((): BalanceCuentaConNombre[] => {
  if (!balance.value) return []
  return balance.value.cuentas.map((c) => ({
    ...c,
    nombreCuenta: cuentasMap.value.get(c.codigoCuenta)?.nombre || ''
  }))
})

const totalSaldoDeudor = computed(() => {
  if (!balance.value) return 0
  return balance.value.cuentas.reduce((sum, c) => sum + c.saldoDeudor, 0)
})

const totalSaldoAcreedor = computed(() => {
  if (!balance.value) return 0
  return balance.value.cuentas.reduce((sum, c) => sum + c.saldoAcreedor, 0)
})

const loadCuentas = async () => {
  try {
    const cuentas = await CuentaContableService.getAll()
    cuentas.forEach((c) => cuentasMap.value.set(c.codigo, c))
  } catch (error) {
    console.error('Error loading cuentas:', error)
  }
}

const loadBalance = async () => {
  loading.value = true
  try {
    balance.value = await AsientoContableService.getBalanceComprobacion(
      fechaInicio.value,
      fechaFin.value
    )
  } catch (error) {
    console.error('Error loading balance:', error)
  } finally {
    loading.value = false
  }
}

const exportPDF = () => {
  // TODO: Implement PDF export
  alert('Función de exportación PDF pendiente de implementar')
}

const verDetalleCuenta = async (codigoCuenta: string, nombreCuenta: string) => {
  detalleCuenta.value = { codigoCuenta, nombreCuenta }
  showDetalleModal.value = true
  loadingDetalle.value = true

  try {
    mayorDetalle.value = await AsientoContableService.getMayorPorCuenta(
      codigoCuenta,
      fechaInicio.value,
      fechaFin.value
    )
  } catch (error) {
    console.error('Error loading mayor:', error)
    mayorDetalle.value = null
  } finally {
    loadingDetalle.value = false
  }
}

const closeDetalleModal = () => {
  showDetalleModal.value = false
  detalleCuenta.value = null
  mayorDetalle.value = null
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

onMounted(() => {
  loadCuentas()
})
</script>

<style scoped>
.balance-comprobacion {
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.estado-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.estado-card.cuadrado {
  background: #d4edda;
  color: #155724;
}

.estado-card.descuadrado {
  background: #f8d7da;
  color: #721c24;
}

.estado-card i {
  font-size: 2.5rem;
}

.estado-info {
  display: flex;
  flex-direction: column;
}

.estado-titulo {
  font-size: 1.25rem;
  font-weight: 600;
}

.estado-detalle {
  font-size: 0.875rem;
  opacity: 0.8;
}

.totales-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.total-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.total-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
}

.total-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.total-value.debe {
  color: #28a745;
}

.total-value.haber {
  color: #dc3545;
}

.balance-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.balance-table {
  width: 100%;
  border-collapse: collapse;
}

.balance-table th,
.balance-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.balance-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6c757d;
}

.balance-table tfoot td {
  background: #f8f9fa;
  border-top: 2px solid #ddd;
}

.empty-row {
  text-align: center;
  color: #6c757d;
  padding: 2rem !important;
}

.cuenta-codigo {
  font-family: monospace;
  font-weight: 600;
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

.balance-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.75rem;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

/* Filas clicables */
.cuenta-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.cuenta-row:hover {
  background-color: #e3f2fd;
}

.detalle-icon {
  font-size: 0.75rem;
  color: #6c757d;
  margin-left: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.cuenta-row:hover .detalle-icon {
  opacity: 1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-large {
  width: 90%;
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  line-height: 1;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Detalle de cuenta */
.detalle-resumen {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.resumen-item {
  display: flex;
  flex-direction: column;
}

.resumen-label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
}

.resumen-value {
  font-size: 1.25rem;
  font-weight: 600;
}

.detalle-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.detalle-table th,
.detalle-table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.detalle-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.8rem;
  color: #6c757d;
}

.asiento-numero {
  font-family: monospace;
  font-size: 0.85rem;
}

.concepto-cell {
  max-width: 300px;
}
</style>
