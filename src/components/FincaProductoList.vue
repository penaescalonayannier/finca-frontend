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
            <button @click="abrirModalEntrada(relacion)" class="btn-entrada">📥 Entrada</button>
            <button @click="abrirModalSalida(relacion)" class="btn-salida">📤 Salida</button>
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

    <!-- Modal Entrada de Producción -->
    <div v-if="mostrarModalEntrada" class="modal">
      <div class="modal-content modal-entrada">
        <span class="close" @click="cerrarModalEntrada">&times;</span>
        <h3>Entrada de Producción</h3>
        <p>
          <strong>{{ relacionEntrada?.productoName }}</strong>
          en <strong>{{ relacionEntrada?.fincaName }}</strong>
        </p>
        <p class="stock-actual">Stock actual: <span class="stock-value">{{ relacionEntrada?.stock }}</span></p>

        <div class="form-group">
          <label>Cantidad Terminada *</label>
          <input
            v-model.number="formEntrada.cantidadTerminada"
            type="number"
            required
            min="1"
            class="form-input"
            placeholder="Cantidad"
          />
        </div>

        <div class="form-group">
          <label>Trabajador que Entrega *</label>
          <select v-model="formEntrada.trabajadorEntregaId" required class="form-select">
            <option value="">Seleccione un trabajador</option>
            <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
              {{ trabajador.nombre }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Trabajador que Recibe *</label>
          <select v-model="formEntrada.trabajadorRecibeId" required class="form-select">
            <option value="">Seleccione un trabajador</option>
            <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
              {{ trabajador.nombre }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Observaciones</label>
          <textarea
            v-model="formEntrada.observaciones"
            class="form-input form-textarea"
            placeholder="Observaciones opcionales..."
            rows="2"
          ></textarea>
        </div>

        <div class="preview-entrada" v-if="formEntrada.cantidadTerminada > 0">
          Nuevo stock: <strong>{{ (relacionEntrada?.stock || 0) + formEntrada.cantidadTerminada }}</strong>
        </div>

        <div class="form-actions">
          <button @click="entradaProduccionHandler" class="btn-guardar" :disabled="isGuardando || formEntrada.cantidadTerminada <= 0">
            {{ isGuardando ? 'Registrando...' : 'Registrar Entrada' }}
          </button>
          <button type="button" class="btn-cancelar" @click="cerrarModalEntrada">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal Salida -->
    <div v-if="mostrarModalSalida" class="modal">
      <div class="modal-content modal-salida">
        <span class="close" @click="cerrarModalSalida">&times;</span>
        <h3>Registrar Salida</h3>
        <p>
          <strong>{{ relacionSalida?.productoName }}</strong>
          en <strong>{{ relacionSalida?.fincaName }}</strong>
        </p>
        <p class="stock-actual">Stock actual: <span class="stock-value">{{ relacionSalida?.stock }}</span></p>

        <div v-if="esInsumo" class="aviso-insumo">
          Este producto es de tipo <strong>INSUMO</strong>. Solo puede destinarse a Comedor u Otros.
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Tipo de Salida *</label>
            <select v-model="formSalida.tipo" required class="form-select">
              <option value="">Seleccione tipo</option>
              <option value="VALE">Vale</option>
              <option value="FACTURA">Factura</option>
            </select>
          </div>

          <div class="form-group">
            <label>Destino *</label>
            <select v-model="formSalida.destino" required class="form-select">
              <option value="">Seleccione destino</option>
              <option value="TRABAJADORES" :disabled="esInsumo">Trabajadores {{ esInsumo ? '(No disponible para Insumos)' : '' }}</option>
              <option value="COMEDOR">Comedor</option>
              <option value="VENTA_ESTADO" :disabled="esInsumo">Venta Estado {{ esInsumo ? '(No disponible para Insumos)' : '' }}</option>
              <option value="POBLACION" :disabled="esInsumo">Población {{ esInsumo ? '(No disponible para Insumos)' : '' }}</option>
              <option value="INSUMO">Insumo</option>
              <option value="OTROS">Otros</option>
            </select>
          </div>
        </div>

        <!-- Items de salida -->
        <div class="items-section">
          <div class="items-header">
            <h4>Items de Salida</h4>
            <button type="button" @click="agregarItemSalida" class="btn-agregar-item">+ Agregar</button>
          </div>

          <div v-for="(item, index) in formSalida.items" :key="index" class="item-row">
            <div class="form-group item-field">
              <label>Trabajador *</label>
              <select v-model="item.trabajadorId" required class="form-select">
                <option value="">Seleccione</option>
                <option v-for="t in trabajadores" :key="t.id" :value="t.id">
                  {{ t.nombre }}
                </option>
              </select>
            </div>

            <div class="form-group item-field-small">
              <label>Cantidad *</label>
              <input v-model.number="item.cantidad" type="number" min="1" required class="form-input" />
            </div>

            <div v-if="formSalida.destino === 'TRABAJADORES'" class="form-group item-field-checkbox">
              <label class="checkbox-label">
                <input type="checkbox" v-model="item.pagado" />
                <span class="checkmark"></span>
                Pagado
              </label>
            </div>

            <button type="button" @click="eliminarItemSalida(index)" class="btn-eliminar-item" v-if="formSalida.items.length > 1">
              X
            </button>
          </div>

          <div class="total-items">
            Total a salir: <strong>{{ calcularTotalSalida() }}</strong>
            <span v-if="relacionSalida && calcularTotalSalida() > relacionSalida.stock" class="error-stock">
              (Excede el stock disponible)
            </span>
          </div>
        </div>

        <div class="form-group">
          <label>Observaciones</label>
          <textarea
            v-model="formSalida.observaciones"
            class="form-input form-textarea"
            placeholder="Observaciones opcionales..."
            rows="2"
          ></textarea>
        </div>

        <div class="preview-salida" v-if="calcularTotalSalida() > 0 && relacionSalida && calcularTotalSalida() <= relacionSalida.stock">
          Nuevo stock: <strong>{{ relacionSalida.stock - calcularTotalSalida() }}</strong>
        </div>

        <div class="form-actions">
          <button @click="salidaHandler" class="btn-guardar" :disabled="isGuardando || !validarFormSalida()">
            {{ isGuardando ? 'Registrando...' : 'Registrar Salida' }}
          </button>
          <button type="button" class="btn-cancelar" @click="cerrarModalSalida">Cancelar</button>
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
import TrabajadorService from '@/services/TrabajadorService'
import ProduccionTerminadaService from '@/services/ProduccionTerminadaService'
import SalidaService from '@/services/SalidaService'
import type { FincaProducto } from '@/types/FincaProducto'
import type { TipoSalida, DestinoSalida, ItemSalida } from '@/types/Salida'
import type { Finca } from '@/types/Finca'
import type { Producto } from '@/types/Producto'
import type { Trabajador } from '@/types/Trabajador'
import type { SearchFilter } from '@/types/EstadoCuenta'

// Estado
const relaciones = ref<FincaProducto[]>([])
const fincas = ref<Finca[]>([])
const productos = ref<Producto[]>([])
const trabajadores = ref<Trabajador[]>([])
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
const mostrarModalEntrada = ref(false)
const mostrarModalSalida = ref(false)

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
const relacionEntrada = ref<FincaProducto | null>(null)

const formEntrada = ref({
  cantidadTerminada: 0,
  trabajadorEntregaId: '',
  trabajadorRecibeId: '',
  observaciones: ''
})

const relacionSalida = ref<FincaProducto | null>(null)
const formSalida = ref({
  tipo: '' as TipoSalida | '',
  destino: '' as DestinoSalida | '',
  observaciones: '',
  items: [{ trabajadorId: '', cantidad: 0, pagado: false }] as ItemSalida[]
})

// Computed
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const todosSeleccionados = computed(() => {
  return relaciones.value.length > 0 && relaciones.value.every(r => estaSeleccionado(r.id))
})

const esInsumo = computed(() => {
  return relacionSalida.value?.productoTipo === 'INSUMO'
})

// Watcher para limpiar destino inválido cuando el producto es INSUMO
watch([esInsumo, () => formSalida.value.destino], ([isInsumo, destino]) => {
  if (isInsumo && ['TRABAJADORES', 'VENTA_ESTADO', 'POBLACION'].includes(destino as string)) {
    formSalida.value.destino = ''
  }
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

const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.getAll()
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
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

// Entrada de producción
const abrirModalEntrada = (relacion: FincaProducto) => {
  relacionEntrada.value = relacion
  formEntrada.value = {
    cantidadTerminada: 0,
    trabajadorEntregaId: '',
    trabajadorRecibeId: '',
    observaciones: ''
  }
  mostrarModalEntrada.value = true
}

const cerrarModalEntrada = () => {
  mostrarModalEntrada.value = false
  relacionEntrada.value = null
  formEntrada.value = {
    cantidadTerminada: 0,
    trabajadorEntregaId: '',
    trabajadorRecibeId: '',
    observaciones: ''
  }
}

const entradaProduccionHandler = async () => {
  if (!relacionEntrada.value) return
  if (formEntrada.value.cantidadTerminada <= 0) {
    alert('La cantidad debe ser mayor a 0')
    return
  }
  if (!formEntrada.value.trabajadorEntregaId) {
    alert('Debe seleccionar el trabajador que entrega')
    return
  }
  if (!formEntrada.value.trabajadorRecibeId) {
    alert('Debe seleccionar el trabajador que recibe')
    return
  }

  isGuardando.value = true
  try {
    // Crear registro de producción terminada
    await ProduccionTerminadaService.create({
      fincaId: relacionEntrada.value.fincaId,
      productoId: relacionEntrada.value.productoId,
      cantidadTerminada: formEntrada.value.cantidadTerminada,
      trabajadorEntregaId: formEntrada.value.trabajadorEntregaId,
      trabajadorRecibeId: formEntrada.value.trabajadorRecibeId,
      observaciones: formEntrada.value.observaciones || undefined
    })
    cerrarModalEntrada()
    cargarRelaciones()
  } catch (error: any) {
    console.error('Error en entrada de producción:', error)
    alert(error.response?.data?.message || 'Error al registrar entrada de producción')
  } finally {
    isGuardando.value = false
  }
}

// Salida
const abrirModalSalida = (relacion: FincaProducto) => {
  relacionSalida.value = relacion
  formSalida.value = {
    tipo: '',
    destino: '',
    observaciones: '',
    items: [{ trabajadorId: '', cantidad: 0, pagado: false }]
  }
  mostrarModalSalida.value = true
}

const cerrarModalSalida = () => {
  mostrarModalSalida.value = false
  relacionSalida.value = null
  formSalida.value = {
    tipo: '',
    destino: '',
    observaciones: '',
    items: [{ trabajadorId: '', cantidad: 0, pagado: false }]
  }
}

const agregarItemSalida = () => {
  formSalida.value.items.push({ trabajadorId: '', cantidad: 0, pagado: false })
}

const eliminarItemSalida = (index: number) => {
  formSalida.value.items.splice(index, 1)
}

const calcularTotalSalida = (): number => {
  return formSalida.value.items.reduce((sum, item) => sum + (item.cantidad || 0), 0)
}

const validarFormSalida = (): boolean => {
  if (!formSalida.value.tipo || !formSalida.value.destino || !relacionSalida.value) return false
  if (formSalida.value.items.length === 0) return false
  if (formSalida.value.items.some(i => !i.trabajadorId || i.cantidad <= 0)) return false
  if (calcularTotalSalida() > relacionSalida.value.stock) return false
  return true
}

const salidaHandler = async () => {
  if (!relacionSalida.value || !validarFormSalida()) {
    alert('Por favor complete todos los campos y verifique el stock')
    return
  }

  isGuardando.value = true
  try {
    await SalidaService.create({
      tipo: formSalida.value.tipo as TipoSalida,
      destino: formSalida.value.destino as DestinoSalida,
      fincaProductoId: relacionSalida.value.id,
      observaciones: formSalida.value.observaciones,
      items: formSalida.value.items
    })
    cerrarModalSalida()
    cargarRelaciones()
  } catch (error: any) {
    console.error('Error al registrar salida:', error)
    alert(error.response?.data?.message || 'Error al registrar salida')
  } finally {
    isGuardando.value = false
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
  cargarTrabajadores()
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