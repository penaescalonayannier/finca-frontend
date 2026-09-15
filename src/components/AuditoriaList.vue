<template>
  <div class="auditoria-list">
    <h2>Registro de Auditoría</h2>
    <p class="subtitulo">Historial de acciones del sistema</p>

    <div class="filtros">
      <div class="filtro-grupo">
        <label>Entidad</label>
        <select v-model="filtroEntidad" @change="buscar" class="filtro-select">
          <option value="">Todas</option>
          <option v-for="entidad in entidades" :key="entidad" :value="entidad">
            {{ entidad }}
          </option>
        </select>
      </div>

      <div class="filtro-grupo">
        <label>Acción</label>
        <select v-model="filtroAccion" @change="buscar" class="filtro-select">
          <option value="">Todas</option>
          <option v-for="accion in acciones" :key="accion" :value="accion">
            {{ formatAccion(accion) }}
          </option>
        </select>
      </div>

      <div class="filtro-grupo">
        <label>Usuario</label>
        <input
          v-model="filtroUsuario"
          @input="debounceSearch"
          type="text"
          placeholder="Buscar por usuario..."
          class="filtro-input"
        />
      </div>

      <div class="filtro-grupo">
        <label>Desde</label>
        <input v-model="filtroFechaDesde" @change="buscar" type="date" class="filtro-input" />
      </div>

      <div class="filtro-grupo">
        <label>Hasta</label>
        <input v-model="filtroFechaHasta" @change="buscar" type="date" class="filtro-input" />
      </div>

      <button @click="limpiarFiltros" class="btn-limpiar">Limpiar</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando registros...</div>

    <div v-else>
      <table class="tabla-auditoria">
        <thead>
          <tr>
            <th @click="cambiarOrden('createdAt')" class="sortable">
              Fecha/Hora
              <span v-if="sortBy === 'createdAt'">{{ sortType === 'DES' ? '▼' : '▲' }}</span>
            </th>
            <th @click="cambiarOrden('username')" class="sortable">
              Usuario
              <span v-if="sortBy === 'username'">{{ sortType === 'DES' ? '▼' : '▲' }}</span>
            </th>
            <th>Acción</th>
            <th @click="cambiarOrden('entidad')" class="sortable">
              Entidad
              <span v-if="sortBy === 'entidad'">{{ sortType === 'DES' ? '▼' : '▲' }}</span>
            </th>
            <th>Descripción</th>
            <th>IP</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="registros.length === 0">
            <td colspan="7" class="no-data">No hay registros de auditoría</td>
          </tr>
          <tr v-for="registro in registros" :key="registro.id">
            <td class="fecha">{{ formatFecha(registro.createdAt) }}</td>
            <td><strong>{{ registro.username }}</strong></td>
            <td>
              <span :class="['badge', 'badge-' + registro.accion.toLowerCase()]">
                {{ formatAccion(registro.accion) }}
              </span>
            </td>
            <td>{{ registro.entidad }}</td>
            <td class="descripcion">{{ registro.descripcion }}</td>
            <td class="ip">{{ registro.ipAddress || '-' }}</td>
            <td>
              <button
                v-if="registro.valorAnterior || registro.valorNuevo"
                @click="verDetalles(registro)"
                class="btn-detalles"
              >
                Ver
              </button>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="paginacion">
        <span class="info-paginacion">
          Mostrando {{ registros.length }} de {{ totalElements }} registros
        </span>
        <div class="controles-paginacion">
          <button @click="paginaAnterior" :disabled="page === 0" class="btn-pagina">
            ← Anterior
          </button>
          <span class="pagina-actual">Página {{ page + 1 }} de {{ totalPages || 1 }}</span>
          <button @click="paginaSiguiente" :disabled="page >= totalPages - 1" class="btn-pagina">
            Siguiente →
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de detalles -->
    <div v-if="mostrarModal" class="modal">
      <div class="modal-content modal-detalles">
        <span class="close" @click="cerrarModal">&times;</span>
        <h3>Detalles del Cambio</h3>
        <p class="modal-subtitle">
          {{ registroSeleccionado?.descripcion }}
        </p>

        <div class="detalles-grid">
          <div v-if="registroSeleccionado?.valorAnterior" class="detalle-seccion">
            <h4>Valor Anterior</h4>
            <pre class="json-viewer">{{ formatJson(registroSeleccionado.valorAnterior) }}</pre>
          </div>
          <div v-if="registroSeleccionado?.valorNuevo" class="detalle-seccion">
            <h4>Valor Nuevo</h4>
            <pre class="json-viewer">{{ formatJson(registroSeleccionado.valorNuevo) }}</pre>
          </div>
        </div>

        <div class="meta-info">
          <p><strong>Fecha:</strong> {{ formatFecha(registroSeleccionado?.createdAt || '') }}</p>
          <p><strong>Usuario:</strong> {{ registroSeleccionado?.username }}</p>
          <p><strong>IP:</strong> {{ registroSeleccionado?.ipAddress || 'No disponible' }}</p>
          <p><strong>ID Entidad:</strong> {{ registroSeleccionado?.entidadId || 'N/A' }}</p>
        </div>

        <div class="form-actions">
          <button class="btn-cancelar" @click="cerrarModal">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { AuditoriaService } from '@/services/AuditoriaService'
