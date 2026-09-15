<template>
  <div class="activo-fijo-list">
    <div class="header">
      <h2>Activos Fijos Tangibles</h2>
      <div class="header-actions">
        <select v-model="filtroGrupo" @change="buscar" class="filtro-select">
          <option value="">Todos los grupos</option>
          <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.id">
            {{ grupo.codigo }} - {{ grupo.nombre }}
          </option>
        </select>
        <input
          v-model="busqueda"
          type="text"
          placeholder="Buscar por inventario o descripción..."
          @input="buscarDebounced"
          class="search-input"
        />
        <button @click="mostrarFormulario = true" class="btn-primary">
          + Nuevo Activo
        </button>
      </div>
    </div>

    <div v-if="cargando" class="loading">Cargando activos...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>No. Inventario</th>
          <th>Descripción</th>
          <th>Grupo</th>
          <th>Valor Adquisición</th>
          <th>Dep. Acumulada</th>
          <th>Valor Residual</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="activo in activos" :key="activo.id" :class="{ 'inactivo': !activo.activo }">
          <td>{{ activo.numeroInventario }}</td>
          <td>{{ activo.descripcion }}</td>
          <td>{{ activo.grupoCodigo }} - {{ activo.grupoNombre }}</td>
          <td class="numero">{{ formatCurrency(activo.valorAdquisicion) }}</td>
          <td class="numero">{{ formatCurrency(activo.depreciacionAcumulada) }}</td>
          <td class="numero">{{ formatCurrency(activo.valorResidual) }}</td>
          <td>
            <span :class="activo.activo ? 'badge-activo' : 'badge-baja'">
              {{ activo.activo ? 'Activo' : 'Baja' }}
            </span>
          </td>
          <td class="acciones">
            <button @click="verDetalle(activo)" class="btn-icon" title="Ver detalle">
              👁️
            </button>
            <button @click="editarActivo(activo)" class="btn-icon" title="Editar">
              ✏️
            </button>
            <button
              v-if="activo.activo"
              @click="confirmarBaja(activo)"
              class="btn-icon btn-danger"
              title="Dar de baja"
            >
              ❌
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="paginacion">
      <div class="page-size-selector">
        <label>Mostrar:</label>
        <select v-model="pageSize" @change="cambiarPageSize">
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
        <span>de {{ totalElements }} registros</span>
      </div>
      <div class="page-controls" v-if="totalPages > 1">
        <button @click="paginaAnterior" :disabled="page === 0">← Anterior</button>
        <span>Página {{ page + 1 }} de {{ totalPages }}</span>
        <button @click="paginaSiguiente" :disabled="page >= totalPages - 1">Siguiente →</button>
      </div>
    </div>

    <!-- Modal Formulario -->
    <div v-if="mostrarFormulario" class="modal-overlay" @click.self="cerrarFormulario">
      <div class="modal">
        <h3>{{ activoEditar ? 'Editar' : 'Nuevo' }} Activo Fijo</h3>
        <form @submit.prevent="guardarActivo">
          <div class="form-group">
            <label>Número de Inventario *</label>
            <input v-model="formulario.numeroInventario" required />
          </div>
          <div class="form-group">
            <label>Descripción *</label>
            <input v-model="formulario.descripcion" required />
          </div>
          <div class="form-group">
            <label>Grupo</label>
            <select v-model="formulario.grupoId">
              <option value="">-- Seleccionar grupo --</option>
              <option v-for="grupo in grupos" :key="grupo.id" :value="grupo.id">
                {{ grupo.codigo }} - {{ grupo.nombre }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Valor Adquisición *</label>
              <input v-model.number="formulario.valorAdquisicion" type="number" step="0.01" required />
            </div>
            <div class="form-group">
              <label>Depreciación Acumulada</label>
              <input v-model.number="formulario.depreciacionAcumulada" type="number" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Estado Técnico (%)</label>
              <input v-model.number="formulario.estadoTecnicoPorcentaje" type="number" min="0" max="100" />
            </div>
            <div class="form-group">
              <label>Valor Tasación</label>
              <input v-model.number="formulario.valorTasacion" type="number" step="0.01" />
            </div>
          </div>
          <div class="form-group">
            <label>Fecha Adquisición</label>
            <input v-model="formulario.fechaAdquisicion" type="date" />
          </div>
          <div class="form-group">
            <label>Destino</label>
            <input v-model="formulario.destino" />
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="formulario.observaciones" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="cerrarFormulario" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ activoEditar ? 'Actualizar' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Confirmar Baja -->
    <div v-if="mostrarConfirmBaja" class="modal-overlay" @click.self="mostrarConfirmBaja = false">
      <div class="modal modal-sm">
        <h3>Dar de Baja Activo</h3>
        <p>¿Está seguro de dar de baja el activo <strong>{{ activoBaja?.numeroInventario }}</strong>?</p>
        <div class="form-group">
          <label>Motivo de la baja *</label>
          <textarea v-model="motivoBaja" rows="3" placeholder="Ingrese el motivo de la baja..." required></textarea>
        </div>
        <div class="form-actions">
          <button @click="mostrarConfirmBaja = false" class="btn-secondary">Cancelar</button>
          <button @click="ejecutarBaja" class="btn-danger" :disabled="!motivoBaja">Confirmar Baja</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ActivoFijoService, GrupoActivoFijoService } from '@/services/ActivoFijoService'
