<!-- src/components/ProductoList.vue -->

<template>
  <div class="producto-list">
    <h2>Gestión de Productos</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por código, nombre o descripción..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />

      <select v-model="filtroEstado" @change="buscarConReset" class="filter-select">
        <option value="activos">Solo Activos</option>
        <option value="inactivos">Solo Inactivos</option>
        <option value="">Todos</option>
      </select>

      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nuevo Producto</button>
      <button @click="mostrarModalImportar = true" class="btn-importar">Importar Excel</button>
      <button v-if="productosSeleccionados.length > 0" @click="exportarProductos" class="btn-exportar">
        Exportar ({{ productosSeleccionados.length }})
      </button>
    </div>

    <div v-if="isLoading" class="loading">Cargando productos...</div>

    <table v-else class="producto-table">
      <thead>
        <tr>
          <th class="checkbox-col">
            <input
              type="checkbox"
              :checked="todosSeleccionados"
              @change="toggleSeleccionarTodos"
              class="checkbox-header"
            />
          </th>
          <th>Código</th>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Precio</th>
          <th>Precio Trabajador</th>
          <th>Precio Comedor</th>
          <th>Stock</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="productos.length === 0">
          <td colspan="10" class="no-data">No se encontraron productos</td>
        </tr>
        <tr v-for="producto in productos" :key="producto.id">
          <td class="checkbox-col">
            <input
              type="checkbox"
              :checked="estaProductoSeleccionado(producto.id)"
              @change="toggleSeleccionar(producto)"
              class="checkbox-row"
            />
          </td>
          <td :title="producto.code"><strong>{{ producto.code }}</strong></td>
          <td :title="producto.name">{{ producto.name }}</td>
          <td>
            <span :class="['tipo-badge', 'tipo-' + (producto.tipoProducto?.toLowerCase() || 'otros')]">
              {{ formatTipoProducto(producto.tipoProducto) }}
            </span>
          </td>
          <td class="price-cell">${{ producto.price?.toFixed(2) || '0.00' }}</td>
          <td class="price-cell price-trabajador">${{ producto.priceTrabajador?.toFixed(2) || '0.00' }}</td>
          <td class="price-cell price-comedor">${{ producto.priceComedor?.toFixed(2) || '0.00' }}</td>
          <td>
            <span :class="['stock-badge', getStockClass(producto.stock)]">
              {{ producto.stock }}
            </span>
          </td>
          <td>
            <span :class="['status-badge', producto.active ? 'active' : 'inactive']">
              {{ producto.active ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td class="acciones">
            <button @click="verProducto(producto)" class="btn-ver">👁️ Ver</button>
            <button @click="editarProducto(producto)" class="btn-editar">Editar</button>
            <button @click="confirmarEliminar(producto)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && productos.length > 0" class="pagination">
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

    <!-- Modal Crear/Editar -->
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearProducto @created="handleProductoCreado" @cancel="mostrarModalCrear = false" />
      </div>
    </div>

    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearProducto
          :producto="productoEditando"
          @updated="handleProductoActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>

    <!-- Modal Detalle -->
    <div v-if="mostrarModalDetalle" class="modal">
      <div class="modal-content modal-detalle">
        <DetalleProducto
          :producto-id="productoDetalleId!"
          @close="mostrarModalDetalle = false"
          @edit="editarDesdeDetalle"
        />
      </div>
    </div>

    <!-- Modal Importar -->
    <div v-if="mostrarModalImportar" class="modal">
      <div class="modal-content modal-importar">
        <span class="close" @click="cerrarModalImportar">&times;</span>
        <h3>Importar Productos</h3>

        <div class="import-container">
          <div class="file-drop-zone" :class="{ 'drag-over': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <div class="drop-icon">📦</div>
            <p>Arrastre un archivo o</p>
            <input type="file" ref="fileInput" @change="handleFileChange" accept=".xlsx,.xls" class="file-input-hidden" id="file-import" />
            <label for="file-import" class="btn-seleccionar">Seleccionar Archivo</label>
          </div>

          <div v-if="selectedFile" class="file-info">
            <span class="file-name">{{ selectedFile.name }}</span>
            <button @click="limpiarArchivo" class="btn-remove">&times;</button>
          </div>

          <button @click="importarArchivo" :disabled="!selectedFile || isImportando" class="btn-importar-archivo">
            {{ isImportando ? 'Importando...' : 'Importar' }}
          </button>

          <div v-if="mensajeImport" :class="['message', mensajeImportTipo]">
            {{ mensajeImport }}
          </div>

          <div v-if="erroresImport.length > 0" class="errores-lista">
            <p><strong>Errores:</strong></p>
            <ul>
              <li v-for="(error, idx) in erroresImport" :key="idx">{{ error }}</li>
            </ul>
          </div>
        </div>

        <div class="instrucciones">
          <p><strong>Formato:</strong> .xlsx, .xls</p>
          <p><strong>Columnas (en orden):</strong></p>
          <ul class="columnas-lista">
            <li>A: name (requerido)</li>
            <li>B: unidadMedida (requerido)</li>
            <li>C: code (requerido)</li>
            <li>D: priceTrabajador (requerido)</li>
            <li>E: priceComedor (requerido)</li>
            <li>F: price (requerido)</li>
            <li>G: description (opcional)</li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProductoService from '@/services/ProductoService'
import CrearProducto from './CrearProducto.vue'
import DetalleProducto from './DetalleProducto.vue'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Producto } from '@/types/Producto'
import type { SearchFilter } from '@/types/EstadoCuenta'

const productos = ref<Producto[]>([])
const searchQuery = ref('')
const filtroEstado = ref('activos')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)
const productosSeleccionados = ref<string[]>([])
const isExportando = ref(false)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalImportar = ref(false)
const mostrarModalDetalle = ref(false)
const productoEditando = ref<Producto | null>(null)
const productoDetalleId = ref<string | null>(null)