import type { Auditoria, TipoAccion } from '@/types/Auditoria'
import { notify } from '@/composables/useNotification'

const registros = ref<Auditoria[]>([])
const entidades = ref<string[]>([])
const acciones = ref<TipoAccion[]>([])
const isLoading = ref(false)

// Pagination
const page = ref(0)
const pageSize = ref(20)
const totalPages = ref(0)
const totalElements = ref(0)

// Sorting
const sortBy = ref('createdAt')
const sortType = ref<'ASC' | 'DES'>('DES')

// Filters
const filtroEntidad = ref('')
const filtroAccion = ref('')
const filtroUsuario = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')

// Modal
const mostrarModal = ref(false)
const registroSeleccionado = ref<Auditoria | null>(null)

let debounceTimeout: ReturnType<typeof setTimeout> | null = null

const formatAccion = (accion: string): string => {
  const acciones: Record<string, string> = {
    CREATE: 'Crear',
    UPDATE: 'Actualizar',
    DELETE: 'Eliminar',
    LOGIN: 'Inicio Sesión',
    LOGOUT: 'Cerrar Sesión',
    EXPORT: 'Exportar',
    STOCK_ADJUSTMENT: 'Ajuste Stock',
    PAYMENT: 'Pago',
    REACTIVATE: 'Reactivar',
    TRANSFER: 'Transferir'
  }
  return acciones[accion] || accion
}

const formatFecha = (fecha: string): string => {
  if (!fecha) return '-'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const formatJson = (jsonString: string | null): string => {
  if (!jsonString) return '-'
  try {
    const obj = JSON.parse(jsonString)
    return JSON.stringify(obj, null, 2)
  } catch {
    return jsonString
  }
}

const cargarEntidades = async () => {
  try {
    entidades.value = await AuditoriaService.getEntidades()
  } catch (error) {
    console.error('Error al cargar entidades:', error)
  }
}

const cargarAcciones = async () => {
  try {
    acciones.value = await AuditoriaService.getAcciones()
  } catch (error) {
    console.error('Error al cargar acciones:', error)
  }
}

const buscar = async () => {
  isLoading.value = true
  try {
    const filters = []

    if (filtroEntidad.value) {
      filters.push({ key: 'entidad', operator: 'EQUAL', value: filtroEntidad.value })
    }
    if (filtroAccion.value) {
      filters.push({ key: 'accion', operator: 'EQUAL', value: filtroAccion.value })
    }
    if (filtroUsuario.value) {
      filters.push({ key: 'username', operator: 'LIKE', value: filtroUsuario.value })
    }
    if (filtroFechaDesde.value) {
      filters.push({
        key: 'createdAt',
        operator: 'GREATERTHANOREQUAL',
        value: filtroFechaDesde.value + 'T00:00:00'
      })
    }
    if (filtroFechaHasta.value) {
      filters.push({
        key: 'createdAt',
        operator: 'LESSTHANOREQUAL',
        value: filtroFechaHasta.value + 'T23:59:59'
      })
    }

    const response = await AuditoriaService.search({
      filter: filters,
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortType: sortType.value
    })

    registros.value = response.data
    totalPages.value = response.totalPages
    totalElements.value = response.totalElements
  } catch (error) {
    console.error('Error al buscar auditoría:', error)
    notify.error('Error', 'No se pudieron cargar los registros de auditoría')
  } finally {
    isLoading.value = false
  }
}

const debounceSearch = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout)
  debounceTimeout = setTimeout(() => {
    page.value = 0
    buscar()
  }, 500)
}

