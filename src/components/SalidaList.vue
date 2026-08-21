<!-- src/components/SalidaList.vue -->

<template>
  <div class="salida-list">
    <h2>Gestión de Salidas (Vales/Facturas)</h2>

    <!-- Filtros -->
    <div class="search-bar">
      <div class="search-filters">
        <select v-model="filtroTipo" class="filter-select">
          <option value="">Todos los tipos</option>
          <option value="VALE">Vale</option>
          <option value="FACTURA">Factura</option>
        </select>

        <input
          v-model="searchQuery"
          placeholder="Buscar por número..."
          class="search-input"
          @keyup.enter="buscarConReset"
        />
      </div>

      <div class="button-group">
        <button @click="buscarConReset" class="btn-buscar">Buscar</button>
        <button @click="mostrarModalCrear = true" class="btn-crear">+ Nueva Salida</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">Cargando salidas...</div>

    <!-- Tabla -->
    <table v-else class="tabla-salidas">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Destino</th>
          <th>Número</th>
          <th>Finca</th>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="salidas.length === 0">
          <td colspan="8" class="no-data">No se encontraron salidas</td>
        </tr>
        <tr v-for="salida in salidas" :key="salida.id">
          <td>
            <span :class="['tipo-badge', salida.tipo === 'VALE' ? 'tipo-vale' : 'tipo-factura']">
              {{ salida.tipo }}
            </span>
          </td>
          <td>
            <span class="destino-badge">{{ formatDestino(salida.destino) }}</span>
          </td>
          <td><strong>{{ salida.numero }}</strong></td>
          <td>
            <strong>{{ salida.fincaCode }}</strong>
            <span class="subtext">{{ salida.fincaName }}</span>
          </td>
          <td>
            <strong>{{ salida.productoCode }}</strong>
            <span class="subtext">{{ salida.productoName }}</span>
          </td>
          <td class="cantidad-cell">{{ salida.cantidadTotal }}</td>
          <td>{{ formatFecha(salida.fecha) }}</td>
          <td class="acciones">
            <button @click="verDetalles(salida)" class="btn-ver">Ver</button>
            <button @click="descargarFactura(salida)" class="btn-descargar">PDF</button>
            <button @click="confirmarEliminar(salida)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginación -->
    <div v-if="!isLoading && salidas.length > 0" class="pagination">
      <div class="pagination-info">
        <span>Total: {{ totalElementos }} registros</span>
        <span class="separator">|</span>
        <label>
          Mostrar:
          <select v-model="tamanoPagina" @change="cambiarTamanoPagina" class="select-size">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button class="btn-pag" :disabled="paginaActual === 0" @click="cambiarPagina(paginaActual - 1)">
          Anterior
        </button>
        <span class="page-indicator">Página {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1" @click="cambiarPagina(paginaActual + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal Ver Detalles -->
    <div v-if="mostrarModalDetalles" class="modal">
      <div class="modal-content modal-grande">
        <span class="close" @click="cerrarModalDetalles">&times;</span>
        <h3>Detalles de Salida</h3>

        <div class="detalles-header">
          <div class="detalles-badges">
            <span :class="['tipo-badge-lg', salidaSeleccionada?.tipo === 'VALE' ? 'tipo-vale' : 'tipo-factura']">
              {{ salidaSeleccionada?.tipo }}
            </span>
            <span :class="['destino-badge-lg', 'destino-' + (salidaSeleccionada?.destino?.toLowerCase() || '')]">
              {{ formatDestino(salidaSeleccionada?.destino) }}
            </span>
          </div>
          <div class="detalles-numero">
            <strong>{{ salidaSeleccionada?.numero }}</strong>
          </div>
        </div>

        <div class="detalles-info">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Finca</span>
              <span class="info-value">{{ salidaSeleccionada?.fincaCode }} - {{ salidaSeleccionada?.fincaName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Producto</span>
              <span class="info-value">{{ salidaSeleccionada?.productoCode }} - {{ salidaSeleccionada?.productoName }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Fecha</span>
              <span class="info-value">{{ formatFecha(salidaSeleccionada?.fecha) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Observaciones</span>
              <span class="info-value">{{ salidaSeleccionada?.observaciones || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <h4>Items</h4>
        <table class="tabla-items">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in salidaSeleccionada?.items" :key="item.id">
              <td>{{ item.trabajadorNombre }}</td>
              <td class="cantidad-col">{{ item.cantidad }}</td>
              <td class="precio-col">${{ (item.precio || 0).toFixed(2) }}</td>
              <td class="subtotal-col">${{ ((item.cantidad || 0) * (item.precio || 0)).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-detalles">
          <div class="total-row">
            <span>Total Cantidad:</span>
            <strong>{{ salidaSeleccionada?.cantidadTotal }}</strong>
          </div>
          <div class="total-row total-valor">
            <span>Total Valor:</span>
            <strong>${{ calcularTotalValor().toFixed(2) }}</strong>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancelar" @click="cerrarModalDetalles">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal Crear Salida -->
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content modal-grande">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearSalida @created="handleSalidaCreada" @cancel="mostrarModalCrear = false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SalidaService from '@/services/SalidaService'
import CrearSalida from '@/components/CrearSalida.vue'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Salida } from '@/types/Salida'
import type { SearchFilter } from '@/types/EstadoCuenta'

// Estado
const salidas = ref<Salida[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const filtroTipo = ref('')

// Modales
const mostrarModalDetalles = ref(false)
const mostrarModalCrear = ref(false)

const salidaSeleccionada = ref<Salida | null>(null)

// Computed
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const cargarSalidas = async () => {
  isLoading.value = true
  try {
    const filters: SearchFilter[] = []

    if (filtroTipo.value) {
      filters.push({ field: 'tipo', operator: 'EQUALS', value: filtroTipo.value })
    }

    const response = await SalidaService.search({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
      sortType: 'DES'
    })

    salidas.value = response.data.data || []
    totalElementos.value = response.data.totalElements || 0
  } catch (error) {
    console.error('Error al cargar salidas:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarSalidas()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarSalidas()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarSalidas()
}

// Ver detalles
const verDetalles = async (salida: Salida) => {
  try {
    const response = await SalidaService.findById(salida.id)
    salidaSeleccionada.value = response.data
    mostrarModalDetalles.value = true
  } catch (error) {
    console.error('Error al cargar detalles:', error)
  }
}

const cerrarModalDetalles = () => {
  mostrarModalDetalles.value = false
  salidaSeleccionada.value = null
}

// Descargar factura PDF
const descargarFactura = async (salida: Salida) => {
  try {
    await SalidaService.descargarFactura(salida.id)
  } catch (error) {
    console.error('Error al descargar factura:', error)
    alert('Error al descargar la factura')
  }
}

// Eliminar
const confirmarEliminar = async (salida: Salida) => {
  const confirmed = await confirmDialog.delete(
    salida.numero,
    'El stock será devuelto automáticamente.'
  )

  if (confirmed) {
    try {
      await SalidaService.delete(salida.id)
      notify.success('Salida eliminada', 'La salida fue eliminada y el stock devuelto')
      cargarSalidas()
    } catch (error: any) {
      console.error('Error al eliminar:', error)
      notify.error('Error', error.response?.data?.message || 'Error al eliminar la salida')
    }
  }
}

const handleSalidaCreada = () => {
  mostrarModalCrear.value = false
  cargarSalidas()
}

// Utilidades
const formatFecha = (fecha: string | undefined): string => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDestino = (destino: string | undefined): string => {
  const destinos: Record<string, string> = {
    'TRABAJADORES': 'Trabajadores',
    'COMEDOR': 'Comedor',
    'VENTA_ESTADO': 'Venta Estado',
    'POBLACION': 'Población',
    'INSUMO': 'Insumo',
    'OTROS': 'Otros'
  }
  return destino ? destinos[destino] || destino : ''
}

const calcularTotalValor = (): number => {
  if (!salidaSeleccionada.value?.items) return 0
  return salidaSeleccionada.value.items.reduce((sum, item) => {
    return sum + (item.cantidad || 0) * (item.precio || 0)
  }, 0)
}

// Lifecycle
onMounted(() => {
  cargarSalidas()
})

// Watchers
watch(filtroTipo, () => {
  paginaActual.value = 0
  cargarSalidas()
})
</script>

<style scoped>
.salida-list {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 2em;
  font-weight: 700;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  min-width: 150px;
  background: #fff;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn-buscar {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-crear {
  background-color: #27ae60;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.tabla-salidas {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tabla-salidas th, .tabla-salidas td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.tabla-salidas th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
}

.tipo-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.tipo-vale {
  background-color: #e3f2fd;
  color: #1565c0;
}

.tipo-factura {
  background-color: #fff3e0;
  color: #e65100;
}

.destino-badge {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8em;
  font-weight: 500;
  background-color: #e8f5e9;
  color: #2e7d32;
}

.subtext {
  display: block;
  font-size: 0.8em;
  color: #888;
}

.cantidad-cell {
  font-weight: 700;
  color: #e74c3c;
}

.acciones {
  display: flex;
  gap: 5px;
}

.acciones button {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
}

.btn-ver {
  background-color: #3498db;
  color: white;
}

.btn-descargar {
  background-color: #9b59b6;
  color: white;
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 12px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-pag {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.btn-pag:disabled {
  background: #f5f5f5;
  color: #aaa;
  cursor: not-allowed;
}

/* Modal */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 16px;
  position: relative;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-grande {
  max-width: 700px;
}

.modal-small {
  max-width: 400px;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-select, .form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
}

.stock-info {
  background-color: #e8f5e9;
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  color: #2e7d32;
}

.items-section {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.items-header h4 {
  margin: 0;
}

.btn-agregar-item {
  background-color: #27ae60;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
}

.item-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-bottom: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.item-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.btn-eliminar-item {
  background-color: #e74c3c;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.total-items {
  text-align: right;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 8px;
  margin-top: 10px;
}

.error-stock {
  color: #e74c3c;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.detalles-info {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.detalles-info p {
  margin: 8px 0;
}

.tabla-items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.tabla-items th, .tabla-items td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: left;
}

.tabla-items th {
  background: #f5f5f5;
}

.total-detalles {
  text-align: right;
  font-size: 1em;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.total-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 5px;
}

.total-row:last-child {
  margin-bottom: 0;
}

.total-valor {
  font-size: 1.2em;
  color: #27ae60;
}

.cantidad-col {
  text-align: center;
  font-weight: 600;
}

.precio-col {
  text-align: right;
  color: #666;
}

.subtotal-col {
  text-align: right;
  font-weight: 600;
  color: #27ae60;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.select-size {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.separator {
  color: #ccc;
}

.page-indicator {
  padding: 0 15px;
  font-weight: 500;
}

/* Detalles Modal Enhanced Styles */
.detalles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.detalles-badges {
  display: flex;
  gap: 10px;
}

.tipo-badge-lg {
  padding: 8px 20px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.destino-badge-lg {
  padding: 8px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1em;
}

/* Destino color variants */
.destino-trabajadores {
  background-color: #e3f2fd;
  color: #1565c0;
}

.destino-comedor {
  background-color: #fff3e0;
  color: #e65100;
}

.destino-venta_estado {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.destino-poblacion {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.destino-insumo {
  background-color: #e0f2f1;
  color: #00695c;
}

.destino-otros {
  background-color: #eceff1;
  color: #546e7a;
}

.detalles-numero {
  font-size: 1.3em;
  color: #2c3e50;
}

.info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.85em;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.info-value {
  font-size: 1em;
  color: #2c3e50;
  font-weight: 500;
}
</style>
