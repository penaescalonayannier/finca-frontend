<template>
  <div class="activo-animal-list">
    <div class="header">
      <h2>Inventario de Animales (Grupo 08)</h2>
      <div class="header-actions">
        <select v-model="filtroTipoGanado" @change="buscar" class="filtro-select">
          <option value="">Todos los tipos</option>
          <option v-for="tipo in tiposGanado" :key="tipo" :value="tipo">
            {{ tipoLabels[tipo] }}
          </option>
        </select>
        <select v-model="filtroCategoria" @change="buscar" class="filtro-select">
          <option value="">Todas las categorías</option>
          <option v-for="cat in categorias" :key="cat" :value="cat">
            {{ categoriaLabels[cat] }}
          </option>
        </select>
        <button @click="mostrarFormulario = true" class="btn-primary">
          + Nuevo Animal
        </button>
      </div>
    </div>

    <div v-if="cargando" class="loading">Cargando animales...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>No. Inventario</th>
          <th>Categoría</th>
          <th>Tipo</th>
          <th>Hierro</th>
          <th>Arete</th>
          <th>Peso (kg)</th>
          <th>Valor</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="animal in animales" :key="animal.id">
          <td>{{ animal.numeroInventario || '-' }}</td>
          <td>{{ categoriaLabels[animal.categoria] }}</td>
          <td>{{ tipoLabels[animal.tipoGanado] }}</td>
          <td>{{ animal.hierro || '-' }}</td>
          <td>{{ animal.codigoArete || '-' }}</td>
          <td class="numero">{{ animal.pesoPromedio || '-' }}</td>
          <td class="numero">{{ formatCurrency(animal.valorAdquisicion) }}</td>
          <td class="acciones">
            <button @click="editarAnimal(animal)" class="btn-icon" title="Editar">✏️</button>
            <button @click="eliminarAnimal(animal)" class="btn-icon btn-danger" title="Eliminar">🗑️</button>
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
        <h3>{{ animalEditar ? 'Editar' : 'Nuevo' }} Animal</h3>
        <form @submit.prevent="guardarAnimal">
          <div class="form-row">
            <div class="form-group">
              <label>Tipo de Ganado *</label>
              <select v-model="formulario.tipoGanado" required>
                <option value="">-- Seleccionar --</option>
                <option v-for="tipo in tiposGanado" :key="tipo" :value="tipo">
                  {{ tipoLabels[tipo] }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Categoría *</label>
              <select v-model="formulario.categoria" required>
                <option value="">-- Seleccionar --</option>
                <option v-for="cat in categorias" :key="cat" :value="cat">
                  {{ categoriaLabels[cat] }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Hierro</label>
              <input v-model="formulario.hierro" placeholder="Marca de hierro" />
            </div>
            <div class="form-group">
              <label>Código Arete</label>
              <input v-model="formulario.codigoArete" placeholder="Identificador arete" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Peso Promedio (kg)</label>
              <input v-model.number="formulario.pesoPromedio" type="number" step="0.01" />
            </div>
            <div class="form-group">
              <label>Años de Vida</label>
              <input v-model.number="formulario.aniosVida" type="number" min="0" />
            </div>
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
            <input v-model="formulario.destino" placeholder="Uso o destino del animal" />
          </div>
          <div class="form-actions">
            <button type="button" @click="cerrarFormulario" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">{{ animalEditar ? 'Actualizar' : 'Crear' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ActivoAnimalService } from '@/services/ActivoFijoService'
import type { ActivoAnimal, CreateActivoAnimalRequest } from '@/types/ActivoFijo'
import { CategoriaAnimal, TipoGanado, categoriaAnimalLabels, tipoGanadoLabels } from '@/types/ActivoFijo'

const animales = ref<ActivoAnimal[]>([])
const cargando = ref(false)
const filtroTipoGanado = ref('')
const filtroCategoria = ref('')
const page = ref(0)
const pageSize = ref(10)
const totalPages = ref(0)
const totalElements = ref(0)

const tiposGanado = Object.values(TipoGanado)
const categorias = Object.values(CategoriaAnimal)
const categoriaLabels = categoriaAnimalLabels as Record<string, string>
const tipoLabels = tipoGanadoLabels as Record<string, string>

const mostrarFormulario = ref(false)
const animalEditar = ref<ActivoAnimal | null>(null)
const formulario = ref<CreateActivoAnimalRequest>({
  categoria: CategoriaAnimal.TERNERO,
  tipoGanado: TipoGanado.VACUNO,
  valorAdquisicion: 0
})

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP' }).format(value)
}

const buscar = async () => {
  cargando.value = true
  try {
    const response = await ActivoAnimalService.search({
      tipoGanado: filtroTipoGanado.value as TipoGanado || undefined,
      categoria: filtroCategoria.value as CategoriaAnimal || undefined,
      page: page.value,
      size: pageSize.value
    })
    animales.value = response.data.content
    totalPages.value = response.data.totalPages
    totalElements.value = response.data.totalElements
  } catch (error) {
    console.error('Error buscando animales:', error)
  } finally {
    cargando.value = false
  }
}

const cambiarPageSize = () => {
  page.value = 0
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

const editarAnimal = (animal: ActivoAnimal) => {
  animalEditar.value = animal
  formulario.value = {
    categoria: animal.categoria,
    tipoGanado: animal.tipoGanado,
    hierro: animal.hierro,
    codigoArete: animal.codigoArete,
    pesoPromedio: animal.pesoPromedio,
    aniosVida: animal.aniosVida,
    valorAdquisicion: animal.valorAdquisicion,
    valorTasacion: animal.valorTasacion,
    destino: animal.destino
  }
  mostrarFormulario.value = true
}

const cerrarFormulario = () => {
  mostrarFormulario.value = false
  animalEditar.value = null
  formulario.value = {
    categoria: CategoriaAnimal.TERNERO,
    tipoGanado: TipoGanado.VACUNO,
    valorAdquisicion: 0
  }
}

const guardarAnimal = async () => {
  try {
    if (animalEditar.value) {
      await ActivoAnimalService.update(animalEditar.value.id, formulario.value)
    } else {
      await ActivoAnimalService.create(formulario.value)
    }
    cerrarFormulario()
    buscar()
  } catch (error) {
    console.error('Error guardando animal:', error)
    alert('Error al guardar el animal')
  }
}

const eliminarAnimal = async (animal: ActivoAnimal) => {
  if (!confirm(`¿Eliminar animal ${animal.codigoArete || animal.hierro || 'sin identificar'}?`)) return
  try {
    await ActivoAnimalService.delete(animal.id)
    buscar()
  } catch (error) {
    console.error('Error eliminando animal:', error)
    alert('Error al eliminar el animal')
  }
}

onMounted(() => {
  buscar()
})
</script>

<style scoped>
.activo-animal-list {
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

.filtro-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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
  max-width: 500px;
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
