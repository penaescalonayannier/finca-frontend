<template>
  <div class="reglas-contabilizacion">
    <div class="page-header">
      <h1>Reglas de Contabilización</h1>
      <p class="subtitle">Mapeo automático de movimientos físicos a cuentas contables</p>
    </div>

    <!-- Acciones -->
    <div class="actions-card">
      <button class="btn btn-primary" @click="showNewModal = true">
        <i class="fas fa-plus"></i> Nueva Regla
      </button>
      <div class="filter-group">
        <label>Filtrar por tipo:</label>
        <select v-model="filtroTipo" @change="filterReglas">
          <option value="">Todos</option>
          <option v-for="tipo in tiposMovimiento" :key="tipo" :value="tipo">
            {{ formatTipoMovimiento(tipo) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando reglas...</p>
    </div>

    <!-- Lista de reglas -->
    <div v-else class="reglas-list">
      <div v-if="reglasFiltradas.length === 0" class="empty-state">
        <i class="fas fa-cogs"></i>
        <p>No hay reglas de contabilización configuradas</p>
      </div>

      <div
        v-for="regla in reglasFiltradas"
        :key="regla.id"
        class="regla-card"
        :class="{ 'inactiva': !regla.activo }"
      >
        <div class="regla-header">
          <div class="regla-tipo">
            <span class="tipo-badge" :class="getTipoBadgeClass(regla.tipoMovimiento)">
              {{ formatTipoMovimiento(regla.tipoMovimiento) }}
            </span>
            <span v-if="regla.tipoProducto" class="producto-badge">
              {{ regla.tipoProducto }}
            </span>
          </div>
          <div class="regla-actions">
            <span class="prioridad">Prioridad: {{ regla.prioridad }}</span>
            <button
              class="btn-icon"
              :class="regla.activo ? 'btn-warning' : 'btn-success'"
              @click="toggleActivo(regla)"
              :title="regla.activo ? 'Desactivar' : 'Activar'"
            >
              <i :class="regla.activo ? 'fas fa-pause' : 'fas fa-play'"></i>
            </button>
          </div>
        </div>

        <div class="regla-cuentas">
          <div class="cuenta-flow">
            <div class="cuenta debe">
              <span class="cuenta-label">DÉBITO</span>
              <span class="cuenta-codigo">{{ regla.cuentaDebito }}</span>
              <span v-if="regla.centroCostoDebito" class="centro-costo">
                CC: {{ regla.centroCostoDebito }}
              </span>
            </div>
            <i class="fas fa-arrow-right flow-arrow"></i>
            <div class="cuenta haber">
              <span class="cuenta-label">CRÉDITO</span>
              <span class="cuenta-codigo">{{ regla.cuentaCredito }}</span>
              <span v-if="regla.centroCostoCredito" class="centro-costo">
                CC: {{ regla.centroCostoCredito }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="regla.descripcionPlantilla" class="regla-plantilla">
          <i class="fas fa-file-alt"></i>
          {{ regla.descripcionPlantilla }}
        </div>

        <div class="regla-footer">
          <span v-if="regla.fincaId" class="scope-badge">
            <i class="fas fa-home"></i> Finca específica
          </span>
          <span v-if="regla.almacenId" class="scope-badge">
            <i class="fas fa-warehouse"></i> Almacén específico
          </span>
          <span v-if="!regla.fincaId && !regla.almacenId" class="scope-badge global">
            <i class="fas fa-globe"></i> Regla global
          </span>
        </div>
      </div>
    </div>

    <!-- Modal Nueva Regla -->
    <div v-if="showNewModal" class="modal-overlay" @click.self="showNewModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Nueva Regla de Contabilización</h2>
          <button class="btn-close" @click="showNewModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Tipo de Movimiento *</label>
            <select v-model="nuevaRegla.tipoMovimiento" required>
              <option value="">Seleccionar...</option>
              <option v-for="tipo in tiposMovimiento" :key="tipo" :value="tipo">
                {{ formatTipoMovimiento(tipo) }}
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Cuenta Débito *</label>
              <input
                type="text"
                v-model="nuevaRegla.cuentaDebito"
                placeholder="Ej: 183"
                required
              />
            </div>
            <div class="form-group">
              <label>Centro Costo Débito</label>
              <input
                type="text"
                v-model="nuevaRegla.centroCostoDebito"
                placeholder="Ej: 700.01"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Cuenta Crédito *</label>
              <input
                type="text"
                v-model="nuevaRegla.cuentaCredito"
                placeholder="Ej: 193"
                required
              />
            </div>
            <div class="form-group">
              <label>Centro Costo Crédito</label>
              <input
                type="text"
                v-model="nuevaRegla.centroCostoCredito"
                placeholder="Ej: 700.02"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Tipo de Producto</label>
            <select v-model="nuevaRegla.tipoProducto">
              <option value="">Todos los productos</option>
              <option value="PRODUCCION">Producción</option>
              <option value="INSUMO">Insumo</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>

          <div class="form-group">
            <label>Prioridad</label>
            <input
              type="number"
              v-model.number="nuevaRegla.prioridad"
              min="1"
              max="999"
            />
            <small>Menor número = mayor prioridad</small>
          </div>

          <div class="form-group">
            <label>Plantilla de Descripción</label>
            <input
              type="text"
              v-model="nuevaRegla.descripcionPlantilla"
              placeholder="Ej: {tipo} - {producto} x {cantidad}"
            />
            <small>Variables: {tipo}, {producto}, {cantidad}</small>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showNewModal = false">
            Cancelar
          </button>
          <button class="btn btn-primary" @click="crearRegla" :disabled="!isFormValid">
            <i class="fas fa-save"></i> Guardar Regla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ReglaContabilizacionService } from '@/services/ContabilidadService'
import type { ReglaContabilizacion } from '@/types/Contabilidad'

const loading = ref(false)
const reglas = ref<ReglaContabilizacion[]>([])
const tiposMovimiento = ref<string[]>([])
const filtroTipo = ref('')
const showNewModal = ref(false)

const nuevaRegla = ref<Partial<ReglaContabilizacion>>({
  tipoMovimiento: '',
  cuentaDebito: '',
  cuentaCredito: '',
  centroCostoDebito: '',
  centroCostoCredito: '',
  tipoProducto: '',
  prioridad: 100,
  descripcionPlantilla: '',
  activo: true
})

const reglasFiltradas = computed(() => {
  if (!filtroTipo.value) return reglas.value
  return reglas.value.filter((r) => r.tipoMovimiento === filtroTipo.value)
})

const isFormValid = computed(() => {
  return (
    nuevaRegla.value.tipoMovimiento &&
    nuevaRegla.value.cuentaDebito &&
    nuevaRegla.value.cuentaCredito
  )
})

const loadReglas = async () => {
  loading.value = true
  try {
    const [reglasData, tiposData] = await Promise.all([
      ReglaContabilizacionService.getAll(),
      ReglaContabilizacionService.getAllTiposMovimiento()
    ])
    reglas.value = reglasData
    tiposMovimiento.value = tiposData
  } catch (error) {
    console.error('Error loading reglas:', error)
  } finally {
    loading.value = false
  }
}

const filterReglas = () => {
  // The filtering is handled by the computed property
}

const toggleActivo = async (regla: ReglaContabilizacion) => {
  try {
    if (regla.activo) {
      await ReglaContabilizacionService.desactivar(regla.id!)
    } else {
      await ReglaContabilizacionService.activar(regla.id!)
    }
    regla.activo = !regla.activo
  } catch (error) {
    console.error('Error toggling regla:', error)
  }
}

const crearRegla = async () => {
  try {
    const created = await ReglaContabilizacionService.create(
      nuevaRegla.value as ReglaContabilizacion
    )
    reglas.value.push(created)
    showNewModal.value = false
    resetNuevaRegla()
  } catch (error) {
    console.error('Error creating regla:', error)
  }
}

const resetNuevaRegla = () => {
  nuevaRegla.value = {
    tipoMovimiento: '',
    cuentaDebito: '',
    cuentaCredito: '',
    centroCostoDebito: '',
    centroCostoCredito: '',
    tipoProducto: '',
    prioridad: 100,
    descripcionPlantilla: '',
    activo: true
  }
}

const formatTipoMovimiento = (tipo: string): string => {
  const labels: Record<string, string> = {
    STOCK_INICIAL: 'Stock Inicial',
    ENTRADA_PRODUCCION: 'Entrada Producción',
    ENTRADA_FACTURA: 'Entrada Factura',
    ENTRADA_CONDUCE: 'Entrada Conduce',
    ENTRADA_AJUSTE: 'Entrada Ajuste',
    TRANSFERENCIA_ENTRADA: 'Transferencia Entrada',
    SALIDA_VENTA: 'Salida/Venta',
    SALIDA_AUTOCONSUMO: 'Autoconsumo',
    SALIDA_AJUSTE: 'Salida Ajuste',
    TRANSFERENCIA_SALIDA: 'Transferencia Salida',
    AJUSTE_MANUAL: 'Ajuste Manual',
    AJUSTE_EDICION: 'Ajuste Edición',
    DEVOLUCION: 'Devolución',
    REVERSION_PRODUCCION: 'Reversión Producción',
    REVERSION_SALIDA: 'Reversión Salida'
  }
  return labels[tipo] || tipo
}

const getTipoBadgeClass = (tipo: string): string => {
  if (tipo.startsWith('ENTRADA') || tipo === 'STOCK_INICIAL') return 'entrada'
  if (tipo.startsWith('SALIDA') || tipo.startsWith('TRANSFERENCIA_SALIDA')) return 'salida'
  if (tipo.startsWith('AJUSTE') || tipo.startsWith('REVERSION')) return 'ajuste'
  return 'otro'
}

onMounted(() => {
  loadReglas()
})
</script>

<style scoped>
.reglas-contabilizacion {
  padding: 1.5rem;
  max-width: 1200px;
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

.actions-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: #6c757d;
}

.filter-group select {
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

.regla-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  overflow: hidden;
}

.regla-card.inactiva {
  opacity: 0.6;
  background: #f8f9fa;
}

.regla-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.regla-tipo {
  display: flex;
  gap: 0.5rem;
}

.tipo-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tipo-badge.entrada {
  background: #d4edda;
  color: #155724;
}

.tipo-badge.salida {
  background: #f8d7da;
  color: #721c24;
}

.tipo-badge.ajuste {
  background: #fff3cd;
  color: #856404;
}

.tipo-badge.otro {
  background: #d1ecf1;
  color: #0c5460;
}

.producto-badge {
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.75rem;
}

.regla-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.prioridad {
  font-size: 0.75rem;
  color: #6c757d;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-icon.btn-success {
  background: #28a745;
  color: white;
}

.regla-cuentas {
  padding: 1.5rem;
}

.cuenta-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.cuenta {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 2rem;
  border-radius: 8px;
  min-width: 150px;
}

.cuenta.debe {
  background: #e8f5e9;
  border: 2px solid #28a745;
}

.cuenta.haber {
  background: #ffebee;
  border: 2px solid #dc3545;
}

.cuenta-label {
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.cuenta.debe .cuenta-label {
  color: #28a745;
}

.cuenta.haber .cuenta-label {
  color: #dc3545;
}

.cuenta-codigo {
  font-family: monospace;
  font-size: 1.25rem;
  font-weight: 600;
}

.centro-costo {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.flow-arrow {
  font-size: 1.5rem;
  color: #6c757d;
}

.regla-plantilla {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  font-size: 0.875rem;
  color: #6c757d;
}

.regla-plantilla i {
  margin-right: 0.5rem;
}

.regla-footer {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #eee;
}

.scope-badge {
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #495057;
}

.scope-badge.global {
  background: #007bff;
  color: white;
}

.scope-badge i {
  margin-right: 0.25rem;
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
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #495057;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6c757d;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
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

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
