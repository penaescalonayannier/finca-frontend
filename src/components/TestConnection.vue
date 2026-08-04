<template>
  <div class="test-connection">
    <h2>Prueba de Conexion con Backend</h2>

    <div class="test-buttons">
      <button @click="testGET" :disabled="testing" class="btn-test">
        Probar GET Basico
      </button>
      <button @click="testEstadoCuenta" :disabled="testing" class="btn-test">
        Probar Endpoint Estado Cuenta
      </button>
      <button @click="testSearch" :disabled="testing" class="btn-test">
        Probar Busqueda (POST)
      </button>
    </div>

    <div v-if="result" class="result-container">
      <h3>Resultado:</h3>
      <pre class="result">{{ result }}</pre>
    </div>

    <div v-if="error" class="error-container">
      <h3>Error:</h3>
      <pre class="error">{{ error }}</pre>
    </div>

    <div v-if="testing" class="loading">
      Probando conexion...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios, { AxiosError } from 'axios'

interface TestResult {
  status?: number
  statusText?: string
  data?: unknown
  headers?: Record<string, string>
}

interface TestError {
  message: string
  url?: string
  method?: string
  data?: unknown
  headers?: Record<string, string>
  reason?: string
  reasons?: string[]
  config?: unknown
}

const testing = ref(false)
const result = ref<TestResult | null>(null)
const error = ref<TestError | null>(null)

const reset = () => {
  result.value = null
  error.value = null
}

const handleError = (err: AxiosError) => {
  console.error('Error completo:', err)

  if (err.response) {
    error.value = {
      message: `Error ${err.response.status}: ${err.response.statusText}`,
      url: err.config?.url,
      method: err.config?.method,
      data: err.response.data,
      headers: err.response.headers as Record<string, string>
    }
  } else if (err.request) {
    error.value = {
      message: 'No se recibio respuesta del servidor',
      url: err.config?.url,
      reason: 'Posibles causas:',
      reasons: [
        '1. Spring Boot no esta corriendo en localhost:9908',
        '2. Hay un problema de red/firewall',
        '3. El endpoint no existe',
        '4. Hay un problema de CORS'
      ]
    }
  } else {
    error.value = {
      message: `Error: ${err.message}`,
      config: err.config
    }
  }
}

const testGET = async () => {
  reset()
  testing.value = true

  try {
    const response = await axios.get('http://localhost:9908/actuator/health')
    result.value = {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers as Record<string, string>
    }
  } catch (err) {
    handleError(err as AxiosError)
  } finally {
    testing.value = false
  }
}

const testEstadoCuenta = async () => {
  reset()
  testing.value = true

  try {
    const testId = '123e4567-e89b-12d3-a456-426614174000'
    const response = await axios.get(`http://localhost:9908/api/estado-cuenta/${testId}`)
    result.value = {
      status: response.status,
      data: response.data
    }
  } catch (err) {
    handleError(err as AxiosError)
  } finally {
    testing.value = false
  }
}

const testSearch = async () => {
  reset()
  testing.value = true

  try {
    const response = await axios.post(
      'http://localhost:9908/api/estado-cuenta/search',
      {
        page: 0,
        size: 10,
        filter: {},
        query: ''
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    result.value = {
      status: response.status,
      data: response.data
    }
  } catch (err) {
    handleError(err as AxiosError)
  } finally {
    testing.value = false
  }
}
</script>

<style scoped>
.test-connection {
  padding: 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin: 20px;
  background-color: #f9f9f9;
}

.test-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
}

.btn-test {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-test:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-test:hover:not(:disabled) {
  background-color: #1976d2;
}

.result-container,
.error-container {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}

.result-container {
  background-color: #e8f5e9;
  border: 1px solid #4caf50;
}

.error-container {
  background-color: #ffebee;
  border: 1px solid #f44336;
}

.result,
.error {
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: left;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.loading {
  margin-top: 20px;
  font-style: italic;
  color: #666;
}
</style>
