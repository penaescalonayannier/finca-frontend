<template>
  <div class="mayor-cuenta">
    <div class="page-header">
      <h1>Mayor por Cuenta</h1>
      <p class="subtitle">Movimientos detallados por cuenta contable</p>
    </div>

    <!-- Filtros -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="filter-group cuenta-select">
          <label>Cuenta Contable</label>
          <div class="search-input">
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Buscar cuenta..."
              @input="searchCuentas"
            />
            <div v-if="showDropdown && cuentasFiltradas.length > 0" class="dropdown-list">
              <div
                v-for="cuenta in cuentasFiltradas"
                :key="cuenta.id"
                class="dropdown-item"
                @click="selectCuenta(cuenta)"
              >
                <span class="cuenta-codigo">{{ cuenta.codigo }}</span>
                <span class="cuenta-nombre">{{ cuenta.nombre }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="filter-group">
          <label>Fecha Inicio</label>
          <input type="date" v-model="fechaInicio" />
        </div>
        <div class="filter-group">
          <label>Fecha Fin</label>
          <input type="date" v-model="fechaFin" />
        </div>
        <button class="btn btn-primary" @click="loadMayor" :disabled="!cuentaSeleccionada">
          <i class="fas fa-search"></i> Consultar
        </button>
      </div>

      <div v-if="cuentaSeleccionada" class="cuenta-seleccionada">
        <span class="badge">{{ cuentaSeleccionada.codigo }}</span>
        {{ cuentaSeleccionada.nombre }}
        <button class="btn-clear" @click="clearCuenta">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando mayor...</p>
    </div>

    <!-- Resultado -->
    <div v-else-if="mayor" class="mayor-resultado">
      <!-- Resumen -->
      <div class="resumen-card">
        <div class="resumen-item">
          <span class="label">Total Débito</span>
          <span class="value debe">{{ formatCurrency(mayor.totalDebe) }}</span>
        </div>
        <div class="resumen-item">
          <span class="label">Total Crédito</span>
          <span class="value haber">{{ formatCurrency(mayor.totalHaber) }}</span>
        </div>
        <div class="resumen-item saldo">
          <span class="label">Saldo</span>
          <span class="value" :class="mayor.saldo >= 0 ? 'debe' : 'haber'">
            {{ formatCurrency(Math.abs(mayor.saldo)) }}
            {{ mayor.saldo >= 0 ? '(Deudor)' : '(Acreedor)' }}
          </span>
        </div>
      </div>

      <!-- Tabla de movimientos -->
      <div class="movimientos-card">
        <table class="movimientos-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>N° Asiento</th>
              <th>Concepto</th>
              <th>Centro Costo</th>
              <th class="text-right">Debe</th>
              <th class="text-right">Haber</th>
              <th class="text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="mayor.movimientos.length === 0">
              <td colspan="7" class="empty-row">
                No hay movimientos en el período seleccionado
              </td>
            </tr>
            <tr v-for="mov in movimientosConSaldo" :key="mov.id">
              <td>{{ formatDate(mov.fecha) }}</td>
              <td>
                <span class="asiento-link">{{ mov.numeroAsiento }}</span>
              </td>
              <td>{{ mov.concepto || '-' }}</td>
              <td>{{ mov.centroCosto || '-' }}</td>
              <td class="text-right debe">
                {{ mov.debe > 0 ? formatCurrency(mov.debe) : '' }}
              </td>
              <td class="text-right haber">
                {{ mov.haber > 0 ? formatCurrency(mov.haber) : '' }}
              </td>
              <td class="text-right" :class="mov.saldoAcumulado >= 0 ? 'debe' : 'haber'">
                {{ formatCurrency(Math.abs(mov.saldoAcumulado)) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" class="text-right"><strong>Totales:</strong></td>
              <td class="text-right debe"><strong>{{ formatCurrency(mayor.totalDebe) }}</strong></td>
              <td class="text-right haber"><strong>{{ formatCurrency(mayor.totalHaber) }}</strong></td>
              <td class="text-right" :class="mayor.saldo >= 0 ? 'debe' : 'haber'">
                <strong>{{ formatCurrency(Math.abs(mayor.saldo)) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-else class="empty-state">
      <i class="fas fa-calculator"></i>
      <p>Seleccione una cuenta y un período para consultar el mayor</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CuentaContableService, AsientoContableService } from '@/services/ContabilidadService'
import type { CuentaContable, MayorPorCuenta, MovimientoMayor } from '@/types/Contabilidad'

const loading = ref(false)
const cuentas = ref<CuentaContable[]>([])
const cuentasFiltradas = ref<CuentaContable[]>([])
const cuentaSeleccionada = ref<CuentaContable | null>(null)
const mayor = ref<MayorPorCuenta | null>(null)
const searchQuery = ref('')
const showDropdown = ref(false)

const today = new Date()
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
const fechaInicio = ref(firstDayOfMonth.toISOString().split('T')[0])
const fechaFin = ref(today.toISOString().split('T')[0])

interface MovimientoConSaldo extends MovimientoMayor {
  saldoAcumulado: number
}

const movimientosConSaldo = computed((): MovimientoConSaldo[] => {
  if (!mayor.value) return []

  let saldo = 0
  return mayor.value.movimientos.map((mov) => {
    saldo += mov.debe - mov.haber
    return { ...mov, saldoAcumulado: saldo }
  })
})

const loadCuentas = async () => {
  try {
    cuentas.value = await CuentaContableService.getCuentasMovibles()
  } catch (error) {
    console.error('Error loading cuentas:', error)
  }
}

const searchCuentas = () => {
  if (searchQuery.value.length < 1) {
    cuentasFiltradas.value = []
    showDropdown.value = false
    return
  }

  const query = searchQuery.value.toLowerCase()
  cuentasFiltradas.value = cuentas.value
    .filter(
      (c) =>
        c.codigo.toLowerCase().includes(query) || c.nombre.toLowerCase().includes(query)
    )
    .slice(0, 10)
  showDropdown.value = true
}

const selectCuenta = (cuenta: CuentaContable) => {
  cuentaSeleccionada.value = cuenta
  searchQuery.value = ''
  showDropdown.value = false
  cuentasFiltradas.value = []
}

const clearCuenta = () => {
  cuentaSeleccionada.value = null
  mayor.value = null
}

const loadMayor = async () => {
  if (!cuentaSeleccionada.value) return

  loading.value = true
  try {
    mayor.value = await AsientoContableService.getMayorPorCuenta(
      cuentaSeleccionada.value.codigo,
      fechaInicio.value,
      fechaFin.value
    )
  } catch (error) {
    console.error('Error loading mayor:', error)
  } finally {
    loading.value = false
  }
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
.mayor-cuenta {
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

.cuenta-select {
  flex: 1;
  min-width: 300px;
  position: relative;
}

.search-input {
  position: relative;
}

.search-input input {
  width: 100%;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #eee;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.cuenta-codigo {
  font-family: monospace;
  font-weight: 600;
  color: #007bff;
}

.cuenta-nombre {
  color: #495057;
}

.cuenta-seleccionada {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #e7f3ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  background: #007bff;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.875rem;
}

.btn-clear {
  margin-left: auto;
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 0.25rem;
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

.resumen-card {
  display: flex;
  gap: 2rem;
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.resumen-item {
  display: flex;
  flex-direction: column;
}

.resumen-item.saldo {
  margin-left: auto;
  padding-left: 2rem;
  border-left: 2px solid #eee;
}

.resumen-item .label {
  font-size: 0.75rem;
  color: #6c757d;
  text-transform: uppercase;
}

.resumen-item .value {
  font-size: 1.5rem;
  font-weight: 600;
}

.debe {
  color: #28a745;
}

.haber {
  color: #dc3545;
}

.movimientos-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.movimientos-table {
  width: 100%;
  border-collapse: collapse;
}

.movimientos-table th,
.movimientos-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.movimientos-table th {
  background: #f8f9fa;
  font-weight: 600;
  font-size: 0.875rem;
  color: #6c757d;
}

.movimientos-table tfoot td {
  background: #f8f9fa;
  border-top: 2px solid #ddd;
}

.empty-row {
  text-align: center;
  color: #6c757d;
  padding: 2rem !important;
}

.asiento-link {
  color: #007bff;
  font-family: monospace;
}

.text-right {
  text-align: right;
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

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
