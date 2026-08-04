<template>
  <div class="upload-xml-view">
    <h2>Cargar Archivo de Estado de Cuenta (XML)</h2>
    <div class="upload-container">
      <input
        type="file"
        ref="fileInput"
        @change="handleFileChange"
        accept=".xml"
        class="file-input"
      />

      <button
        @click="uploadFile"
        :disabled="!selectedFile || isUploading"
        :class="{ 'btn-upload': true, 'btn-disabled': !selectedFile || isUploading }"
      >
        {{ isUploading ? 'Cargando...' : 'Subir XML' }}
      </button>

      <div v-if="uploadMessage" :class="['message', messageType]">
        {{ uploadMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import EstadoCuentaService from '@/services/EstadoCuentaService'
import type { AxiosError } from 'axios'

const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadMessage = ref('')
const messageType = ref<'info' | 'success' | 'error'>('info')

const handleFileChange = (event: Event) => {
  uploadMessage.value = ''
  messageType.value = 'info'

  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file && (file.type === 'text/xml' || file.name.endsWith('.xml'))) {
    selectedFile.value = file
  } else {
    alert('Por favor, seleccione un archivo con formato XML.')
    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = (e) => reject(e)
    reader.readAsText(file)
  })
}

const uploadFile = async () => {
  if (!selectedFile.value) return

  isUploading.value = true
  uploadMessage.value = 'Iniciando carga y procesamiento...'
  messageType.value = 'info'

  try {
    const fileContent = await readFileAsText(selectedFile.value)
    const response = await EstadoCuentaService.uploadXml(fileContent)

    uploadMessage.value = `Carga exitosa. ID del Proceso: ${response.id}`
    messageType.value = 'success'

    selectedFile.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (error) {
    console.error('Error al subir el archivo XML:', error)
    const axiosError = error as AxiosError<string>
    uploadMessage.value = `Error en la carga: ${axiosError.response?.data || 'Error de conexion.'}`
    messageType.value = 'error'
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.upload-xml-view {
  max-width: 600px;
  margin: 40px auto;
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: #fff;
}

.upload-xml-view h2 {
  text-align: center;
  color: #333;
  margin-bottom: 25px;
}

.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border: 2px dashed #ccc;
  border-radius: 6px;
  margin-bottom: 20px;
}

.file-input {
  padding: 10px;
  border: none;
}

.btn-upload {
  background-color: #42b983;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: bold;
}

.btn-upload:not([disabled]):hover {
  background-color: #36a877;
}

.btn-disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.message {
  padding: 10px;
  border-radius: 4px;
  font-weight: bold;
  width: 100%;
  text-align: center;
}

.info {
  background-color: #e0f7fa;
  color: #00bcd4;
}

.success {
  background-color: #e8f5e9;
  color: #4caf50;
}

.error {
  background-color: #ffebee;
  color: #f44336;
}

.instrucciones {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-left: 5px solid #007bff;
  border-radius: 4px;
}
.instrucciones ul {
  list-style-type: disc;
  padding-left: 20px;
}
</style>
