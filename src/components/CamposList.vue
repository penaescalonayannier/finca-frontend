<template>
  <div class="campos-list">
    <h2>Gestion de Campos</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por bloque, campo, variedad..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nuevo Campo</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando campos...</div>

    <table v-else class="campos-table">
      <thead>
        <tr>
          <th>Bloque</th>
          <th>Campo</th>
          <th>Area</th>
          <th>Variedad</th>
          <th>Cepa</th>
          <th>Poblacion</th>
          <th>Destino</th>
          <th>Rendimiento</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="campos.length === 0">
          <td colspan="9" class="no-data">No se encontraron registros</td>
        </tr>
        <tr v-for="campo in campos" :key="campo.id">
          <td>{{ campo.bloque }}</td>
          <td>{{ campo.campo }}</td>
          <td class="numero">{{ formatNumber(campo.area) }}</td>
          <td>{{ campo.variedad }}</td>
          <td>{{ campo.cepa }}</td>
          <td class="numero">{{ formatNumber(campo.poblacion) }}</td>
          <td>{{ campo.destino }}</td>
          <td class="numero">{{ formatNumber(campo.rendimiento) }}</td>
          <td class="acciones">
            <button @click="editarCampos(campo)" class="btn-editar">Editar</button>
            <button @click="confirmarEliminar(campo)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && campos.length > 0" class="pagination">
      <div class="pagination-info">
        <span>Total: {{ totalElementos }} registros</span>
        <span class="separator">|</span>
        <label>
          Mostrar:
          <select v-model="tamanoPagina" @change="cambiarTamanoPagina" class="select-size">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button class="btn-pag" :disabled="paginaActual === 0" @click="cambiarPagina(paginaActual - 1)">
          Anterior
        </button>
        <span class="page-indicator">Pagina {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1 || totalPaginas === 0" @click="cambiarPagina(paginaActual + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal Crear -->
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content modal-large">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearCampos @created="handleCamposCreado" @cancel="mostrarModalCrear = false" />
      </div>
    </div>

    <!-- Modal Editar -->
    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content modal-large">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearCampos
          :campos="camposEditando"
          @updated="handleCamposActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>

    <!-- Modal Confirmar Eliminar -->
    <div v-if="mostrarModalEliminar" class="modal">
      <div class="modal-content modal-small">
        <h3>Confirmar Eliminacion</h3>
        <p>¿Eliminar el campo <strong>{{ camposEliminar?.campo }}</strong> del bloque <strong>{{ camposEliminar?.bloque }}</strong>?</p>
        <div class="modal-buttons">
          <button @click="eliminarCampos" class="btn-eliminar">Eliminar</button>
          <button @click="mostrarModalEliminar = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import CamposService from '@/services/CamposService'
import CrearCampos from './CrearCampos.vue'
import type { Campos } from '@/types/Campos'
import type { SearchFilter } from '@/types/EstadoCuenta'

const campos = ref<Campos[]>([])
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const camposEditando = ref<Campos | null>(null)
const camposEliminar = ref<Campos | null>(null)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const cargarCampos = async () => {
  isLoading.value = true
  campos.value = []
  try {
    const filters: SearchFilter[] = []

    const response = await CamposService.buscarCampos({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
    })

    const data = response.data as Record<string, unknown>
    console.log('Respuesta campos:', data)

    if (data.data && Array.isArray(data.data)) {
      campos.value = (data.data as Campos[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (data.content && Array.isArray(data.content)) {
      campos.value = (data.content as Campos[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (Array.isArray(data)) {
      campos.value = data as Campos[]
      totalElementos.value = campos.value.length
    } else {
      campos.value = []
      totalElementos.value = 0
    }
  } catch (error) {
    console.error('Error al cargar campos:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarCampos()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarCampos()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarCampos()
}

const editarCampos = (campo: Campos) => {
  camposEditando.value = { ...campo }
  mostrarModalEditar.value = true
}

const confirmarEliminar = (campo: Campos) => {
  camposEliminar.value = campo
  mostrarModalEliminar.value = true
}

const eliminarCampos = async () => {
  if (!camposEliminar.value?.id) return
  try {
    await CamposService.eliminarCampos(camposEliminar.value.id)
    mostrarModalEliminar.value = false
    camposEliminar.value = null
    cargarCampos()
  } catch (error) {
    console.error('Error al eliminar:', error)
    alert('Error al eliminar el campo')
  }
}

const handleCamposCreado = () => {
  mostrarModalCrear.value = false
  paginaActual.value = 0
  cargarCampos()
}

const handleCamposActualizado = () => {
  mostrarModalEditar.value = false
  cargarCampos()
}

onMounted(() => {
  cargarCampos()
})
</script>

<style scoped>
.campos-list { padding: 20px; }

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-buscar { background-color: #3498db; color: white; }
.btn-crear { background-color: #27ae60; color: white; }

.btn-buscar, .btn-crear {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-buscar:hover { background-color: #2980b9; }
.btn-crear:hover { background-color: #219a52; }

.loading, .no-data { text-align: center; padding: 40px; color: #888; }

.campos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.campos-table th, .campos-table td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: left;
}

.campos-table th { background-color: #f5f5f5; font-weight: 600; }
.campos-table tr:nth-child(even) { background-color: #fafafa; }

.numero { text-align: right; }

.acciones button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
  font-size: 0.85em;
}

.btn-editar { background-color: #3498db; color: white; }
.btn-eliminar { background-color: #e74c3c; color: white; }
.btn-editar:hover { background-color: #2980b9; }
.btn-eliminar:hover { background-color: #c0392b; }

/* Paginacion */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info { display: flex; align-items: center; gap: 10px; color: #666; }
.pagination-info .separator { color: #ccc; }
.select-size { padding: 4px 8px; border: 1px solid #ccc; border-radius: 4px; margin-left: 5px; }
.pagination-controls { display: flex; align-items: center; gap: 10px; }
.page-indicator { padding: 0 15px; font-weight: 500; }

.btn-pag {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
.btn-pag:hover:not(:disabled) { background-color: #e9ecef; }
.btn-pag:disabled { background-color: #e9ecef; color: #aaa; cursor: not-allowed; }

/* Modal */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  position: relative;
  width: 90%;
  max-width: 500px;
}

.modal-large { max-width: 600px; }
.modal-small { max-width: 350px; text-align: center; }
.modal-small h3 { margin-top: 0; color: #e74c3c; }

.modal-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
.btn-cancelar { background-color: #95a5a6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
.btn-cancelar:hover { background-color: #7f8c8d; }

.close {
  position: absolute;
  top: 10px; right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}
.close:hover { color: #333; }
</style>
