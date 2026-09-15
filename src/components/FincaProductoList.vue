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
        <button @click="abrirModalAsignar" class="btn-crear">+ Asignar Producto</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">Cargando relaciones...</div>

    <!-- Tabla -->
    <table v-else class="tabla-relaciones">
      <thead>
        <tr>
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
          <td colspan="6" class="no-data">No se encontraron relaciones</td>
        </tr>
        <tr v-for="relacion in relaciones" :key="relacion.id">
          <td>
            <strong>{{ relacion.fincaCode }}</strong>
            <span class="subtext">{{ relacion.fincaName }}</span>
          </td>
          <td>
            <strong>{{ relacion.productoCode }}</strong>
            <span class="subtext">{{ relacion.productoName }}</span>
          </td>
          <td class="price-cell">${{ relacion.productoPrice?.toFixed(2) || '0.00' }}</td>
          <td>
            <span :class="['stock-badge', getStockClass(relacion)]" :title="'Mín: ' + relacion.stockMinimo + (relacion.stockMaximo ? ' | Máx: ' + relacion.stockMaximo : '')">
              {{ relacion.stock }}
              <span v-if="relacion.estadoStock" class="estado-label">{{ getEstadoLabel(relacion) }}</span>
            </span>
          </td>
          <td class="price-cell total-cell">
            ${{ ((relacion.productoPrice || 0) * relacion.stock).toFixed(2) }}
          </td>
          <td class="acciones">
            <button @click="abrirModalAjuste(relacion)" class="btn-ajuste" title="Ajustar existencias por almacén">
              ⚖️ Ajustar
            </button>
            <button @click="confirmarEliminar(relacion)" class="btn-eliminar" title="Eliminar relación">
              🗑️
            </button>
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
    <div v-if="mostrarModalAsignar" class="modal" @click.self="cerrarModalAsignar">
      <div class="modal-content modal-asignar">
        <span class="close" @click="cerrarModalAsignar">&times;</span>
        <h3>Asignar Producto a Finca</h3>

        <div class="form-group">
          <label>Finca *</label>
          <select v-model="formAsignar.fincaId" class="form-select" required>
            <option value="">Seleccione una finca</option>
            <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
              {{ finca.code }} - {{ finca.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Producto *</label>
          <select v-model="formAsignar.productoId" class="form-select" required>
            <option value="">Seleccione un producto</option>
            <option v-for="producto in productos" :key="producto.id" :value="producto.id">
              {{ producto.code }} - {{ producto.name }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Stock Inicial</label>
            <input v-model.number="formAsignar.stock" type="number" min="0" step="0.0001" class="form-input" placeholder="0.0000" />
          </div>
          <div class="form-group">
            <label>Stock Mínimo</label>
            <input v-model.number="formAsignar.stockMinimo" type="number" min="0" step="0.0001" class="form-input" placeholder="0.0000" />
          </div>
        </div>

        <div class="form-actions">
          <button @click="cerrarModalAsignar" class="btn-cancelar">Cancelar</button>
          <button @click="asignarProducto" class="btn-guardar" :disabled="!formAsignar.fincaId || !formAsignar.productoId || isGuardando">
            {{ isGuardando ? 'Guardando...' : 'Asignar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Ajuste de Stock por Almacén -->
    <div v-if="mostrarModalAjuste" class="modal" @click.self="cerrarModalAjuste">
      <div class="modal-content modal-ajuste">
        <span class="close" @click="cerrarModalAjuste">&times;</span>
        <h3>Ajustar existencias</h3>
        <p v-if="relacionAjuste" class="ajuste-resumen">
          <strong>{{ relacionAjuste.productoName }}</strong> · {{ relacionAjuste.fincaName }}
          <br>Stock total actual: <strong>{{ relacionAjuste.stock }}</strong>
        </p>

        <div class="form-group">
          <label>Almacén afectado *</label>
          <select v-model="formAjuste.almacenId" class="form-select" :disabled="cargandoAlmacenes || isAjustando">
            <option value="">{{ cargandoAlmacenes ? 'Cargando almacenes...' : 'Seleccione un almacén' }}</option>
            <option v-for="almacenProducto in almacenesProducto" :key="almacenProducto.id" :value="almacenProducto.almacenId">
              {{ almacenProducto.almacenNombre }} — disponible: {{ almacenProducto.stock }}
            </option>
          </select>
          <small v-if="!cargandoAlmacenes && almacenesProducto.length === 0" class="field-help error-text">
            Este producto no está asignado a ningún almacén activo.
          </small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Operación *</label>
            <select v-model="formAjuste.tipoMovimiento" class="form-select" :disabled="isAjustando">
              <option value="ENTRADA_AJUSTE">Aumentar existencia</option>
              <option value="SALIDA_AJUSTE">Disminuir existencia</option>
            </select>
          </div>
          <div class="form-group">
            <label>Cantidad *</label>
            <input v-model.number="formAjuste.cantidad" type="number" min="0.0001" step="0.0001" class="form-input" :disabled="isAjustando" />
          </div>
        </div>

        <div class="form-group">
          <label>Motivo del ajuste *</label>
          <textarea v-model.trim="formAjuste.observaciones" class="form-input" rows="3" maxlength="500" :disabled="isAjustando"
            placeholder="Ej.: Conteo físico de inventario"></textarea>
        </div>

        <div class="form-actions">
          <button @click="cerrarModalAjuste" class="btn-cancelar" :disabled="isAjustando">Cancelar</button>
          <button @click="guardarAjuste" class="btn-guardar" :disabled="!puedeGuardarAjuste || isAjustando">
            {{ isAjustando ? 'Guardando...' : 'Aplicar ajuste' }}
          </button>
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
import AlmacenService from '@/services/AlmacenService'
import MovimientoStockService from '@/services/MovimientoStockService'
import { notify } from '@/composables/useNotification'
import type { FincaProducto } from '@/types/FincaProducto'
import type { Finca } from '@/types/Finca'
import type { Producto } from '@/types/Producto'
import type { AlmacenFincaProducto } from '@/types/Almacen'
import type { SearchFilter } from '@/types/EstadoCuenta'

interface ApiErrorResponse {
  message?: string
  errorFields?: Array<{ message?: string }>
}

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: ApiErrorResponse } })?.response?.data
  return data?.errorFields?.map(field => field.message).filter(Boolean).join('. ')
    || data?.message
    || fallback
}

// Estado
const relaciones = ref<FincaProducto[]>([])
const fincas = ref<Finca[]>([])
const productos = ref<Producto[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const filtroFinca = ref('')
const filtroProducto = ref('')
const mostrarModalAsignar = ref(false)
const isGuardando = ref(false)
const mostrarModalAjuste = ref(false)
const cargandoAlmacenes = ref(false)
const isAjustando = ref(false)
const relacionAjuste = ref<FincaProducto | null>(null)
const almacenesProducto = ref<AlmacenFincaProducto[]>([])
const formAsignar = ref({
  fincaId: '',
  productoId: '',
  stock: 0,
  stockMinimo: 0
})
const formAjuste = ref({
  almacenId: '',
  tipoMovimiento: 'ENTRADA_AJUSTE' as 'ENTRADA_AJUSTE' | 'SALIDA_AJUSTE',
  cantidad: 0.0001,
  observaciones: ''
})

// Computed
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))
const puedeGuardarAjuste = computed(() =>
  Boolean(formAjuste.value.almacenId) &&
  formAjuste.value.cantidad > 0 &&
  Boolean(formAjuste.value.observaciones.trim())
)

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
      filters.push({ field: 'fincaId', operator: 'EQUALS', value: filtroFinca.value })
    }
    if (filtroProducto.value) {
      filters.push({ field: 'productoId', operator: 'EQUALS', value: filtroProducto.value })
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

// Modal Asignar
const abrirModalAsignar = () => {
  formAsignar.value = {
    fincaId: '',
    productoId: '',
    stock: 0,
    stockMinimo: 0
  }
  mostrarModalAsignar.value = true
}

const cerrarModalAsignar = () => {
  mostrarModalAsignar.value = false
}

const asignarProducto = async () => {
  if (!formAsignar.value.fincaId || !formAsignar.value.productoId) {
    notify.warning('Campos requeridos', 'Debe seleccionar una finca y un producto')
    return
  }

  isGuardando.value = true
  try {
    await FincaProductoService.asignarProductoAFinca({
      fincaId: formAsignar.value.fincaId,
      productoId: formAsignar.value.productoId,
      stock: formAsignar.value.stock || 0,
      stockMinimo: formAsignar.value.stockMinimo || 0
    })
    notify.success('Producto asignado', 'El producto fue asignado a la finca correctamente')
    cerrarModalAsignar()
    cargarRelaciones()
  } catch (error: any) {
    console.error('Error al asignar producto:', error)
    const errorData = error.response?.data
    let mensaje = 'Error al asignar el producto'
    if (errorData?.errorFields?.length > 0) {
      mensaje = errorData.errorFields.map((e: any) => e.message).join('. ')
    } else if (errorData?.message) {
      mensaje = errorData.message
    }
    notify.error('Error', mensaje)
  } finally {
    isGuardando.value = false
  }
}

const abrirModalAjuste = async (relacion: FincaProducto) => {
  relacionAjuste.value = relacion
  formAjuste.value = {
    almacenId: '',
    tipoMovimiento: 'ENTRADA_AJUSTE',
    cantidad: 0.0001,
    observaciones: ''
  }
  almacenesProducto.value = []
  mostrarModalAjuste.value = true
  cargandoAlmacenes.value = true

  try {
    const response = await AlmacenService.obtenerAlmacenesPorFincaProducto(relacion.id)
    almacenesProducto.value = response.data || []
  } catch (error) {
    console.error('Error al cargar almacenes del producto:', error)
    notify.error('Error', 'No se pudieron cargar los almacenes disponibles')
  } finally {
    cargandoAlmacenes.value = false
  }
}

const cerrarModalAjuste = () => {
  if (isAjustando.value) return
  mostrarModalAjuste.value = false
  relacionAjuste.value = null
  almacenesProducto.value = []
}

const guardarAjuste = async () => {
  if (!relacionAjuste.value || !puedeGuardarAjuste.value) return

  const almacenSeleccionado = almacenesProducto.value.find(
    item => item.almacenId === formAjuste.value.almacenId
  )
  if (!almacenSeleccionado) {
    notify.warning('Almacén requerido', 'Seleccione un almacén válido para el ajuste')
    return
  }
  if (formAjuste.value.tipoMovimiento === 'SALIDA_AJUSTE' && formAjuste.value.cantidad > almacenSeleccionado.stock) {
    notify.warning('Stock insuficiente', `El almacén solo dispone de ${almacenSeleccionado.stock} unidades`)
    return
  }

  isAjustando.value = true
  try {
    await MovimientoStockService.crearAjuste({
      almacenId: formAjuste.value.almacenId,
      fincaProductoId: relacionAjuste.value.id,
      tipoMovimiento: formAjuste.value.tipoMovimiento,
      cantidad: formAjuste.value.cantidad,
      observaciones: formAjuste.value.observaciones
    })
    notify.success('Ajuste aplicado', 'Se actualizó el stock de la finca y del almacén seleccionado')
    isAjustando.value = false
    cerrarModalAjuste()
    cargarRelaciones()
  } catch (error: unknown) {
    console.error('Error al ajustar existencias:', error)
    notify.error('Error', getApiErrorMessage(error, 'No se pudo aplicar el ajuste de existencias'))
  } finally {
    isAjustando.value = false
  }
}

// Eliminar relación
const confirmarEliminar = async (relacion: FincaProducto) => {
  // Validar stock antes de intentar eliminar
  if (relacion.stock > 0) {
    notify.warning(
      'No se puede eliminar',
      `El producto tiene ${relacion.stock} unidades en stock. Debe llevar el stock a 0 antes de eliminar.`
    )
    return
  }

  const mensaje = `¿Está seguro de eliminar el producto "${relacion.productoName}" de la finca "${relacion.fincaName}"?`

  if (!confirm(mensaje)) return

  try {
    await FincaProductoService.removerProductoDeFinca({
      fincaId: relacion.fincaId,
      productoId: relacion.productoId
    })
    notify.success('Eliminado', 'El producto fue removido de la finca correctamente')
    cargarRelaciones()
  } catch (error: any) {
    console.error('Error al eliminar:', error)
    const errorData = error.response?.data
    let errorMsg = 'Error al eliminar el producto de la finca'
    if (errorData?.errorFields?.length > 0) {
      errorMsg = errorData.errorFields.map((e: any) => e.message).join('. ')
    } else if (errorData?.message) {
      errorMsg = errorData.message
    }
    notify.error('Error', errorMsg)
  }
}

// Utilidades
const getStockClass = (relacion: FincaProducto): string => {
  // Usar estadoStock del backend si está disponible
  if (relacion.estadoStock) {
    switch (relacion.estadoStock) {
      case 'CRITICO': return 'stock-cero'
      case 'BAJO': return 'stock-bajo'
      case 'NORMAL': return 'stock-alto'
      case 'EXCESO': return 'stock-exceso'
    }
  }
  // Fallback a lógica basada en stockMinimo
  if (relacion.stock === 0) return 'stock-cero'
  if (relacion.stockMinimo && relacion.stock < relacion.stockMinimo) return 'stock-bajo'
  if (relacion.stockMaximo && relacion.stock > relacion.stockMaximo) return 'stock-exceso'
  return 'stock-alto'
}

const getEstadoLabel = (relacion: FincaProducto): string => {
  if (relacion.estadoStock) {
    switch (relacion.estadoStock) {
      case 'CRITICO': return 'Crítico'
      case 'BAJO': return 'Bajo'
      case 'NORMAL': return 'Normal'
      case 'EXCESO': return 'Exceso'
    }
  }
  return ''
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

.stock-exceso {
  background-color: #e3f2fd;
  color: #1565c0;
}

.estado-label {
  display: block;
  font-size: 0.7em;
  font-weight: 500;
  margin-top: 2px;
  opacity: 0.9;
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

.btn-entrada {
  background-color: #27ae60;
  color: white;
}

.btn-entrada:hover {
  background-color: #219a52;
  transform: translateY(-2px);
}

.btn-salida {
  background-color: #e74c3c;
  color: white;
}

.btn-salida:hover {
  background-color: #c0392b;
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

.btn-ajuste {
  background-color: #8e44ad;
  color: white;
}

.btn-ajuste:hover {
  background-color: #71368a;
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

.modal-ajuste {
  max-width: 520px;
}

.ajuste-resumen {
  margin: 0 0 20px;
  padding: 12px;
  border-radius: 8px;
  background: #f3e8f8;
  color: #5b2c6f;
  line-height: 1.5;
}

.field-help {
  display: block;
  margin-top: 5px;
  font-size: 0.8em;
}

.error-text {
  color: #c0392b;
}

.modal-small {
  max-width: 400px;
}

.modal-entrada {
  max-width: 500px;
}

.modal-salida {
  max-width: 600px;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
}

/* Estilos para items de salida */
.items-section {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  margin: 15px 0;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.items-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1em;
}

.btn-agregar-item {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
  transition: all 0.3s ease;
}

.btn-agregar-item:hover {
  background-color: #2980b9;
}

.item-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-bottom: 10px;
  padding: 10px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.item-field {
  flex: 2;
}

.item-field-small {
  flex: 1;
  min-width: 80px;
}

.item-field-checkbox {
  display: flex;
  align-items: center;
  padding-top: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  color: #27ae60;
  white-space: nowrap;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #27ae60;
  cursor: pointer;
}

.item-field .form-group,
.item-field-small .form-group {
  margin-bottom: 0;
}

.btn-eliminar-item {
  background-color: #e74c3c;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.btn-eliminar-item:hover {
  background-color: #c0392b;
}

.total-items {
  text-align: right;
  padding: 10px;
  background: white;
  border-radius: 8px;
  font-weight: 500;
  color: #2c3e50;
}

.error-stock {
  color: #e74c3c;
  font-weight: 600;
  margin-left: 10px;
}

.preview-salida {
  background-color: #fff3e0;
  padding: 10px 15px;
  border-radius: 8px;
  margin: 15px 0;
  color: #e65100;
  font-size: 0.95em;
  text-align: center;
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

.tipo-documento-readonly {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.hint {
  display: block;
  font-size: 0.75em;
  color: #888;
  margin-top: 4px;
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

.stock-actual {
  color: #666;
  margin: 10px 0;
}

.stock-value {
  font-weight: 700;
  color: #3498db;
}

.aviso-insumo {
  background-color: #fff3e0;
  border: 1px solid #ffb74d;
  color: #e65100;
  padding: 10px 15px;
  border-radius: 8px;
  margin: 10px 0;
  font-size: 0.9em;
}

.preview-entrada {
  background-color: #e8f5e9;
  padding: 10px 15px;
  border-radius: 8px;
  margin: 15px 0;
  color: #2e7d32;
  font-size: 0.95em;
  text-align: center;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
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
