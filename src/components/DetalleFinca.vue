<!-- src/components/DetalleFinca.vue -->

<template>
  <div class="detalle-finca">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-left">
        <span class="detail-icon">🌾</span>
        <div>
          <h3>Detalle de la Finca</h3>
          <p class="subtitle">Información completa de la finca</p>
        </div>
      </div>
      <button class="btn-cerrar" @click="cerrar">
        <span class="close-icon">✕</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando información de la finca...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="finca" class="detail-content">
      <!-- Información General -->
      <div class="info-section">
        <h4 class="section-title">📋 Información General</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Código</span>
            <span class="info-value code-value">{{ finca.code }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Nombre</span>
            <span class="info-value">{{ finca.name }}</span>
          </div>
          <div class="info-item full-width">
            <span class="info-label">Descripción</span>
            <span class="info-value">{{ finca.description || 'Sin descripción' }}</span>
          </div>
        </div>
      </div>

      <!-- Metadatos -->
      <div class="info-section">
        <h4 class="section-title">⚙️ Metadatos</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">ID</span>
            <span class="info-value id-value">{{ finca.id }}</span>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="detail-actions">
        <button class="btn-editar" @click="editar">
          ✏️ Editar Finca
        </button>
        <button class="btn-cerrar-detalle" @click="cerrar">
          Cerrar
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="error-container">
      <span class="error-icon">⚠️</span>
      <p>No se pudo cargar la información de la finca</p>
      <button class="btn-reintentar" @click="cargarFinca">Reintentar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import FincaService from '@/services/FincaService'
import type { Finca } from '@/types/Finca'

const props = defineProps<{
  fincaId: string
}>()

const emit = defineEmits<{
  close: []
  edit: [finca: Finca]
}>()

const finca = ref<Finca | null>(null)
const isLoading = ref(false)

const cargarFinca = async () => {
  if (!props.fincaId) return
  
  isLoading.value = true
  try {
    const response = await FincaService.obtenerFincaPorId(props.fincaId)
    finca.value = response.data
  } catch (error) {
    console.error('Error al cargar la finca:', error)
    finca.value = null
  } finally {
    isLoading.value = false
  }
}

const editar = () => {
  if (finca.value) {
    emit('edit', finca.value)
    emit('close')
  }
}

const cerrar = () => {
  emit('close')
}

onMounted(() => {
  cargarFinca()
})

watch(() => props.fincaId, () => {
  cargarFinca()
})
</script>

<style scoped>
.detalle-finca {
  background: #fff;
  border-radius: 16px;
  padding: 0;
  max-height: 90vh;
  overflow-y: auto;
}

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
  background: #e8f5e9;
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

.loading-container {
  padding: 60px 30px;
  text-align: center;
  color: #888;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #27ae60;
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

.detail-content {
  padding: 25px 30px 30px;
}

.info-section {
  margin-bottom: 30px;
}

.info-section:last-child {
  margin-bottom: 0;
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
  color: #2e7d32;
  background: #e8f5e9;
}

.id-value {
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
  color: #888;
  background: #f5f5f5;
}

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
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1em;
  transition: all 0.3s ease;
}

.btn-editar:hover {
  background: #219a52;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
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
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-reintentar:hover {
  background: #219a52;
}

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

  .detail-actions {
    flex-direction: column;
  }

  .btn-editar,
  .btn-cerrar-detalle {
    width: 100%;
  }
}
</style>