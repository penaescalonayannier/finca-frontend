<!-- src/components/FincaProductoList.vue -->

<template>
  <div class="finca-producto-list">
    <h2>Gestión de Productos por Finca</h2>

    <!-- Filtros -->
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
          placeholder="Buscar por código o nombre..."
          class="search-input"
          @keyup.enter="buscarConReset"
        />
      </div>
      
      <div class="button-group">
        <button @click="buscarConReset" class="btn-buscar">Buscar</button>
        <button @click="abrirModalAsignar" class="btn-crear">Asignar Producto</button>
        <button v-if="seleccionados.length > 0" @click="exportarRelaciones" class="btn-exportar">
          Exportar ({{ seleccionados.length }})
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">Cargando relaciones...</div>

    <!-- Tabla -->
    <table v-else class="tabla-relaciones">
      <thead>
        <tr>
          <th class="checkbox-col">
            <input
              type="checkbox"
              :checked="todosSeleccionados"
              @change="toggleSeleccionarTodos"
            />
          </th>
          <th>Finca</th>
          <th>Producto</th>
          <th>Precio</th>
          <th>Stock</th>
          <th>Valor Total</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="relaciones.length === 0">
          <td colspan="7" class="no-data">No se encontraron relaciones</td>
        </tr>
        <tr v-for="relacion in relaciones" :key="relacion.id">
          <td class="checkbox-col">
            <input
              type="checkbox"
              :checked="estaSeleccionado(relacion.id)"
              @change="toggleSeleccionar(relacion)"
            />
          </td>
          <td>
            <strong>{{ relacion.fincaCode }}</strong>
            <span class="subtext">{{ relacion.fincaName }}</span>
          </td>
          <td>
            <strong>{{ relacion.productoCode }}</strong>
            <span class="subtext">{{ relacion.productoName }}</span>
          </td>
          <td class="price-cell">${{ relacion.productoPrice.toFixed(2) }}</td>
          <td>
            <span :class="['stock-badge', getStockClass(relacion.stock)]">
              {{ relacion.stock }}
            </span>
          </td>
          <td class="price-cell total-cell">
            ${{ (relacion.productoPrice * relacion.stock).toFixed(2) }}
          </td>
          <td class="acciones">
            <button @click="editarStock(relacion)" class="btn-editar">✏️ Stock</button>
            <button @click="confirmarRemover(relacion)" class="btn-eliminar">🗑️</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginación -->
    <div v-if="!isLoading && relaciones.length > 0" class="pagination">
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
        <span class="page-indicator">Página {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1 || totalPaginas === 0" @click="cambiarPagina(paginaActual + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal Asignar Producto -->
    <div v-if="mostrarModalAsignar" class="modal">
      <div class="modal-content modal-asignar">
        <span class="close" @click="cerrarModalAsignar">&times;</span>
        <h3>Asignar Producto a Finca</h3>
        
        <form @submit.prevent="asignarProducto">
          <div class="form-group">
            <label>Finca *</label>
            <select v-model="formAsignar.fincaId" required class="form-select">
              <option value="">Seleccione una finca</option>
              <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
                {{ finca.code }} - {{ finca.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Producto *</label>
            <select v-model="formAsignar.productoId" required class="form-select">
              <option value="">Seleccione un producto</option>
              <option v-for="producto in productos" :key="producto.id" :value="producto.id">
                {{ producto.code }} - {{ producto.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Stock Inicial *</label>
            <input
              v-model.number="formAsignar.stock"
              type="number"
              required
              min="0"
              class="form-input"
              placeholder="0"
            />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-guardar" :disabled="isGuardando">
              {{ isGuardando ? 'Asignando...' : 'Asignar' }}
            </button>
            <button type="button" class="btn-cancelar" @click="cerrarModalAsignar">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Editar Stock -->
    <div v-if="mostrarModalStock" class="modal">
      <div class="modal-content modal-small">
        <span class="close" @click="cerrarModalStock">&times;</span>
        <h3>Actualizar Stock</h3>
        <p>
          <strong>{{ relacionStock?.productoName }}</strong>
          en <strong>{{ relacionStock?.fincaName }}</strong>
        </p>
        
        <div class="form-group">
          <label>Stock Actual: {{ relacionStock?.stock }}</label>
          <input
            v-model.number="formStock.stock"
            type="number"
            required
            min="0"
            class="form-input"
            placeholder="Nuevo stock"
          />
        </div>

        <div class="form-actions">
          <button @click="actualizarStockHandler" class="btn-guardar" :disabled="isGuardando">
            {{ isGuardando ? 'Actualizando...' : 'Actualizar' }}
          </button>
          <button type="button" class="btn-cancelar" @click="cerrarModalStock">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Confirmar Remover -->
    <div v-if="mostrarModalRemover" class="modal">
      <div class="modal-content modal-small">
        <h3>Confirmar Remoción</h3>
        <p>
          ¿Remover el producto <strong>{{ relacionRemover?.productoName }}</strong>
          de la finca <strong>{{ relacionRemover?.fincaName }}</strong>?
        </p>
        <div class="modal-buttons">
          <button @click="removerProducto" class="btn-eliminar">Remover</button>
          <button @click="mostrarModalRemover = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import FincaProductoService from '@/services/FincaProductoService'
import FincaService from '@/services/FincaService'
import ProductoService from '@/services/ProductoService'
import type { FincaProducto } from '@/types/FincaProducto'
import type { Finca } from '@/types/Finca'
import type { Producto } from '@/types/Producto'
import type { SearchFilter } from '@/types/EstadoCuenta'

// Estado
const relaciones = ref<FincaProducto[]>([])
const fincas = ref<Finca[]>([])
const productos = ref<Producto[]>([])
const isLoading = ref(false)
const isGuardando = ref(false)
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const seleccionados = ref<string[]>([])
const filtroFinca = ref('')
const filtroProducto = ref('')

// Modales
const mostrarModalAsignar = ref(false)
const mostrarModalStock = ref(false)
const mostrarModalRemover = ref(false)

// Formularios
const formAsignar = ref({
  fincaId: '',
  productoId: '',
  stock: 0
})

const formStock = ref({
  stock: 0
})

const relacionStock = ref<FincaProducto | null>(null)
const relacionRemover = ref<FincaProducto | null>(null)

// Computed
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const todosSeleccionados = computed(() => {
  return relaciones.value.length > 0 && relaciones.value.every(r => estaSeleccionado(r.id))
})

// Métodos
const cargarFincas = async () => {
  try {
    const response = await FincaService.buscarFincas({ size: 999 })
    fincas.value = response.data.data || []
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

const cargarRelaciones = async () => {
  isLoading.value = true
  try {
    const filters: SearchFilter[] = []
    
    if (filtroFinca.value) {
      filters.push({ field: 'fincaId', operator: 'eq', value: filtroFinca.value })
    }
    if (filtroProducto.value) {
      filters.push({ field: 'productoId', operator: 'eq', value: filtroProducto.value })
    }

    const response = await FincaProductoService.searchFincaProductos({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters
    })

    relaciones.value = response.data.data || []
    totalElementos.value = response.data.totalElements || 0
  } catch (error) {
    console.error('Error al cargar relaciones:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarRelaciones()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarRelaciones()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarRelaciones()
}

// Selección
const estaSeleccionado = (id: string): boolean => {
  return seleccionados.value.includes(id)
}

const toggleSeleccionar = (relacion: FincaProducto) => {
  const index = seleccionados.value.indexOf(relacion.id)
  if (index > -1) {
    seleccionados.value.splice(index, 1)
  } else {
    seleccionados.value.push(relacion.id)
  }
}

const toggleSeleccionarTodos = () => {
  if (todosSeleccionados.value) {
    seleccionados.value = []
  } else {
    seleccionados.value = relaciones.value.map(r => r.id)
  }
}

// Asignar producto
const abrirModalAsignar = () => {
  formAsignar.value = { fincaId: '', productoId: '', stock: 0 }
  mostrarModalAsignar.value = true
}

const cerrarModalAsignar = () => {
  mostrarModalAsignar.value = false
  formAsignar.value = { fincaId: '', productoId: '', stock: 0 }
}

const asignarProducto = async () => {
  if (!formAsignar.value.fincaId || !formAsignar.value.productoId) {
    alert('Seleccione una finca y un producto')
    return
  }

  isGuardando.value = true
  try {
    await FincaProductoService.asignarProductoAFinca(formAsignar.value)
    cerrarModalAsignar()
    cargarRelaciones()
  } catch (error: any) {
    console.error('Error al asignar:', error)
    alert(error.response?.data?.message || 'Error al asignar el producto')
  } finally {
    isGuardando.value = false
  }
}

// Editar stock
const editarStock = (relacion: FincaProducto) => {
  relacionStock.value = relacion
  formStock.value = { stock: relacion.stock }
  mostrarModalStock.value = true
}

const cerrarModalStock = () => {
  mostrarModalStock.value = false
  relacionStock.value = null
}

const actualizarStockHandler = async () => {
  if (!relacionStock.value) return
  if (formStock.value.stock < 0) {
    alert('El stock no puede ser negativo')
    return
  }

  isGuardando.value = true
  try {
    await FincaProductoService.actualizarStock({
      fincaId: relacionStock.value.fincaId,
      productoId: relacionStock.value.productoId,
      stock: formStock.value.stock
    })
    cerrarModalStock()
    cargarRelaciones()
  } catch (error: any) {
    console.error('Error al actualizar stock:', error)
    alert(error.response?.data?.message || 'Error al actualizar el stock')
  } finally {
    isGuardando.value = false
  }
}

// Remover producto
const confirmarRemover = (relacion: FincaProducto) => {
  relacionRemover.value = relacion
  mostrarModalRemover.value = true
}

const removerProducto = async () => {
  if (!relacionRemover.value) return

  try {
    await FincaProductoService.removerProductoDeFinca({
      fincaId: relacionRemover.value.fincaId,
      productoId: relacionRemover.value.productoId
    })
    mostrarModalRemover.value = false
    relacionRemover.value = null
    cargarRelaciones()
  } catch (error: any) {
    console.error('Error al remover:', error)
    alert(error.response?.data?.message || 'Error al remover el producto')
  }
}

// Exportar
const exportarRelaciones = async () => {
  alert(`Exportando ${seleccionados.value.length} relaciones...`)
  // Implementación pendiente
}

// Utilidades
const getStockClass = (stock: number): string => {
  if (stock === 0) return 'stock-cero'
  if (stock <= 5) return 'stock-bajo'
  if (stock <= 15) return 'stock-medio'
  return 'stock-alto'
}

// Lifecycle
onMounted(() => {
  cargarFincas()
  cargarProductos()
  cargarRelaciones()
})

// Watchers
watch([filtroFinca, filtroProducto], () => {
  paginaActual.value = 0
  cargarRelaciones()
})
</script>

<style scoped>
.finca-producto-list {
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
  min-width: 180px;
  background: #fff;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-buscar {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-buscar:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-crear {
  background-color: #27ae60;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-crear:hover {
  background-color: #219a52;
  transform: translateY(-2px);
}

.btn-exportar {
  background-color: #e67e22;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-exportar:hover {
  background-color: #d35400;
  transform: translateY(-2px);
}

.loading,
.no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.tabla-relaciones {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tabla-relaciones th,
.tabla-relaciones td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.tabla-relaciones th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tabla-relaciones tr:nth-child(even) {
  background-color: #fafafa;
}

.tabla-relaciones tr:hover {
  background-color: #f0f7ff;
}

.checkbox-col {
  width: 40px;
  text-align: center;
}

.checkbox-col input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
}

.subtext {
  display: block;
  font-size: 0.8em;
  color: #888;
  font-weight: 400;
}

.price-cell {
  font-weight: 600;
  color: #27ae60;
}

.total-cell {
  color: #e67e22;
  font-weight: 700;
}

.stock-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.stock-cero {
  background-color: #ffebee;
  color: #c62828;
}

.stock-bajo {
  background-color: #fff3e0;
  color: #e65100;
}

.stock-medio {
  background-color: #e3f2fd;
  color: #1565c0;
}

.stock-alto {
  background-color: #e8f5e9;
  color: #2e7d32;
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
  transition: all 0.3s ease;
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

.pagination-info .separator {
  color: #ccc;
}

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
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-asignar {
  max-width: 500px;
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
  transition: all 0.3s ease;
  line-height: 1;
}

.close:hover {
  color: #333;
  transform: rotate(90deg);
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
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
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
  transition: all 0.3s ease;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
  transform: translateY(-2px);
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
  transition: all 0.3s ease;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
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

  .filter-select {
    min-width: 100%;
  }

  .search-input {
    min-width: 100%;
  }

  .button-group {
    width: 100%;
  }

  .button-group button {
    flex: 1;
  }

  .tabla-relaciones {
    font-size: 0.85em;
  }

  .tabla-relaciones th,
  .tabla-relaciones td {
    padding: 8px 10px;
  }

  .acciones {
    flex-direction: column;
    gap: 3px;
  }

  .pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination-info {
    justify-content: center;
  }

  .pagination-controls {
    justify-content: center;
  }
}
</style>