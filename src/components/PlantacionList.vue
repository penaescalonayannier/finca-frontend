<template>
  <div class="plantacion-list">
    <div class="header">
      <h2>Plantaciones Permanentes (Grupos 12-13)</h2>
      <div class="header-actions">
        <select v-model="filtroTipo" @change="buscar" class="filtro-select">
          <option value="">Todos los tipos</option>
          <option v-for="tipo in tiposPlantacion" :key="tipo" :value="tipo">
            {{ plantacionLabels[tipo] }}
          </option>
        </select>
        <input
          v-model.number="filtroBloque"
          type="number"
          placeholder="Bloque..."
          @input="buscarDebounced"
          class="filtro-input"
        />
        <button @click="mostrarFormulario = true" class="btn-primary">
          + Nueva Plantación
        </button>
      </div>
    </div>

    <div v-if="cargando" class="loading">Cargando plantaciones...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>No. Inventario</th>
          <th>Tipo</th>
          <th>Bloque</th>
          <th>Campo</th>
          <th>Área (ha)</th>
          <th>Cepa</th>
          <th>Variedad</th>
          <th>Valor</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="plantacion in plantaciones" :key="plantacion.id">
          <td>{{ plantacion.numeroInventario || '-' }}</td>
          <td>{{ plantacionLabels[plantacion.tipoPlantacion] }}</td>
          <td class="numero">{{ plantacion.bloque }}</td>
          <td class="numero">{{ plantacion.campo }}</td>
          <td class="numero">{{ plantacion.areaHectareas?.toFixed(4) || '-' }}</td>
          <td>{{ cepaLabels[plantacion.tipoCepa] || plantacion.tipoCepa || '-' }}</td>
          <td>{{ plantacion.codigoVariedad || '-' }}</td>
          <td class="numero">{{ formatCurrency(plantacion.valorAdquisicion) }}</td>
          <td class="acciones">
            <button @click="editarPlantacion(plantacion)" class="btn-icon" title="Editar">✏️</button>
            <button @click="eliminarPlantacion(plantacion)" class="btn-icon btn-danger" title="Eliminar">🗑️</button>
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
        <h3>{{ plantacionEditar ? 'Editar' : 'Nueva' }} Plantación</h3>
        <form @submit.prevent="guardarPlantacion">
          <div class="form-group">
            <label>Tipo de Plantación *</label>
            <select v-model="formulario.tipoPlantacion" required>
              <option value="">-- Seleccionar --</option>
              <option v-for="tipo in tiposPlantacion" :key="tipo" :value="tipo">
                {{ plantacionLabels[tipo] }}
              </option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Bloque</label>
              <input v-model.number="formulario.bloque" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>Campo</label>
              <input v-model.number="formulario.campo" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>Área (ha)</label>
              <input v-model.number="formulario.areaHectareas" type="number" step="0.0001" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tipo de Cepa</label>
              <select v-model="formulario.tipoCepa">
                <option value="">-- Seleccionar --</option>
                <option v-for="cepa in tiposCepa" :key="cepa" :value="cepa">
                  {{ cepaLabels[cepa] }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Años Cepa</label>
              <input v-model.number="formulario.aniosCepa" type="number" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label>Código Variedad</label>
            <input v-model="formulario.codigoVariedad" placeholder="Ej: C90-469, C86-12" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Valor Adquisición *</label>
              <input v-model.number="formulario.valorAdquisicion" type="number" step="0.01" required />
            </div>
            <div class="form-group">
              <label>Valor Tasación</label>
              <input v-model.number="formulario.valorTasacion" type="number" step="0.01" />
            </div>
          </div>
          <div class="form-group">
            <label>Destino</label>
            <input v-model="formulario.destino" />
          </div>
          <div class="form-actions">
            <button type="button" @click="cerrarFormulario" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ plantacionEditar ? 'Actualizar' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlantacionService } from '@/services/ActivoFijoService'
import type { PlantacionPermanente, CreatePlantacionRequest } from '@/types/ActivoFijo'
import { TipoPlantacion, TipoCepa, tipoPlantacionLabels, tipoCepaLabels } from '@/types/ActivoFijo'

const plantaciones = ref<PlantacionPermanente[]>([])
const cargando = ref(false)
const filtroTipo = ref('')
const filtroBloque = ref<number | null>(null)
const page = ref(0)
const pageSize = ref(10)
const totalPages = ref(0)
const totalElements = ref(0)

const tiposPlantacion = Object.values(TipoPlantacion)
const tiposCepa = Object.values(TipoCepa)
const plantacionLabels = tipoPlantacionLabels as Record<string, string>
const cepaLabels = tipoCepaLabels as Record<string, string>

const mostrarFormulario = ref(false)
const plantacionEditar = ref<PlantacionPermanente | null>(null)
const formulario = ref<CreatePlantacionRequest>({
  tipoPlantacion: TipoPlantacion.CANA,
  valorAdquisicion: 0
})

let debounceTimer: number | null = null

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP' }).format(value)
}

const buscar = async () => {
  cargando.value = true
  try {
    const response = await PlantacionService.search({
      tipoPlantacion: filtroTipo.value as TipoPlantacion || undefined,
      bloque: filtroBloque.value || undefined,
      page: page.value,
      size: pageSize.value
    })
    plantaciones.value = response.data.content
    totalPages.value = response.data.totalPages
    totalElements.value = response.data.totalElements
  } catch (error) {
    console.error('Error buscando plantaciones:', error)
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

const editarPlantacion = (plantacion: PlantacionPermanente) => {
  plantacionEditar.value = plantacion
  formulario.value = {
    tipoPlantacion: plantacion.tipoPlantacion,
    bloque: plantacion.bloque,
    campo: plantacion.campo,
    areaHectareas: plantacion.areaHectareas,
    tipoCepa: plantacion.tipoCepa,
    codigoVariedad: plantacion.codigoVariedad,
    aniosCepa: plantacion.aniosCepa,
    valorAdquisicion: plantacion.valorAdquisicion,
    valorTasacion: plantacion.valorTasacion,
    destino: plantacion.destino
  }
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  plantacionEditar.value = null
  formulario.value = {
    tipoPlantacion: TipoPlantacion.CANA,
    valorAdquisicion: 0
  }
}

const guardarPlantacion = async () => {
  try {
    if (plantacionEditar.value) {
      await PlantacionService.update(plantacionEditar.value.id, formulario.value)
    } else {
      await PlantacionService.create(formulario.value)
    }
    cerrarFormulario()
    buscar()
  } catch (error) {
    console.error('Error guardando plantación:', error)
    alert('Error al guardar la plantación')
  }
}

const eliminarPlantacion = async (plantacion: PlantacionPermanente) => {
  if (!confirm(`¿Eliminar plantación B${plantacion.bloque}-C${plantacion.campo}?`)) return
  try {
    await PlantacionService.delete(plantacion.id)
    buscar()
  } catch (error) {
    console.error('Error eliminando plantación:', error)
    alert('Error al eliminar la plantación')
  }
}

onMounted(() => {
  buscar()
})
</script>

<style scoped>
.plantacion-list {
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

.filtro-select, .filtro-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filtro-input {
  width: 100px;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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

.numero {
  text-align: right;
  font-family: monospace;
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
  max-width: 550px;
  width: 90%;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
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
