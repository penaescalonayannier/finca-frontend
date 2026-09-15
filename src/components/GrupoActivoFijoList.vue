<template>
  <div class="grupo-activo-list">
    <div class="header">
      <h2>Grupos de Activos Fijos</h2>
      <button @click="mostrarFormulario = true" class="btn-primary">
        + Nuevo Grupo
      </button>
    </div>

    <div v-if="cargando" class="loading">Cargando grupos...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Tasa Depreciación (%)</th>
          <th>Vida Útil (años)</th>
          <th>Descripción</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="grupo in grupos" :key="grupo.id">
          <td><strong>{{ grupo.codigo }}</strong></td>
          <td>{{ grupo.nombre }}</td>
          <td class="numero">{{ grupo.tasaDepreciacion ? grupo.tasaDepreciacion + '%' : '-' }}</td>
          <td class="numero">{{ grupo.vidaUtilAnios || '-' }}</td>
          <td>{{ grupo.descripcion || '-' }}</td>
          <td>
            <span :class="grupo.activo ? 'badge-success' : 'badge-danger'">
              {{ grupo.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="acciones">
            <button @click="editarGrupo(grupo)" class="btn-icon" title="Editar">✏️</button>
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
      <div class="modal-content">
        <h3>{{ grupoEditar ? 'Editar Grupo' : 'Nuevo Grupo' }}</h3>
        <form @submit.prevent="guardarGrupo">
          <div class="form-group">
            <label>Código *</label>
            <input v-model="formulario.codigo" type="text" required maxlength="10" />
          </div>
          <div class="form-group">
            <label>Nombre *</label>
            <input v-model="formulario.nombre" type="text" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tasa Depreciación (%)</label>
              <input v-model.number="formulario.tasaDepreciacion" type="number" step="0.01" min="0" max="100" />
            </div>
            <div class="form-group">
              <label>Vida Útil (años)</label>
              <input v-model.number="formulario.vidaUtilAnios" type="number" min="1" />
            </div>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="formulario.descripcion" rows="2"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" @click="cerrarFormulario" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { GrupoActivoFijoService } from '@/services/ActivoFijoService'
import type { GrupoActivoFijo } from '@/types/ActivoFijo'

const todosGrupos = ref<GrupoActivoFijo[]>([])
const cargando = ref(false)
const page = ref(0)
const pageSize = ref(10)

const totalElements = computed(() => todosGrupos.value.length)
const totalPages = computed(() => Math.ceil(todosGrupos.value.length / pageSize.value))
const grupos = computed(() => {
  const start = page.value * pageSize.value
  return todosGrupos.value.slice(start, start + pageSize.value)
})

const cambiarPageSize = () => {
  page.value = 0
}
const mostrarFormulario = ref(false)
const grupoEditar = ref<GrupoActivoFijo | null>(null)
const formulario = ref({
  codigo: '',
  nombre: '',
  tasaDepreciacion: null as number | null,
  vidaUtilAnios: null as number | null,
  descripcion: ''
})

const cargarGrupos = async () => {
  cargando.value = true
  try {
    const response = await GrupoActivoFijoService.getAll()
    todosGrupos.value = response.data
  } catch (error) {
    console.error('Error cargando grupos:', error)
  } finally {
    cargando.value = false
  }
}

const paginaAnterior = () => {
  if (page.value > 0) page.value--
}

const paginaSiguiente = () => {
  if (page.value < totalPages.value - 1) page.value++
}

const editarGrupo = (grupo: GrupoActivoFijo) => {
  grupoEditar.value = grupo
  formulario.value = {
    codigo: grupo.codigo,
    nombre: grupo.nombre,
    tasaDepreciacion: grupo.tasaDepreciacion,
    vidaUtilAnios: grupo.vidaUtilAnios,
    descripcion: grupo.descripcion || ''
  }
  mostrarFormulario.value = true
}

const guardarGrupo = async () => {
  try {
    if (grupoEditar.value) {
      await GrupoActivoFijoService.update(grupoEditar.value.id, formulario.value)
    } else {
      await GrupoActivoFijoService.create(formulario.value)
    }
    cerrarFormulario()
    await cargarGrupos()
  } catch (error) {
    console.error('Error guardando grupo:', error)
    alert('Error al guardar el grupo')
  }
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  grupoEditar.value = null
  formulario.value = {
    codigo: '',
    nombre: '',
    tasaDepreciacion: null,
    vidaUtilAnios: null,
    descripcion: ''
  }
}

onMounted(() => {
  cargarGrupos()
})
</script>

<style scoped>
.grupo-activo-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #2c3e50;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.data-table th,
.data-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.numero {
  text-align: right;
  font-family: monospace;
}

.acciones {
  white-space: nowrap;
}

.btn-primary {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1em;
  padding: 4px 8px;
}

.badge-success {
  background: #d4edda;
  color: #155724;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #495057;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
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
</style>
