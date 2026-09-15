<!-- src/components/AlmacenList.vue -->

<template>
  <div class="almacen-list">
    <h2>Gestion de Almacenes</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por nombre o inventario..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nuevo Almacen</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando almacenes...</div>

    <table v-else class="almacen-table">
      <thead>
        <tr>
          <th class="numero-col">#</th>
          <th>Finca</th>
          <th>Inventario</th>
          <th>Nombre</th>
          <th>Productos</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="almacenes.length === 0">
          <td colspan="6" class="no-data">No se encontraron almacenes</td>
        </tr>
        <tr v-for="(almacen, index) in almacenes" :key="almacen.id">
          <td class="numero-col">{{ (paginaActual * tamanoPagina) + (index + 1) }}</td>
          <td>
            <span v-if="almacen.fincaName" class="finca-badge">
              {{ almacen.fincaCode }} - {{ almacen.fincaName }}
            </span>
            <span v-else class="sin-finca">Sin asignar</span>
          </td>
          <td><strong>{{ almacen.inventario }}</strong></td>
          <td>{{ almacen.nombre }}</td>
          <td>
            <span class="productos-badge">
              {{ almacen.productosCount || 0 }} productos
            </span>
          </td>
          <td class="acciones">
            <button @click="verAlmacen(almacen)" class="btn-ver">Ver</button>
            <button @click="editarAlmacen(almacen)" class="btn-editar">Editar</button>
            <button @click="confirmarEliminar(almacen)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && almacenes.length > 0" class="pagination">
      <div class="pagination-info">
        <span>Total: {{ totalElementos }} registros</span>
        <span class="separator">|</span>
        <label>
          Mostrar:
          <select v-model="tamanoPagina" @change="cambiarTamanoPagina" class="select-size">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="150">150</option>
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
      <div class="modal-content">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearAlmacen
          :key="'crear-' + Date.now()"
          @created="handleAlmacenCreado"
          @cancel="mostrarModalCrear = false"
        />
      </div>
    </div>

    <!-- Modal Editar -->
    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearAlmacen
          :key="'editar-' + almacenEditando?.id"
          :almacen="almacenEditando"
          @updated="handleAlmacenActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>

      </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AlmacenService from '@/services/AlmacenService'
import CrearAlmacen from './CrearAlmacen.vue'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Almacen } from '@/types/Almacen'
import type { SearchFilter } from '@/types/EstadoCuenta'

const almacenes = ref<Almacen[]>([])
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)

