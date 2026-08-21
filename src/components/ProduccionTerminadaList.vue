<!-- src/components/ProduccionTerminadaList.vue -->

<template>
  <div class="produccion-terminada-list">
    <h2>Produccion Terminada</h2>
    <p class="subtitulo">Registro de producciones terminadas y entregas</p>

    <!-- Filtros y busqueda -->
    <div class="search-bar">
      <div class="search-filters">
        <select v-model="filtroFinca" class="filter-select">
          <option value="">Todas las fincas</option>
          <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
            {{ finca.code }} - {{ finca.name }}
          </option>
        </select>

        <select v-model="filtroProducto" class="filter-select">
          <option value="">Todos los productos</option>
          <option v-for="producto in productos" :key="producto.id" :value="producto.id">
            {{ producto.code }} - {{ producto.name }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          placeholder="Buscar..."
          class="search-input"
          @keyup.enter="buscarConReset"
        />
      </div>
      
      <div class="button-group">
        <button @click="buscarConReset" class="btn-buscar">Buscar</button>
        <button @click="abrirModalCrear" class="btn-crear">+ Nueva Produccion</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">Cargando registros...</div>

    <!-- Tabla -->
    <table v-else class="tabla-produccion">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Finca</th>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Entrega</th>
          <th>Recibe</th>
          <th>Observaciones</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="registros.length === 0">
          <td colspan="8" class="no-data">No se encontraron registros</td>
        </tr>
        <tr v-for="registro in registros" :key="registro.id">
          <td>{{ formatFecha(registro.fecha) }}</td>
          <td>
            <strong>{{ registro.fincaCode }}</strong>
            <span class="subtext">{{ registro.fincaName }}</span>
          </td>
          <td>
            <strong>{{ registro.productoCode }}</strong>
            <span class="subtext">{{ registro.productoName }}</span>
          </td>
          <td class="cantidad-cell">{{ registro.cantidadTerminada }}</td>
          <td>{{ registro.trabajadorEntregaNombre }}</td>
          <td>{{ registro.trabajadorRecibeNombre }}</td>
          <td class="observaciones-cell">{{ registro.observaciones || '-' }}</td>
          <td class="acciones">
            <button @click="editarRegistro(registro)" class="btn-editar">Editar</button>
            <button @click="confirmarEliminar(registro)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginacion -->
    <div v-if="!isLoading && registros.length > 0" class="pagination">
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
        <span class="page-indicator">Pagina {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1" @click="cambiarPagina(paginaActual + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal Crear/Editar -->
    <div v-if="mostrarModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="cerrarModal">&times;</span>
        <h3>{{ modoEdicion ? 'Editar Produccion Terminada' : 'Nueva Produccion Terminada' }}</h3>
        
        <form @submit.prevent="guardarRegistro">
          <div class="form-group">
            <label>Finca *</label>
            <select v-model="form.fincaId" required class="form-select">
              <option value="">Seleccione una finca</option>
              <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
                {{ finca.code }} - {{ finca.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Producto *</label>
            <select v-model="form.productoId" required class="form-select">
              <option value="">Seleccione un producto</option>
              <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                {{ producto.code }} - {{ producto.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Cantidad Terminada *</label>
            <input
              v-model.number="form.cantidadTerminada"
              type="number"
              required
              min="1"
              class="form-input"
              placeholder="0"
            />
          </div>

          <div class="form-group">
            <label>Trabajador que Entrega *</label>
            <select v-model="form.trabajadorEntregaId" required class="form-select">
              <option value="">Seleccione trabajador</option>
              <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
                {{ trabajador.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Trabajador que Recibe *</label>
            <select v-model="form.trabajadorRecibeId" required class="form-select">
              <option value="">Seleccione trabajador</option>
              <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
                {{ trabajador.nombre }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Observaciones</label>
            <textarea
              v-model="form.observaciones"
              class="form-textarea"
              rows="3"
              placeholder="Observaciones opcionales..."
            ></textarea>
          </div>

          <div v-if="mensajeError" class="mensaje error">{{ mensajeError }}</div>

          <div class="form-actions">
            <button type="submit" class="btn-guardar" :disabled="isGuardando">
              {{ isGuardando ? 'Guardando...' : 'Guardar' }}
            </button>
            <button type="button" class="btn-cancelar" @click="cerrarModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ProduccionTerminadaService from '@/services/ProduccionTerminadaService'
import ProductoService from '@/services/ProductoService'
import TrabajadorService from '@/services/TrabajadorService'
import FincaService from '@/services/FincaService'
import type { ProduccionTerminada } from '@/types/ProduccionTerminada'
import type { Producto } from '@/types/Producto'
import type { Trabajador } from '@/types/Trabajador'
import type { Finca } from '@/types/Finca'
import type { SearchFilter } from '@/types/EstadoCuenta'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'

// Estado
const registros = ref<ProduccionTerminada[]>([])
const productos = ref<Producto[]>([])
const trabajadores = ref<Trabajador[]>([])
const fincas = ref<Finca[]>([])
const isLoading = ref(false)
const isGuardando = ref(false)
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const filtroProducto = ref('')
const filtroFinca = ref('')
const mensajeError = ref('')

// Modales
const mostrarModal = ref(false)
const modoEdicion = ref(false)

// Formulario
const form = ref({
  id: '',
  fincaId: '',
  productoId: '',
  cantidadTerminada: 1,
  trabajadorEntregaId: '',
  trabajadorRecibeId: '',
  observaciones: ''
})

// Computed
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

// Metodos
const formatFecha = (fecha: string): string => {
  if (!fecha) return '-'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const cargarFincas = async () => {
  try {
    const response = await FincaService.buscarFincas({ size: 999 })
    const data = response.data as Record<string, unknown>
    if (data.data && Array.isArray(data.data)) {
      fincas.value = data.data as Finca[]
    } else if (data.content && Array.isArray(data.content)) {
      fincas.value = data.content as Finca[]
    }
  } catch (error) {
    console.error('Error al cargar fincas:', error)
  }
}

const cargarProductos = async () => {
  try {
    const response = await ProductoService.buscarProductos({ size: 999 })
    productos.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar productos:', error)
  }
}

const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({ size: 999 })
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  }
}

const cargarRegistros = async () => {
  isLoading.value = true
  try {
    const filters: SearchFilter[] = []
    
    if (filtroFinca.value) {
      filters.push({ field: 'fincaId', operator: 'EQUALS', value: filtroFinca.value })
    }
    if (filtroProducto.value) {
      filters.push({ field: 'productoId', operator: 'EQUALS', value: filtroProducto.value })
    }

    const response = await ProduccionTerminadaService.search({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters
    })

    registros.value = response.data.data || []
    totalElementos.value = response.data.totalElements || 0
  } catch (error) {
    console.error('Error al cargar registros:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarRegistros()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarRegistros()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarRegistros()
}

// Modal Crear
const abrirModalCrear = () => {
  modoEdicion.value = false
  form.value = {
    id: '',
    fincaId: '',
    productoId: '',
    cantidadTerminada: 1,
    trabajadorEntregaId: '',
    trabajadorRecibeId: '',
    observaciones: ''
  }
  mensajeError.value = ''
  mostrarModal.value = true
}

// Modal Editar
const editarRegistro = (registro: ProduccionTerminada) => {
  modoEdicion.value = true
  form.value = {
    id: registro.id,
    fincaId: registro.fincaId,
    productoId: registro.productoId,
    cantidadTerminada: registro.cantidadTerminada,
    trabajadorEntregaId: registro.trabajadorEntregaId,
    trabajadorRecibeId: registro.trabajadorRecibeId,
    observaciones: registro.observaciones || ''
  }
  mensajeError.value = ''
  mostrarModal.value = true
}

const cerrarModal = () => {
  mostrarModal.value = false
  mensajeError.value = ''
}

const guardarRegistro = async () => {
  if (!form.value.fincaId || !form.value.productoId || !form.value.trabajadorEntregaId || !form.value.trabajadorRecibeId) {
    mensajeError.value = 'Complete todos los campos requeridos'
    return
  }

  if (form.value.trabajadorEntregaId === form.value.trabajadorRecibeId) {
    mensajeError.value = 'El trabajador que entrega y recibe deben ser diferentes'
    return
  }

  isGuardando.value = true
  mensajeError.value = ''

  try {
    if (modoEdicion.value) {
      await ProduccionTerminadaService.update(form.value.id, {
        id: form.value.id,
        fincaId: form.value.fincaId,
        productoId: form.value.productoId,
        cantidadTerminada: form.value.cantidadTerminada,
        trabajadorEntregaId: form.value.trabajadorEntregaId,
        trabajadorRecibeId: form.value.trabajadorRecibeId,
        observaciones: form.value.observaciones
      })
    } else {
      await ProduccionTerminadaService.create({
        fincaId: form.value.fincaId,
        productoId: form.value.productoId,
        cantidadTerminada: form.value.cantidadTerminada,
        trabajadorEntregaId: form.value.trabajadorEntregaId,
        trabajadorRecibeId: form.value.trabajadorRecibeId,
        observaciones: form.value.observaciones
      })
    }
    cerrarModal()
    cargarRegistros()
  } catch (error: unknown) {
    console.error('Error al guardar:', error)
    const err = error as { response?: { data?: { message?: string } } }
    mensajeError.value = err.response?.data?.message || 'Error al guardar el registro'
  } finally {
    isGuardando.value = false
  }
}

// Eliminar
const confirmarEliminar = async (registro: ProduccionTerminada) => {
  const displayName = `${registro.productoCode || ''} - ${registro.fincaCode || registro.id}`
  const confirmed = await confirmDialog.delete(displayName)

  if (confirmed) {
    try {
      await ProduccionTerminadaService.delete(registro.id)
      notify.success('Registro eliminado', 'El registro de produccion fue eliminado correctamente')
      cargarRegistros()
    } catch (error: unknown) {
      console.error('Error al eliminar:', error)
      const err = error as { response?: { data?: { message?: string } } }
      notify.error('Error', err.response?.data?.message || 'Error al eliminar el registro')
    }
  }
}

// Lifecycle
onMounted(() => {
  cargarFincas()
  cargarProductos()
  cargarTrabajadores()
  cargarRegistros()
})

// Watchers
watch([filtroFinca, filtroProducto], () => {
  paginaActual.value = 0
  cargarRegistros()
})
</script>

<style scoped>
.produccion-terminada-list {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 5px;
}

.subtitulo {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 25px;
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
  min-width: 180px;
  background: #fff;
}

.search-input {
  flex: 1;
  min-width: 150px;
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

.tabla-produccion {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tabla-produccion th,
.tabla-produccion td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.tabla-produccion th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
}

.tabla-produccion tr:nth-child(even) {
  background-color: #fafafa;
}

.tabla-produccion tr:hover {
  background-color: #f0f7ff;
}

.subtext {
  display: block;
  font-size: 0.8em;
  color: #888;
}

.cantidad-cell {
  font-weight: bold;
  color: #27ae60;
  text-align: center;
}

.observaciones-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acciones {
  display: flex;
  gap: 5px;
}

.acciones button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85em;
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.separator {
  color: #ccc;
}

.select-size {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-indicator {
  padding: 0 15px;
  font-weight: 500;
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
}

.mensaje.error {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
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
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
  }

  .search-filters {
    flex-direction: column;
  }

  .tabla-produccion {
    font-size: 0.85em;
  }

  .acciones {
    flex-direction: column;
  }
}
</style>