import type { ActivoFijoTangible, GrupoActivoFijo, CreateActivoFijoRequest } from '@/types/ActivoFijo'

const activos = ref<ActivoFijoTangible[]>([])
const grupos = ref<GrupoActivoFijo[]>([])
const cargando = ref(false)
const busqueda = ref('')
const filtroGrupo = ref('')
const page = ref(0)
const pageSize = ref(10)
const totalPages = ref(0)
const totalElements = ref(0)

const mostrarFormulario = ref(false)
const activoEditar = ref<ActivoFijoTangible | null>(null)
const formulario = ref<CreateActivoFijoRequest>({
  numeroInventario: '',
  descripcion: '',
  grupoId: '',
  valorAdquisicion: 0,
  depreciacionAcumulada: 0
})

const mostrarConfirmBaja = ref(false)
const activoBaja = ref<ActivoFijoTangible | null>(null)
const motivoBaja = ref('')

let debounceTimer: number | null = null

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP' }).format(value)
}

const cargarGrupos = async () => {
  try {
    const response = await GrupoActivoFijoService.getAllActivos()
    grupos.value = response.data
  } catch (error) {
    console.error('Error cargando grupos:', error)
  }
}

const buscar = async () => {
  cargando.value = true
  try {
    const response = await ActivoFijoService.search({
      query: busqueda.value,
      grupoId: filtroGrupo.value || undefined,
      page: page.value,
      size: pageSize.value
    })
    activos.value = response.data.content
    totalPages.value = response.data.totalPages
    totalElements.value = response.data.totalElements
  } catch (error) {
    console.error('Error buscando activos:', error)
  } finally {
    cargando.value = false
  }
}

const cambiarPageSize = () => {
  page.value = 0
  buscar()
}

const buscarDebounced = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = window.setTimeout(() => {
    page.value = 0
    buscar()
  }, 300)
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

const verDetalle = (activo: ActivoFijoTangible) => {
  alert(`Detalle de: ${activo.numeroInventario}\n${activo.descripcion}\nValor: ${formatCurrency(activo.valorAdquisicion)}`)
}

const editarActivo = (activo: ActivoFijoTangible) => {
  activoEditar.value = activo
  formulario.value = {
    numeroInventario: activo.numeroInventario,
    descripcion: activo.descripcion,
    grupoId: activo.grupoId || '',
    valorAdquisicion: activo.valorAdquisicion,
    depreciacionAcumulada: activo.depreciacionAcumulada,
    estadoTecnicoPorcentaje: activo.estadoTecnicoPorcentaje,
    valorTasacion: activo.valorTasacion,
    fechaAdquisicion: activo.fechaAdquisicion,
    destino: activo.destino,
    observaciones: activo.observaciones
  }
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  activoEditar.value = null
  formulario.value = {
    numeroInventario: '',
    descripcion: '',
    grupoId: '',
    valorAdquisicion: 0,
    depreciacionAcumulada: 0
  }
}

const guardarActivo = async () => {
  try {
    if (activoEditar.value) {
      await ActivoFijoService.update(activoEditar.value.id, formulario.value)
    } else {
      await ActivoFijoService.create(formulario.value)
    }
    cerrarFormulario()
    buscar()
  } catch (error) {
    console.error('Error guardando activo:', error)
    alert('Error al guardar el activo')
  }
}

const confirmarBaja = (activo: ActivoFijoTangible) => {
  activoBaja.value = activo
  motivoBaja.value = ''
  mostrarConfirmBaja.value = true
}

const ejecutarBaja = async () => {
  if (!activoBaja.value || !motivoBaja.value) return
  try {
    await ActivoFijoService.darDeBaja(activoBaja.value.id, motivoBaja.value)
    mostrarConfirmBaja.value = false
    activoBaja.value = null
    motivoBaja.value = ''
    buscar()
  } catch (error) {
    console.error('Error dando de baja:', error)
    alert('Error al dar de baja el activo')
  }
}

onMounted(() => {
  cargarGrupos()
  buscar()
})
</script>

<style scoped>
.activo-fijo-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.filtro-select, .search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-input {
  min-width: 250px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger {
  background: #dc2626;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-danger:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.data-table th, .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
}

.data-table tr:hover {
  background: #f9fafb;
}

.data-table tr.inactivo {
  background: #fef2f2;
  color: #991b1b;
}

.numero {
  text-align: right;
  font-family: monospace;
}

.badge-activo {
  background: #dcfce7;
  color: #166534;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge-baja {
  background: #fee2e2;
  color: #991b1b;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.acciones {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.paginacion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;
  flex-wrap: wrap;
  gap: 15px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-size-selector label {
  color: #6b7280;
  font-size: 14px;
}

.page-size-selector select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.page-size-selector span {
  color: #6b7280;
  font-size: 14px;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-controls button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.page-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sm {
  max-width: 400px;
}

.modal h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input, .form-group select, .form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
