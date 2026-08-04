<!-- src/components/DetalleProducto.vue -->

<template>
  <div class="detalle-producto">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-left">
        <span class="detail-icon">📦</span>
        <div>
          <h3>Detalle del Producto</h3>
          <p class="subtitle">Información completa del producto</p>
        </div>
      </div>
      <button class="btn-cerrar" @click="cerrar">
        <span class="close-icon">✕</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información del producto...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="producto" class="detail-content">
      <!-- Información General -->
      <div class="info-section">
        <h4 class="section-title">📋 Información General</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Código</span>
            <span class="info-value code-value">{{ producto.code }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Nombre</span>
            <span class="info-value">{{ producto.name }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">Descripción</span>
            <span class="info-value">{{ producto.description || 'Sin descripción' }}</span>
          </div>
        </div>
      </div>

      <!-- Información de Inventario -->
      <div class="info-section highlight-section">
        <h4 class="section-title">📊 Información de Inventario</h4>
        <div class="info-grid inventory-grid">
          <div class="info-item inventory-item">
            <span class="info-label">Precio Unitario</span>
            <span class="info-value price-value">${{ producto.price.toFixed(2) }}</span>
          </div>
          <div class="info-item inventory-item">
            <span class="info-label">Stock Actual</span>
            <span class="info-value" :class="getStockClass(producto.stock)">
              {{ producto.stock }} unidades
              <span class="stock-badge" :class="getStockClass(producto.stock)">
                {{ getStockLabel(producto.stock) }}
              </span>
            </span>
          </div>
          <div class="info-item inventory-item total-value-item">
            <span class="info-label">Valor Total del Inventario</span>
            <span class="info-value total-value">
              ${{ calcularValorTotal().toFixed(2) }}
            </span>
            <span class="total-detail">
              {{ producto.stock }} × ${{ producto.price.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Estado y Metadatos -->
      <div class="info-section">
        <h4 class="section-title">⚙️ Estado y Metadatos</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Estado</span>
            <span class="info-value">
              <span :class="['status-badge', producto.active ? 'active' : 'inactive']">
                {{ producto.active ? 'Activo' : 'Inactivo' }}
              </span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">ID</span>
            <span class="info-value id-value">{{ producto.id }}</span>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="detail-actions">
        <button class="btn-editar" @click="editar">
          ✏️ Editar Producto
        </button>
        <button class="btn-cerrar-detalle" @click="cerrar">
          Cerrar
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="error-container">
      <span class="error-icon">⚠️</span>
      <p>No se pudo cargar la información del producto</p>
      <button class="btn-reintentar" @click="cargarProducto">Reintentar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ProductoService from '@/services/ProductoService'
import type { Producto } from '@/types/Producto'

const props = defineProps<{
  productoId: string
}>()

const emit = defineEmits<{
  close: []
  edit: [producto: Producto]
}>()

const producto = ref<Producto | null>(null)
const isLoading = ref(false)

const cargarProducto = async () => {
  if (!props.productoId) return
  
  isLoading.value = true
  try {
    const response = await ProductoService.obtenerProductoPorId(props.productoId)
    producto.value = response.data
  } catch (error) {
    console.error('Error al cargar el producto:', error)
    producto.value = null
  } finally {
    isLoading.value = false
  }
}

const calcularValorTotal = (): number => {
  if (!producto.value) return 0
  return producto.value.price * producto.value.stock
}

const getStockClass = (stock: number): string => {
  if (stock === 0) return 'stock-cero'
  if (stock <= 5) return 'stock-bajo'
  if (stock <= 15) return 'stock-medio'
  return 'stock-alto'
}

const getStockLabel = (stock: number): string => {
  if (stock === 0) return 'Sin stock'
  if (stock <= 5) return 'Stock crítico'
  if (stock <= 15) return 'Stock bajo'
  return 'Stock suficiente'
}

const editar = () => {
  if (producto.value) {
    emit('edit', producto.value)
    emit('close')
  }
}

const cerrar = () => {
  emit('close')
}

onMounted(() => {
  cargarProducto()
})

// Recargar si cambia el ID
watch(() => props.productoId, () => {
  cargarProducto()
})
</script>

<style scoped>
.detalle-producto {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  max-height: 90vh;
  overflow-y: auto;
}

/* Header */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px 30px 20px;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
  border-radius: 16px 16px 0 0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.detail-icon {
  font-size: 2.5em;
  background: #e3f2fd;
  padding: 12px;
  border-radius: 12px;
  display: inline-block;
}

.detail-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4em;
  font-weight: 600;
}

.detail-header .subtitle {
  margin: 4px 0 0;
  color: #888;
  font-size: 0.9em;
}

.btn-cerrar {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cerrar:hover {
  background: #f0f0f0;
  transform: rotate(90deg);
}

.close-icon {
  font-size: 1.5em;
  color: #888;
  line-height: 1;
}

/* Loading */
.loading-container {
  padding: 60px 30px;
  text-align: center;
  color: #888;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Content */
.detail-content {
  padding: 25px 30px 30px;
}

.info-section {
  margin-bottom: 30px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.highlight-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e3f2fd 50%);
  padding: 20px 25px;
  border-radius: 12px;
  border-left: 4px solid #3498db;
}

.section-title {
  color: #2c3e50;
  font-size: 1.1em;
  margin: 0 0 15px 0;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.85em;
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1.05em;
  color: #2c3e50;
  font-weight: 500;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  word-break: break-word;
}

.code-value {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #1976d2;
  background: #e3f2fd;
}

.id-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: #888;
  background: #f5f5f5;
}

.price-value {
  color: #27ae60;
  font-weight: 700;
  font-size: 1.2em;
  background: #e8f5e9;
}

.total-value {
  color: #e67e22;
  font-weight: 700;
  font-size: 1.4em;
  background: #fff3e0;
}

.total-detail {
  font-size: 0.85em;
  color: #888;
  margin-top: 2px;
  font-weight: 400;
}

.inventory-item {
  background: rgba(255, 255, 255, 0.7);
  padding: 12px 15px;
  border-radius: 10px;
}

.total-value-item {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #e67e22;
  padding: 15px;
}

.inventory-grid {
  grid-template-columns: 1fr 1fr 1fr;
}

/* Stock Badge */
.stock-badge {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
  margin-left: 8px;
}

.stock-cero {
  color: #e74c3c;
  font-weight: 700;
}

.stock-cero .stock-badge {
  background: #ffebee;
  color: #c62828;
}

.stock-bajo {
  color: #f39c12;
  font-weight: 700;
}

.stock-bajo .stock-badge {
  background: #fff3e0;
  color: #e65100;
}

.stock-medio {
  color: #3498db;
  font-weight: 600;
}

.stock-medio .stock-badge {
  background: #e3f2fd;
  color: #1565c0;
}

.stock-alto {
  color: #27ae60;
  font-weight: 600;
}

.stock-alto .stock-badge {
  background: #e8f5e9;
  color: #2e7d32;
}

/* Status Badge */
.status-badge {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9em;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background: #f5f5f5;
  color: #888;
}

/* Actions */
.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.btn-editar {
  flex: 1;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1em;
  transition: all 0.3s ease;
}

.btn-editar:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.btn-cerrar-detalle {
  padding: 12px 24px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cerrar-detalle:hover {
  background: #e0e0e0;
}

/* Error */
.error-container {
  padding: 60px 30px;
  text-align: center;
}

.error-icon {
  font-size: 3em;
  display: block;
  margin-bottom: 15px;
}

.error-container p {
  color: #666;
  margin-bottom: 20px;
}

.btn-reintentar {
  padding: 10px 30px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-reintentar:hover {
  background: #2980b9;
}

/* Responsive */
@media (max-width: 768px) {
  .detail-header {
    padding: 20px;
  }

  .detail-content {
    padding: 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .inventory-grid {
    grid-template-columns: 1fr;
  }

  .detail-actions {
    flex-direction: column;
  }

  .btn-editar,
  .btn-cerrar-detalle {
    width: 100%;
  }

  .header-left {
    gap: 10px;
  }

  .detail-icon {
    font-size: 2em;
    padding: 10px;
  }

  .detail-header h3 {
    font-size: 1.2em;
  }
}

/* Scrollbar personalizado */
.detalle-producto::-webkit-scrollbar {
  width: 8px;
}

.detalle-producto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.detalle-producto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

.detalle-producto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>