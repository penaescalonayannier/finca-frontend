<template>
  <div class="campos-list">
    <h2>Gestion de Campos (Plantaciones)</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por bloque, campo, variedad..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nuevo Campo</button>
      <button @click="mostrarModalDepreciacion = true" class="btn-depreciar">Aplicar Depreciación</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando campos...</div>

    <div v-else class="table-container">
      <table class="campos-table">
        <thead>
          <tr>
            <th><input type="checkbox" v-model="seleccionarTodos" @change="toggleSeleccionTodos" /></th>
            <th>Bloque</th>
            <th>Campo</th>
            <th>Area</th>
            <th>Variedad</th>
            <th>Cepa</th>
            <th>Años Cepa</th>
            <th>Valor Adq.</th>
            <th>Dep. Acum.</th>
            <th>Valor Actual</th>
            <th>Tasa %</th>
            <th>Últ. Dep.</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="campos.length === 0">
            <td colspan="13" class="no-data">No se encontraron registros</td>
          </tr>
          <tr v-for="campo in campos" :key="campo.id" :class="{ 'seleccionado': camposSeleccionados.includes(campo.id!) }">
            <td><input type="checkbox" :value="campo.id" v-model="camposSeleccionados" /></td>
            <td>{{ getBloqueNombre(campo) }}</td>
            <td>{{ campo.campo }}</td>
            <td class="numero">{{ formatNumber(campo.area) }}</td>
            <td>{{ getVariedadNombre(campo) }}</td>
            <td>{{ getCepaNombre(campo) }}</td>
            <td class="numero">{{ campo.anosCepa ?? '-' }}</td>
            <td class="numero">{{ formatCurrency(campo.valorAdquisicion) }}</td>
            <td class="numero">{{ formatCurrency(campo.depreciacionAcumulada) }}</td>
            <td class="numero valor-actual">{{ formatCurrency(campo.valorActual) }}</td>
            <td class="numero">{{ campo.tasaDepreciacionAnual ? campo.tasaDepreciacionAnual + '%' : '-' }}</td>
            <td>{{ formatDate(campo.fechaUltimaDepreciacion) }}</td>
            <td class="acciones">
              <button @click="editarCampos(campo)" class="btn-editar">Editar</button>
              <button @click="confirmarEliminar(campo)" class="btn-eliminar">Eliminar</button>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="campos.length > 0">
          <tr class="totales">
            <td colspan="7"><strong>TOTALES</strong></td>
            <td class="numero"><strong>{{ formatCurrency(totalValorAdquisicion) }}</strong></td>
            <td class="numero"><strong>{{ formatCurrency(totalDepreciacionAcumulada) }}</strong></td>
            <td class="numero valor-actual"><strong>{{ formatCurrency(totalValorActual) }}</strong></td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    </div>

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

    <!-- Modal Depreciación -->
    <div v-if="mostrarModalDepreciacion" class="modal">
      <div class="modal-content modal-small">
        <span class="close" @click="mostrarModalDepreciacion = false">&times;</span>
        <h3>Aplicar Depreciación</h3>
        <p class="info-text">
          Se aplicará depreciación a {{ camposSeleccionados.length > 0 ? camposSeleccionados.length : 'todos los' }} campos
          {{ camposSeleccionados.length === 0 ? 'con tasa de depreciación configurada' : 'seleccionados' }}.
        </p>
        <div class="form-group">
          <label for="meses">Meses a depreciar:</label>
          <input
            id="meses"
            v-model.number="mesesDepreciacion"
            type="number"
            min="1"
            max="12"
            class="input-meses"
          />
        </div>
        <div class="formula-info">
          <strong>Fórmula:</strong><br>
          Dep. Mensual = (Valor Adq. - Valor Residual) × (Tasa% / 12 / 100)
        </div>
        <div class="modal-buttons">
          <button @click="aplicarDepreciacion" class="btn-guardar" :disabled="isDepreciando">
            {{ isDepreciando ? 'Aplicando...' : 'Aplicar' }}
          </button>
          <button @click="mostrarModalDepreciacion = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import CamposService from '@/services/CamposService'
import CrearCampos from './CrearCampos.vue'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
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
const mostrarModalDepreciacion = ref(false)
const camposEditando = ref<Campos | null>(null)
const camposSeleccionados = ref<string[]>([])
const seleccionarTodos = ref(false)
const mesesDepreciacion = ref(1)
const isDepreciando = ref(false)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const totalValorAdquisicion = computed(() =>
  campos.value.reduce((sum, c) => sum + (c.valorAdquisicion || 0), 0)
)

