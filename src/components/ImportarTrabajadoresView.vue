<template>
  <div class="importar-trabajadores-view">
    <h2>Importar Trabajadores</h2>

    <div class="upload-section">
      <div class="upload-container">
        <div class="file-drop-zone" :class="{ 'drag-over': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="drop-icon">📋</div>
          <p>Arrastre un archivo aqui o</p>
          <input
            type="file"
            ref="fileInput"
            @change="handleFileChange"
            accept=".csv,.xlsx,.xls"
            class="file-input"
            id="file-upload"
          />
          <label for="file-upload" class="btn-seleccionar">Seleccionar Archivo</label>
        </div>

        <div v-if="selectedFile" class="file-info">
          <span class="file-name">{{ selectedFile.name }}</span>
          <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
          <button @click="limpiarArchivo" class="btn-remove">×</button>
        </div>
      </div>

      <div class="acciones">
        <button
          @click="importarArchivo"
          :disabled="!selectedFile || isImportando"
          class="btn-importar"
        >
          {{ isImportando ? 'Importando...' : 'Importar Trabajadores' }}
        </button>
      </div>

      <div v-if="mensaje" :class="['message', mensajeTipo]">
        {{ mensaje }}
      </div>

      <div v-if="isImportando" class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <span>Procesando archivo...</span>
      </div>
    </div>

    <div class="instrucciones">
      <h3>Instrucciones</h3>
      <ul>
        <li>Formatos aceptados: <strong>.csv, .xlsx, .xls</strong></li>
        <li>El archivo debe contener las columnas requeridas por el sistema</li>
        <li>Verifique que los datos esten correctamente formateados antes de importar</li>
        <li>Los registros duplicados seran actualizados automaticamente</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TrabajadorService from '@/services/TrabajadorService'

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isImportando = ref(false)
const isDragging = ref(false)
const mensaje = ref('')
const mensajeTipo = ref<'info' | 'success' | 'error'>('info')

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const handleFileChange = (event: Event) => {
  mensaje.value = ''
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  validarYAsignarArchivo(file)
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  validarYAsignarArchivo(file)
}

const validarYAsignarArchivo = (file: File | undefined) => {
  if (!file) return

  const extensionesValidas = ['.csv', '.xlsx', '.xls']
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (extensionesValidas.includes(extension)) {
    selectedFile.value = file
  } else {
    alert('Por favor, seleccione un archivo CSV o Excel (.csv, .xlsx, .xls)')
    selectedFile.value = null
  }
}

const limpiarArchivo = () => {
  selectedFile.value = null
  mensaje.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const importarArchivo = async () => {
  if (!selectedFile.value) return

  isImportando.value = true
  mensaje.value = 'Importando archivo...'
  mensajeTipo.value = 'info'

  try {
    const response = await TrabajadorService.importarCsv(selectedFile.value)

    const data = response.data
    mensaje.value = data.message || 'Importacion completada exitosamente'
    mensajeTipo.value = 'success'

    // Limpiar después de éxito
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }

  } catch (error: unknown) {
    console.error('Error al importar:', error)
    const err = error as { response?: { data?: { message?: string } } }
    mensaje.value = err.response?.data?.message || 'Error al importar el archivo'
    mensajeTipo.value = 'error'
  } finally {
    isImportando.value = false
  }
}
</script>

<style scoped>
.importar-trabajadores-view {
  max-width: 700px;
  margin: 40px auto;
  padding: 20px;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.upload-section {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
}

.upload-container {
  margin-bottom: 20px;
}

.file-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s;
  background-color: #fafafa;
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: #9b59b6;
  background-color: #f3e5f5;
}

.drop-icon {
  font-size: 3em;
  margin-bottom: 15px;
}

.file-drop-zone p {
  color: #666;
  margin-bottom: 15px;
}

.file-input {
  display: none;
}

.btn-seleccionar {
  display: inline-block;
  background-color: #9b59b6;
  color: white;
  padding: 10px 25px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-seleccionar:hover {
  background-color: #8e44ad;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background-color: #e8f5e9;
  border-radius: 4px;
  margin-top: 15px;
}

.file-name {
  font-weight: 500;
  color: #2e7d32;
}

.file-size {
  color: #666;
  font-size: 0.9em;
}

.btn-remove {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.5em;
  color: #999;
  cursor: pointer;
  padding: 0 5px;
}

.btn-remove:hover {
  color: #e74c3c;
}

.acciones {
  text-align: center;
  margin-top: 20px;
}

.btn-importar {
  background-color: #27ae60;
  color: white;
  padding: 12px 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1.1em;
  transition: background-color 0.2s;
}

.btn-importar:hover:not(:disabled) {
  background-color: #219a52;
}

.btn-importar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.message {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.info { background-color: #e3f2fd; color: #1976d2; }
.success { background-color: #e8f5e9; color: #388e3c; }
.error { background-color: #ffebee; color: #d32f2f; }

.progress-container {
  margin-top: 20px;
  text-align: center;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #9b59b6, #8e44ad);
  animation: progress-animation 1.5s infinite;
  width: 30%;
}

@keyframes progress-animation {
  0% { margin-left: 0; }
  50% { margin-left: 70%; }
  100% { margin-left: 0; }
}

.progress-container span {
  color: #666;
  font-size: 0.9em;
}

.instrucciones {
  background: #fff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #9b59b6;
}

.instrucciones h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 15px;
}

.instrucciones ul {
  margin: 0;
  padding-left: 20px;
  color: #555;
}

.instrucciones li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.instrucciones strong {
  color: #9b59b6;
}
</style>