const limpiarFiltros = () => {
  filtroEntidad.value = ''
  filtroAccion.value = ''
  filtroUsuario.value = ''
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  page.value = 0
  buscar()
}

const cambiarOrden = (campo: string) => {
  if (sortBy.value === campo) {
    sortType.value = sortType.value === 'ASC' ? 'DES' : 'ASC'
  } else {
    sortBy.value = campo
    sortType.value = 'DES'
  }
  buscar()
}

const paginaAnterior = () => {
  if (page.value > 0) {
    page.value--
    buscar()
  }
}

const paginaSiguiente = () => {
  if (page.value < totalPages.value - 1) {
    page.value++
    buscar()
  }
}

const verDetalles = (registro: Auditoria) => {
  registroSeleccionado.value = registro
  mostrarModal.value = true
}

const cerrarModal = () => {
  mostrarModal.value = false
  registroSeleccionado.value = null
}

onMounted(() => {
  cargarEntidades()
  cargarAcciones()
  buscar()
})
</script>

<style scoped>
.auditoria-list {
  padding: 20px;
  max-width: 1600px;
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

.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  align-items: flex-end;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filtro-grupo label {
  font-size: 0.85em;
  font-weight: 500;
  color: #555;
}

.filtro-select,
.filtro-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95em;
  min-width: 150px;
}

.btn-limpiar {
  background-color: #95a5a6;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-limpiar:hover {
  background-color: #7f8c8d;
}

.loading,
.no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.tabla-auditoria {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 0.9em;
}

.tabla-auditoria th,
.tabla-auditoria td {
  border: 1px solid #eee;
  padding: 10px 12px;
  text-align: left;
}

.tabla-auditoria th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
}

.tabla-auditoria th.sortable {
  cursor: pointer;
}

.tabla-auditoria th.sortable:hover {
  background: #e9ecef;
}

.tabla-auditoria tr:nth-child(even) {
  background-color: #fafafa;
}

.tabla-auditoria tr:hover {
  background-color: #f0f7ff;
}

.fecha {
  white-space: nowrap;
  font-size: 0.85em;
  color: #666;
}

.descripcion {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip {
  font-family: monospace;
  font-size: 0.85em;
  color: #666;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 500;
  white-space: nowrap;
}

.badge-create {
  background-color: #27ae60;
  color: white;
}

.badge-update {
  background-color: #3498db;
  color: white;
}

.badge-delete {
  background-color: #e74c3c;
  color: white;
}

.badge-login {
  background-color: #9b59b6;
  color: white;
}

.badge-logout {
  background-color: #95a5a6;
  color: white;
}

.badge-export {
  background-color: #f39c12;
  color: white;
}

.badge-stock_adjustment,
.badge-payment,
.badge-reactivate,
.badge-transfer {
  background-color: #1abc9c;
  color: white;
}

.btn-detalles {
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85em;
  background-color: #3498db;
  color: white;
}

.paginacion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.info-paginacion {
  color: #666;
  font-size: 0.9em;
}

.controles-paginacion {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-pagina {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-weight: 500;
}

.btn-pagina:hover:not(:disabled) {
  background: #e9ecef;
}

.btn-pagina:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagina-actual {
  color: #555;
  font-weight: 500;
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
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-detalles {
  max-width: 900px;
}

.modal-subtitle {
  color: #666;
  margin-bottom: 20px;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.detalles-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.detalle-seccion h4 {
  margin-bottom: 10px;
  color: #555;
}

.json-viewer {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.85em;
  max-height: 300px;
  border: 1px solid #e9ecef;
}

.meta-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.meta-info p {
  margin: 5px 0;
  color: #555;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

@media (max-width: 1200px) {
  .detalles-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .filtros {
    flex-direction: column;
  }

  .tabla-auditoria {
    font-size: 0.8em;
  }

  .paginacion {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