const router = useRouter()

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const almacenEditando = ref<Almacen | null>(null)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const cargarAlmacenes = async () => {
  isLoading.value = true
  almacenes.value = []
  try {
    const filters: SearchFilter[] = []

    if (searchQuery.value.trim()) {
      filters.push({
        key: 'nombre',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'inventario',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
    }

    const response = await AlmacenService.buscarAlmacenes({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
      filter: filters,
    })

    const data = response.data as Record<string, unknown>

    if (data.data && Array.isArray(data.data)) {
      almacenes.value = (data.data as Almacen[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (data.content && Array.isArray(data.content)) {
      almacenes.value = (data.content as Almacen[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (Array.isArray(data)) {
      almacenes.value = data as Almacen[]
      totalElementos.value = almacenes.value.length
    } else {
      almacenes.value = []
      totalElementos.value = 0
    }
  } catch (error) {
    console.error('Error al cargar almacenes:', error)
    notify.error('Error', 'No se pudieron cargar los almacenes')
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarAlmacenes()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarAlmacenes()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarAlmacenes()
}

const verAlmacen = (almacen: Almacen) => {
  if (almacen.id) {
    router.push(`/almacenes/${almacen.id}`)
  }
}

const editarAlmacen = (almacen: Almacen) => {
  almacenEditando.value = { ...almacen }
  mostrarModalEditar.value = true
}

const confirmarEliminar = async (almacen: Almacen) => {
  const productosCount = almacen.productosCount || 0
  const extraMessage = productosCount > 0
    ? `Este almacen tiene ${productosCount} productos asignados.`
    : undefined

  const confirmed = await confirmDialog.delete(almacen.nombre, extraMessage)

  if (confirmed) {
    try {
      await AlmacenService.eliminarAlmacen(almacen.id!)
      notify.success('Almacen eliminado', 'El almacen fue eliminado correctamente')
      cargarAlmacenes()
    } catch (error) {
      console.error('Error al eliminar:', error)
      notify.error('Error', 'No se pudo eliminar el almacen')
    }
  }
}

const handleAlmacenCreado = () => {
  mostrarModalCrear.value = false
  notify.success('Almacen creado', 'El almacen fue registrado correctamente')
  paginaActual.value = 0
  cargarAlmacenes()
}

const handleAlmacenActualizado = () => {
  mostrarModalEditar.value = false
  notify.success('Almacen actualizado', 'Los datos fueron guardados correctamente')
  cargarAlmacenes()
}

onMounted(() => {
  cargarAlmacenes()
})
</script>

<style scoped>
.almacen-list {
  padding: 20px;
  max-width: 1200px;
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
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #9b59b6;
  box-shadow: 0 0 0 3px rgba(155, 89, 182, 0.1);
}

.btn-buscar { background-color: #9b59b6; color: white; }
.btn-crear { background-color: #27ae60; color: white; }

.btn-buscar, .btn-crear {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.95em;
}

.btn-buscar:hover {
  background-color: #8e44ad;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.btn-crear:hover {
  background-color: #219a52;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.loading, .no-data { text-align: center; padding: 40px; color: #888; }

.almacen-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.almacen-table th, .almacen-table td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.almacen-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.almacen-table tr:nth-child(even) { background-color: #fafafa; }
.almacen-table tr:hover { background-color: #f5f0f9; }

.numero-col {
  width: 50px;
  text-align: center;
  font-weight: 600;
  color: #7f8c8d;
}

.productos-badge {
  display: inline-block;
  padding: 4px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
}

.finca-badge {
  display: inline-block;
  padding: 4px 10px;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 8px;
  font-size: 0.85em;
  font-weight: 500;
}

.sin-finca {
  color: #999;
  font-style: italic;
  font-size: 0.85em;
}

.acciones {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.acciones button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  transition: all 0.3s ease;
}

.btn-ver {
  background-color: #1abc9c;
  color: white;
}

.btn-ver:hover {
  background-color: #16a085;
  transform: translateY(-2px);
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-editar:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

.btn-eliminar:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
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
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 0.95em;
}

.pagination-info .separator { color: #ccc; }

.select-size {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-left: 5px;
  cursor: pointer;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-indicator {
  padding: 0 15px;
  font-weight: 500;
  color: #2c3e50;
}

.btn-pag {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-pag:hover:not(:disabled) {
  background: #f0f0f0;
  border-color: #bbb;
}

.btn-pag:disabled {
  background: #f5f5f5;
  color: #aaa;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  z-index: 1000;
  left: 0; top: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 16px;
  position: relative;
  width: 90%;
  max-width: 500px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}


.close {
  position: absolute;
  top: 10px; right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
  transition: all 0.3s ease;
  line-height: 1;
}

.close:hover {
  color: #333;
  transform: rotate(90deg);
}

@media (max-width: 768px) {
  .almacen-list {
    padding: 10px;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-input {
    min-width: 100%;
  }

  .almacen-table {
    font-size: 0.85em;
  }

  .almacen-table th,
  .almacen-table td {
    padding: 8px 10px;
  }

  .acciones {
    flex-direction: column;
    gap: 3px;
  }

  .acciones button {
    padding: 4px 8px;
    font-size: 0.75em;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .pagination-info {
    justify-content: center;
  }

  .pagination-controls {
    justify-content: center;
  }

  .modal-content {
    width: 95%;
    padding: 20px;
  }

  }
</style>