const totalDepreciacionAcumulada = computed(() =>
  campos.value.reduce((sum, c) => sum + (c.depreciacionAcumulada || 0), 0)
)

const totalValorActual = computed(() =>
  campos.value.reduce((sum, c) => sum + (c.valorActual || 0), 0)
)

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'CUP',
    minimumFractionDigits: 2,
  }).format(value)
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('es-CO')
}

const getBloqueNombre = (campo: Campos) => {
  if (campo.bloque && typeof campo.bloque === 'object') {
    return campo.bloque.name || campo.bloque.code || '-'
  }
  return campo.bloque || '-'
}

const getVariedadNombre = (campo: Campos) => {
  if (campo.variedad && typeof campo.variedad === 'object') {
    return campo.variedad.name || campo.variedad.code || '-'
  }
  return campo.variedad || '-'
}

const getCepaNombre = (campo: Campos) => {
  if (campo.cepa && typeof campo.cepa === 'object') {
    return campo.cepa.name || campo.cepa.code || '-'
  }
  return campo.cepa || '-'
}

const toggleSeleccionTodos = () => {
  if (seleccionarTodos.value) {
    camposSeleccionados.value = campos.value.filter(c => c.id).map(c => c.id!)
  } else {
    camposSeleccionados.value = []
  }
}

watch(camposSeleccionados, (newVal) => {
  seleccionarTodos.value = newVal.length === campos.value.length && campos.value.length > 0
})

const aplicarDepreciacion = async () => {
  isDepreciando.value = true
  try {
    const idsParaDepreciar = camposSeleccionados.value.length > 0
      ? camposSeleccionados.value
      : campos.value.filter(c => c.id && c.tasaDepreciacionAnual).map(c => c.id!)

    if (idsParaDepreciar.length === 0) {
      notify.warning('Sin campos', 'No hay campos con tasa de depreciación configurada')
      return
    }

    const response = await CamposService.calcularDepreciacion({
      campoIds: idsParaDepreciar,
      meses: mesesDepreciacion.value
    })

    notify.success('Depreciación aplicada', `Se actualizaron ${response.data.camposActualizados} campos`)
    mostrarModalDepreciacion.value = false
    camposSeleccionados.value = []
    cargarCampos()
  } catch (error) {
    console.error('Error al aplicar depreciación:', error)
    notify.error('Error', 'No se pudo aplicar la depreciación')
  } finally {
    isDepreciando.value = false
  }
}

const cargarCampos = async () => {
  isLoading.value = true
  campos.value = []
  try {
    const filters: SearchFilter[] = []

    // Agregar filtros de búsqueda por texto
    if (searchQuery.value.trim()) {
      filters.push({
        key: 'campo',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'destino',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
    }

    const response = await CamposService.buscarCampos({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
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

const confirmarEliminar = async (campo: Campos) => {
  const confirmed = await confirmDialog.delete(`${campo.campo} (Bloque: ${campo.bloque})`)

  if (confirmed) {
    try {
      await CamposService.eliminarCampos(campo.id!)
      notify.success('Campo eliminado', 'El campo fue eliminado correctamente')
      cargarCampos()
    } catch (error) {
      console.error('Error al eliminar:', error)
      notify.error('Error', 'No se pudo eliminar el campo')
    }
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
.btn-depreciar { background-color: #9b59b6; color: white; }

.btn-buscar, .btn-crear, .btn-depreciar {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-buscar:hover { background-color: #2980b9; }
.btn-crear:hover { background-color: #219a52; }
.btn-depreciar:hover { background-color: #8e44ad; }

.loading, .no-data { text-align: center; padding: 40px; color: #888; }

.table-container {
  overflow-x: auto;
}

.campos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
  min-width: 1200px;
}

.campos-table th, .campos-table td {
  border: 1px solid #eee;
  padding: 8px;
  text-align: left;
  white-space: nowrap;
}

.campos-table th {
  background-color: #34495e;
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.campos-table tr:nth-child(even) { background-color: #fafafa; }
.campos-table tr:hover { background-color: #ecf0f1; }
.campos-table tr.seleccionado { background-color: #e8f4fd; }

.campos-table tfoot tr.totales {
  background-color: #f5f5f5;
  font-weight: bold;
}

.numero { text-align: right; }
.valor-actual { color: #27ae60; font-weight: 600; }

.info-text {
  color: #666;
  margin-bottom: 15px;
}

.formula-info {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-size: 0.9em;
  color: #555;
  margin-bottom: 15px;
}

.input-meses {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

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