// Importar
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImportando = ref(false)
const isDragging = ref(false)
const mensajeImport = ref('')
const mensajeImportTipo = ref<'info' | 'success' | 'error'>('info')
const erroresImport = ref<string[]>([])

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const todosSeleccionados = computed(() => {
  return productos.value.length > 0 && productos.value.every(p => estaProductoSeleccionado(p.id))
})

const cargarProductos = async () => {
  isLoading.value = true
  productos.value = []
  try {
    const filters: SearchFilter[] = []

    // Convertir searchQuery en filtros con CONTAINS
    if (searchQuery.value.trim()) {
      filters.push({
        key: 'code',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'name',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
      filters.push({
        key: 'description',
        operator: 'CONTAINS',
        value: searchQuery.value.trim(),
        logicalOperation: 'OR'
      })
    }

    // Agregar filtro por estado si está seleccionado
    if (filtroEstado.value) {
      filters.push({
        key: 'active',
        operator: 'EQUALS',
        value: filtroEstado.value === 'activos' ? 'true' : 'false',
        logicalOperation: 'AND'
      })
    }

    const response = await ProductoService.buscarProductos({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: '',
      filter: filters,
    })

    const data = response.data as Record<string, unknown>
    
    if (data.data && Array.isArray(data.data)) {
      productos.value = (data.data as Producto[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (data.content && Array.isArray(data.content)) {
      productos.value = (data.content as Producto[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (Array.isArray(data)) {
      productos.value = data as Producto[]
      totalElementos.value = productos.value.length
    } else {
      productos.value = []
      totalElementos.value = 0
    }
  } catch (error) {
    console.error('Error al cargar productos:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarProductos()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarProductos()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarProductos()
}

const verProducto = (producto: Producto) => {
  if (producto.id) {
    productoDetalleId.value = producto.id
    mostrarModalDetalle.value = true
  }
}

const editarDesdeDetalle = (producto: Producto) => {
  productoEditando.value = { ...producto }
  mostrarModalEditar.value = true
}

const editarProducto = (producto: Producto) => {
  productoEditando.value = { ...producto }
  mostrarModalEditar.value = true
}

const confirmarEliminar = async (producto: Producto) => {
  const confirmed = await confirmDialog.delete(
    `${producto.name} (${producto.code})`
  )

  if (confirmed) {
    try {
      await ProductoService.eliminarProducto(producto.id!)
      notify.success('Producto eliminado', 'El producto fue eliminado correctamente')
      cargarProductos()
    } catch (error: unknown) {
      console.error('Error al eliminar:', error)
      const err = error as { response?: { data?: { message?: string, errorFields?: Array<{ field: string, message: string }> } } }

      let mensaje = 'Error al eliminar el producto'
      if (err.response?.data?.errorFields?.[0]?.message) {
        mensaje = err.response.data.errorFields[0].message
      } else if (err.response?.data?.message) {
        mensaje = err.response.data.message
      }

      if (mensaje.includes('related element') || mensaje.includes('cannot be deleted')) {
        mensaje = 'No se puede eliminar: el producto está asociado a una finca'
      } else if (mensaje.includes('not found')) {
        mensaje = 'El producto no fue encontrado'
      }

      notify.error('Error', mensaje)
    }
  }
}

const handleProductoCreado = () => {
  mostrarModalCrear.value = false
  paginaActual.value = 0
  cargarProductos()
}

const handleProductoActualizado = () => {
  mostrarModalEditar.value = false
  cargarProductos()
}

// Funciones de importación
const handleFileChange = (event: Event) => {
  mensajeImport.value = ''
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  validarArchivo(file)
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  validarArchivo(file)
}

const validarArchivo = (file: File | undefined) => {
  if (!file) return
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (['.xlsx', '.xls'].includes(ext)) {
    selectedFile.value = file
    erroresImport.value = []
    mensajeImport.value = ''
  } else {
    notify.warning('Formato inválido', 'Use archivos Excel (.xlsx o .xls)')
  }
}

const limpiarArchivo = () => {
  selectedFile.value = null
  if (fileInput.value) fileInput.value.value = ''
}

const cerrarModalImportar = () => {
  mostrarModalImportar.value = false
  limpiarArchivo()
  mensajeImport.value = ''
  erroresImport.value = []
}

const importarArchivo = async () => {
  if (!selectedFile.value) return
  isImportando.value = true
  mensajeImport.value = 'Importando...'
  mensajeImportTipo.value = 'info'
  erroresImport.value = []

  try {
    const response = await ProductoService.importarExcel(selectedFile.value)
    const { totalImportados, totalErrores, errores } = response.data

    if (totalErrores > 0) {
      mensajeImport.value = `Importación parcial: ${totalImportados} productos importados, ${totalErrores} errores`
      mensajeImportTipo.value = totalImportados > 0 ? 'info' : 'error'
      erroresImport.value = errores || []
    } else {
      mensajeImport.value = `Importación exitosa: ${totalImportados} productos importados`
      mensajeImportTipo.value = 'success'
      limpiarArchivo()
    }

    if (totalImportados > 0) {
      cargarProductos()
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { errores?: string[], message?: string } } }
    mensajeImport.value = err.response?.data?.message || 'Error al importar el archivo'
    mensajeImportTipo.value = 'error'
    erroresImport.value = err.response?.data?.errores || []
  } finally {
    isImportando.value = false
  }
}

// Funciones de selección
const estaProductoSeleccionado = (id: string | undefined): boolean => {
  return id ? productosSeleccionados.value.includes(id) : false
}

const toggleSeleccionar = (producto: Producto) => {
  if (!producto.id) return
  const index = productosSeleccionados.value.indexOf(producto.id)
  if (index > -1) {
    productosSeleccionados.value.splice(index, 1)
  } else {
    productosSeleccionados.value.push(producto.id)
  }
}

const toggleSeleccionarTodos = () => {
  if (todosSeleccionados.value) {
    productosSeleccionados.value = []
  } else {
    productosSeleccionados.value = productos.value
      .map(p => p.id)
      .filter((id): id is string => !!id)
  }
}

const exportarProductos = async () => {
  if (productosSeleccionados.value.length === 0) {
    notify.warning('Selección vacía', 'Selecciona al menos un producto')
    return
  }

  isExportando.value = true
  try {
    const response = await ProductoService.exportarProductos(productosSeleccionados.value)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `productos_${new Date().getTime()}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)

    productosSeleccionados.value = []
  } catch (error) {
    console.error('Error al exportar:', error)
    notify.error('Error', 'No se pudo exportar los productos')
  } finally {
    isExportando.value = false
  }
}

const getStockClass = (stock: number): string => {
  if (stock === 0) return 'stock-cero'
  if (stock <= 5) return 'stock-bajo'
  if (stock <= 15) return 'stock-medio'
  return 'stock-alto'
}

const formatTipoProducto = (tipo: string | undefined): string => {
  const tipos: Record<string, string> = {
    'INSUMO': 'Insumo',
    'VENTA': 'Venta',
    'OTROS': 'Otros'
  }
  return tipo ? tipos[tipo] || tipo : 'Otros'
}

onMounted(() => {
  cargarProductos()
})
</script>

<style scoped>
.producto-list { 
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
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  cursor: pointer;
  font-size: 0.95em;
  min-width: 150px;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.btn-buscar { background-color: #3498db; color: white; }
.btn-crear { background-color: #27ae60; color: white; }
.btn-importar { background-color: #9b59b6; color: white; }

.btn-buscar, .btn-crear, .btn-importar, .btn-exportar {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.95em;
}

.btn-buscar:hover { 
  background-color: #2980b9; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}
.btn-crear:hover { 
  background-color: #219a52; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}
.btn-importar:hover { 
  background-color: #8e44ad; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.btn-exportar { 
  background-color: #e67e22; 
  color: white; 
}
.btn-exportar:hover { 
  background-color: #d35400; 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.3);
}

.loading, .no-data { text-align: center; padding: 40px; color: #888; }

.producto-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 0.9em;
}

.producto-table th, .producto-table td {
  border: 1px solid #eee;
  padding: 8px 10px;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.producto-table th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.producto-table td:nth-child(2) { max-width: 80px; } /* Código */
.producto-table td:nth-child(3) { max-width: 120px; } /* Nombre */
.producto-table td:nth-child(4) { max-width: 70px; } /* Tipo */
.producto-table td:nth-child(5),
.producto-table td:nth-child(6),
.producto-table td:nth-child(7) { max-width: 80px; text-align: right; } /* Precios */
.producto-table td:nth-child(8) { max-width: 60px; text-align: center; } /* Stock */
.producto-table td:nth-child(9) { max-width: 70px; text-align: center; } /* Estado */
.producto-table td:nth-child(10) { max-width: none; white-space: nowrap; } /* Acciones */

.producto-table tr:nth-child(even) { background-color: #fafafa; }
.producto-table tr:hover { background-color: #f0f7ff; }

.checkbox-col {
  width: 40px;
  text-align: center;
  padding: 8px;
}

.checkbox-header, .checkbox-row {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
}

.price-cell {
  font-weight: 600;
  color: #27ae60;
  font-size: 0.85em;
}

.price-trabajador {
  color: #2980b9;
}

.price-comedor {
  color: #8e44ad;
}

.stock-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.8em;
}

.stock-cero { background-color: #ffebee; color: #c62828; }
.stock-bajo { background-color: #fff3e0; color: #e65100; }
.stock-medio { background-color: #e3f2fd; color: #1565c0; }
.stock-alto { background-color: #e8f5e9; color: #2e7d32; }

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75em;
}

.status-badge.active { background-color: #e8f5e9; color: #2e7d32; }
.status-badge.inactive { background-color: #f5f5f5; color: #888; }

.tipo-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.75em;
}

.tipo-insumo { background-color: #e3f2fd; color: #1565c0; }
.tipo-venta { background-color: #e8f5e9; color: #2e7d32; }
.tipo-otros { background-color: #f5f5f5; color: #666; }

.acciones {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.acciones button {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.75em;
  transition: all 0.3s ease;
}

.btn-ver {
  background-color: #1abc9c;
  color: white;
}

.btn-ver:hover {
  background-color: #16a085;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 188, 156, 0.3);
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-editar:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

.btn-eliminar:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

/* Paginación */
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
  max-width: 550px;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-detalle {
  max-width: 750px;
  padding: 0;
  border-radius: 16px;
  overflow: hidden;
}

.modal-detalle .modal-content {
  padding: 0;
  max-width: 750px;
  border-radius: 16px;
}

.modal-importar { max-width: 450px; }
.modal-small { max-width: 400px; text-align: center; }
.modal-small h3 { margin-top: 0; color: #e74c3c; }
.warning-text { color: #666; font-size: 0.9em; margin-top: 5px; }

.error-eliminar {
  background-color: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin: 15px 0;
  font-size: 0.9em;
  border: 1px solid #ffcdd2;
}

.modal-buttons { 
  display: flex; 
  gap: 10px; 
  justify-content: center; 
  margin-top: 20px; 
}

.btn-cancelar { 
  background-color: #95a5a6; 
  color: white; 
  padding: 10px 20px; 
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

/* Importar */
.import-container { margin: 20px 0; }

.file-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.file-drop-zone:hover, .file-drop-zone.drag-over {
  border-color: #9b59b6;
  background-color: #f3e5f5;
}

.drop-icon { font-size: 2.5em; margin-bottom: 10px; }
.file-input-hidden { display: none; }

.btn-seleccionar {
  display: inline-block;
  background-color: #9b59b6;
  color: white;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-seleccionar:hover { 
  background-color: #8e44ad;
  transform: translateY(-2px);
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #e8f5e9;
  border-radius: 8px;
  margin-top: 10px;
}

.file-name { font-weight: 500; color: #2e7d32; }
.btn-remove { 
  background: none; 
  border: none; 
  font-size: 1.3em; 
  color: #999; 
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-remove:hover { color: #e74c3c; }

.btn-importar-archivo {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-importar-archivo:hover:not(:disabled) { 
  background-color: #219a52;
  transform: translateY(-2px);
}

.btn-importar-archivo:disabled { 
  background-color: #bdc3c7; 
  cursor: not-allowed;
}

.message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.info { background-color: #e3f2fd; color: #1976d2; }
.success { background-color: #e8f5e9; color: #388e3c; }
.error { background-color: #ffebee; color: #d32f2f; }

.instrucciones {
  margin-top: 15px;
  padding: 12px 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  font-size: 0.85em;
  color: #666;
}

.instrucciones p { margin: 5px 0; }

.columnas-lista {
  margin: 8px 0 0 20px;
  padding: 0;
  font-size: 0.9em;
}

.columnas-lista li {
  margin: 3px 0;
}

.errores-lista {
  margin-top: 15px;
  padding: 12px;
  background-color: #ffebee;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.errores-lista p {
  margin: 0 0 8px 0;
  color: #c62828;
}

.errores-lista ul {
  margin: 0;
  padding-left: 20px;
}

.errores-lista li {
  color: #d32f2f;
  font-size: 0.85em;
  margin: 4px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .producto-list {
    padding: 10px;
  }
  
  .search-bar {
    flex-direction: column;
  }
  
  .search-input {
    min-width: 100%;
  }

  .filter-select {
    min-width: 100%;
  }
  
  .producto-table {
    font-size: 0.85em;
  }
  
  .producto-table th, 
  .producto-table td {
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
  
  .modal-detalle {
    max-width: 95%;
    margin: 10px;
  }
}

@media (max-width: 480px) {
  .producto-table {
    font-size: 0.75em;
  }
  
  .producto-table th, 
  .producto-table td {
    padding: 6px 8px;
  }
  
  .checkbox-col {
    width: 30px;
    padding: 4px;
  }
  
  .btn-ver, .btn-editar, .btn-eliminar {
    font-size: 0.7em;
    padding: 3px 6px;
  }
  
  h2 {
    font-size: 1.5em;
  }
}
</style>