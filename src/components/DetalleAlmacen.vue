<!-- src/components/DetalleAlmacen.vue -->

<template>
  <div class="detalle-almacen">
    <div class="detalle-header">
      <div class="header-info">
        <h3>{{ almacen?.nombre || 'Cargando...' }}</h3>
        <span class="inventario-badge">{{ almacen?.inventario }}</span>
      </div>
      <div class="header-actions">
        <button @click="editarAlmacen" class="btn-editar">Editar</button>
        <button @click="cerrar" class="btn-cerrar">&times;</button>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <span>Cargando detalles...</span>
    </div>

    <div v-else class="detalle-content">
      <div class="section">
        <div class="section-header">
          <h4>Productos en Almacen</h4>
          <button @click="mostrarModalAgregar = true" class="btn-agregar">
            + Agregar Producto
          </button>
        </div>

        <div v-if="!almacen?.productos || almacen.productos.length === 0" class="empty-state">
          <div class="empty-icon">📦</div>
          <p>No hay productos en este almacen</p>
          <button @click="mostrarModalAgregar = true" class="btn-agregar-empty">
            Agregar primer producto
          </button>
        </div>

        <table v-else class="productos-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Finca</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="producto in almacen.productos" :key="producto.id">
              <td>
                <strong>{{ producto.productoName }}</strong>
                <span class="codigo">{{ producto.productoCode }}</span>
              </td>
              <td>{{ producto.fincaName }}</td>
              <td>
                <span :class="['stock-badge', getStockClass(producto.stock)]">
                  {{ producto.stock }}
                </span>
              </td>
              <td class="precio">${{ producto.productoPrice?.toFixed(2) || '0.00' }}</td>
              <td>
                <button @click="confirmarRemover(producto)" class="btn-remover">
                  Remover
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="resumen" v-if="almacen?.productos && almacen.productos.length > 0">
          <div class="resumen-item">
            <span class="label">Total Productos:</span>
            <span class="value">{{ almacen.productos.length }}</span>
          </div>
          <div class="resumen-item">
            <span class="label">Stock Total:</span>
            <span class="value">{{ totalStock }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Agregar Producto -->
    <div v-if="mostrarModalAgregar" class="modal-overlay" @click.self="mostrarModalAgregar = false">
      <div class="modal-agregar">
        <div class="modal-header">
          <h4>Agregar Producto al Almacen</h4>
          <button @click="mostrarModalAgregar = false" class="btn-cerrar-modal">&times;</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Buscar Producto (Finca-Producto)</label>
            <input
              v-model="busquedaProducto"
              type="text"
              placeholder="Buscar por nombre o codigo..."
              class="search-input"
              @input="buscarProductosDisponibles"
            />
          </div>

          <div v-if="buscandoProductos" class="loading-small">
            Buscando...
          </div>

          <div v-else-if="productosDisponibles.length > 0" class="productos-disponibles">
            <div
              v-for="fp in productosDisponibles"
              :key="fp.id"
              class="producto-item"
              :class="{ 'selected': productoSeleccionado?.id === fp.id }"
              @click="seleccionarProducto(fp)"
            >
              <div class="producto-info">
                <strong>{{ fp.productoName }}</strong>
                <span class="finca-name">{{ fp.fincaName }}</span>
              </div>
              <div class="producto-meta">
                <span class="stock">Stock: {{ fp.stock }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="busquedaProducto.length > 2" class="no-resultados">
            No se encontraron productos
          </div>
        </div>

        <div class="modal-footer">
          <button @click="mostrarModalAgregar = false" class="btn-cancelar">Cancelar</button>
          <button
            @click="agregarProducto"
            class="btn-confirmar"
            :disabled="!productoSeleccionado || agregandoProducto"
          >
            {{ agregandoProducto ? 'Agregando...' : 'Agregar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AlmacenService from '@/services/AlmacenService'
import FincaProductoService from '@/services/FincaProductoService'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Almacen } from '@/types/Almacen'
import type { FincaProducto } from '@/types/FincaProducto'

const props = defineProps<{
  almacenId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', almacen: Almacen): void
}>()

const almacen = ref<Almacen | null>(null)
const isLoading = ref(true)

// Modal agregar producto
const mostrarModalAgregar = ref(false)
const busquedaProducto = ref('')
const productosDisponibles = ref<FincaProducto[]>([])
const productoSeleccionado = ref<FincaProducto | null>(null)
const buscandoProductos = ref(false)
const agregandoProducto = ref(false)

const totalStock = computed(() => {
  if (!almacen.value?.productos) return 0
  return almacen.value.productos.reduce((sum, p) => sum + (p.stock || 0), 0)
})

const cargarAlmacen = async () => {
  isLoading.value = true
  try {
    const response = await AlmacenService.obtenerAlmacenPorId(props.almacenId)
    almacen.value = response.data
  } catch (error) {
    console.error('Error al cargar almacen:', error)
    notify.error('Error', 'No se pudo cargar el almacen')
  } finally {
    isLoading.value = false
  }
}

const getStockClass = (stock: number): string => {
  if (stock === 0) return 'stock-cero'
  if (stock <= 5) return 'stock-bajo'
  if (stock <= 15) return 'stock-medio'
  return 'stock-alto'
}

const editarAlmacen = () => {
  if (almacen.value) {
    emit('edit', almacen.value)
  }
}

const cerrar = () => {
  emit('close')
}

let debounceTimer: number | null = null

const buscarProductosDisponibles = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  if (busquedaProducto.value.length < 2) {
    productosDisponibles.value = []
    return
  }

  debounceTimer = window.setTimeout(async () => {
    buscandoProductos.value = true
    try {
      const response = await FincaProductoService.searchFincaProductos({
        query: busquedaProducto.value,
        size: 20,
        page: 0
      })

      const data = response.data as Record<string, unknown>
      let items: FincaProducto[] = []

      if (data.data && Array.isArray(data.data)) {
        items = data.data as FincaProducto[]
      } else if (data.content && Array.isArray(data.content)) {
        items = data.content as FincaProducto[]
      }

      // Filtrar los que ya estan en el almacen
      const idsEnAlmacen = new Set(almacen.value?.productos?.map(p => p.id) || [])
      productosDisponibles.value = items.filter(p => !idsEnAlmacen.has(p.id))
    } catch (error) {
      console.error('Error al buscar productos:', error)
    } finally {
      buscandoProductos.value = false
    }
  }, 300)
}

const seleccionarProducto = (producto: FincaProducto) => {
  productoSeleccionado.value = producto
}

const agregarProducto = async () => {
  if (!productoSeleccionado.value || !almacen.value?.id) return

  agregandoProducto.value = true
  try {
    await AlmacenService.agregarProducto({
      almacenId: almacen.value.id,
      fincaProductoId: productoSeleccionado.value.id
    })

    notify.success('Producto agregado', 'El producto fue agregado al almacen')
    mostrarModalAgregar.value = false
    productoSeleccionado.value = null
    busquedaProducto.value = ''
    productosDisponibles.value = []
    await cargarAlmacen()
  } catch (error) {
    console.error('Error al agregar producto:', error)
    notify.error('Error', 'No se pudo agregar el producto')
  } finally {
    agregandoProducto.value = false
  }
}

const confirmarRemover = async (producto: FincaProducto) => {
  const confirmed = await confirmDialog.delete(
    producto.productoName,
    'El producto sera removido del almacen pero no eliminado del sistema.'
  )

  if (confirmed && almacen.value?.id) {
    try {
      await AlmacenService.removerProducto(almacen.value.id, producto.id)
      notify.success('Producto removido', 'El producto fue removido del almacen')
      await cargarAlmacen()
    } catch (error) {
      console.error('Error al remover producto:', error)
      notify.error('Error', 'No se pudo remover el producto')
    }
  }
}

onMounted(() => {
  cargarAlmacen()
})
</script>

<style scoped>
.detalle-almacen {
  background: #fff;
  min-height: 400px;
}

.detalle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  color: white;
}

.header-info h3 {
  margin: 0 0 8px 0;
  font-size: 1.5em;
}

.inventario-badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-editar {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-editar:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-cerrar {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5em;
  line-height: 1;
  transition: all 0.3s ease;
}

.btn-cerrar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #888;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #9b59b6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.detalle-content {
  padding: 25px;
}

.section {
  margin-bottom: 25px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.btn-agregar {
  padding: 8px 16px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: all 0.3s ease;
}

.btn-agregar:hover {
  background: #219a52;
  transform: translateY(-2px);
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 12px;
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.empty-state p {
  color: #888;
  margin-bottom: 20px;
}

.btn-agregar-empty {
  padding: 10px 20px;
  background: #9b59b6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-agregar-empty:hover {
  background: #8e44ad;
}

.productos-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.productos-table th,
.productos-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.productos-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  font-size: 0.85em;
  text-transform: uppercase;
}

.productos-table tr:hover {
  background: #faf8fc;
}

.codigo {
  display: block;
  font-size: 0.8em;
  color: #888;
  margin-top: 2px;
}

.stock-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85em;
}

.stock-cero { background: #ffebee; color: #c62828; }
.stock-bajo { background: #fff3e0; color: #e65100; }
.stock-medio { background: #e3f2fd; color: #1565c0; }
.stock-alto { background: #e8f5e9; color: #2e7d32; }

.precio {
  font-weight: 600;
  color: #27ae60;
}

.btn-remover {
  padding: 5px 12px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-remover:hover {
  background: #c0392b;
}

.resumen {
  display: flex;
  gap: 30px;
  margin-top: 20px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.resumen-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.resumen-item .label {
  color: #666;
  font-size: 0.9em;
}

.resumen-item .value {
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.1em;
}

/* Modal Agregar */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.modal-agregar {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.btn-cerrar-modal:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.search-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #9b59b6;
}

.loading-small {
  text-align: center;
  padding: 20px;
  color: #888;
}

.productos-disponibles {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 8px;
}

.producto-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s ease;
}

.producto-item:last-child {
  border-bottom: none;
}

.producto-item:hover {
  background: #f8f9fa;
}

.producto-item.selected {
  background: #f3e5f5;
  border-left: 3px solid #9b59b6;
}

.producto-info strong {
  display: block;
  color: #2c3e50;
}

.finca-name {
  font-size: 0.85em;
  color: #888;
}

.producto-meta .stock {
  font-size: 0.85em;
  color: #27ae60;
  font-weight: 600;
}

.no-resultados {
  text-align: center;
  padding: 20px;
  color: #888;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn-cancelar {
  padding: 10px 20px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancelar:hover {
  background: #7f8c8d;
}

.btn-confirmar {
  padding: 10px 20px;
  background: #9b59b6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirmar:hover:not(:disabled) {
  background: #8e44ad;
}

.btn-confirmar:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .detalle-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .resumen {
    flex-direction: column;
    gap: 10px;
  }

  .productos-table {
    font-size: 0.85em;
  }

  .productos-table th,
  .productos-table td {
    padding: 8px 10px;
  }
}
</style>
