<template>
  <div class="procesar-xml-view">
    <h2>Procesar XML - Asignar Clientes</h2>

    <!-- Sección de carga de archivo -->
    <div class="upload-section">
      <div class="upload-container">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileChange"
          accept=".xml"
          class="file-input"
        />
        <button
          @click="procesarArchivo"
          :disabled="!selectedFile || isProcesando"
          class="btn-procesar"
        >
          {{ isProcesando ? 'Procesando...' : 'Leer XML' }}
        </button>
        <button
          v-if="operaciones.length > 0"
          @click="limpiarDatos"
          class="btn-limpiar"
        >
          Limpiar
        </button>
      </div>
      <div v-if="mensaje" :class="['message', mensajeTipo]">
        {{ mensaje }}
      </div>
    </div>

    <!-- Tabla de operaciones -->
    <div v-if="operaciones.length > 0" class="operaciones-section">
      <div class="resumen">
        <span><strong>Total operaciones:</strong> {{ operaciones.length }}</span>
        <span class="separator">|</span>
        <span class="credito"><strong>Creditos:</strong> {{ formatCurrency(totalCreditos) }}</span>
        <span class="separator">|</span>
        <span class="debito"><strong>Debitos:</strong> {{ formatCurrency(totalDebitos) }}</span>
      </div>

      <table class="operaciones-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Fecha</th>
            <th>Ref. Origen</th>
            <th>Ref. Corriente</th>
            <th>Observaciones</th>
            <th>Importe</th>
            <th>Tipo</th>
            <th>Cliente</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(op, index) in operaciones" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ op.fecha }}</td>
            <td>{{ op.refOrigen }}</td>
            <td>{{ op.refCorriente }}</td>
            <td class="observaciones">{{ op.observaciones }}</td>
            <td class="importe">{{ formatCurrency(op.importe) }}</td>
            <td>
              <span :class="['tipo-badge', op.tipo === 'Cr' ? 'credito' : 'debito']">
                {{ op.tipo }}
              </span>
            </td>
            <td>
              <select v-model="op.clienteId" class="select-cliente">
                <option value="">-- Seleccionar --</option>
                <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                  {{ cliente.cuenta }} - {{ cliente.nombre }}
                </option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="acciones-footer">
        <div class="asignacion-rapida">
          <label>Asignar a todos:</label>
          <select v-model="clienteGlobal" class="select-cliente-global">
            <option value="">-- Seleccionar --</option>
            <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
              {{ cliente.cuenta }} - {{ cliente.nombre }}
            </option>
          </select>
          <button @click="asignarATodos" :disabled="!clienteGlobal" class="btn-asignar">
            Aplicar a todos
          </button>
        </div>

        <button
          @click="guardarOperaciones"
          :disabled="isGuardando || !todasAsignadas"
          class="btn-guardar"
        >
          {{ isGuardando ? 'Guardando...' : 'Guardar Operaciones' }}
        </button>
      </div>

      <div v-if="!todasAsignadas" class="warning-message">
        Hay {{ operacionesSinAsignar }} operaciones sin cliente asignado
      </div>
    </div>

    <!-- Modal de éxito -->
    <div v-if="mostrarModalExito" class="modal">
      <div class="modal-content modal-exito">
        <div class="exito-icon">✓</div>
        <h3>Importacion Exitosa</h3>
        <p>Se guardaron <strong>{{ operacionesGuardadas }}</strong> operaciones correctamente.</p>
        <div class="modal-buttons">
          <button @click="irAListaEstadoCuenta" class="btn-ir-lista">
            Ver Estados de Cuenta
          </button>
          <button @click="continuarImportando" class="btn-continuar">
            Importar otro XML
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ClienteService from '@/services/ClienteService'
import EstadoCuentaService, { type EstadoCuentaBatchItem } from '@/services/EstadoCuentaService'
import type { Cliente } from '@/types/Cliente'

const router = useRouter()

// Interfaz extendida para incluir clienteId
interface OperacionXml {
  fecha: string
  refOrigen: string
  refCorriente: string
  observaciones: string
  importe: number
  tipo: 'Cr' | 'Db'
  clienteId: string
}

// Estado
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isProcesando = ref(false)
const isGuardando = ref(false)
const mensaje = ref('')
const mensajeTipo = ref<'info' | 'success' | 'error'>('info')

const operaciones = ref<OperacionXml[]>([])
const clientes = ref<Cliente[]>([])
const clienteGlobal = ref('')

// Computed
const totalCreditos = computed(() =>
  operaciones.value.filter(op => op.tipo === 'Cr').reduce((sum, op) => sum + op.importe, 0)
)

const totalDebitos = computed(() =>
  operaciones.value.filter(op => op.tipo === 'Db').reduce((sum, op) => sum + op.importe, 0)
)

const operacionesSinAsignar = computed(() =>
  operaciones.value.filter(op => !op.clienteId).length
)

const todasAsignadas = computed(() => operacionesSinAsignar.value === 0)

// Funciones
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
  }).format(value)
}

const cargarClientes = async () => {
  try {
    const response = await ClienteService.buscarClientes({
      page: 0,
      size: 1000, // Cargar todos los clientes
      query: '',
      filter: [],
    })

    const data = response.data as Record<string, unknown>
    if (data.content) {
      clientes.value = data.content as Cliente[]
    } else if (data.data) {
      clientes.value = data.data as Cliente[]
    } else if (Array.isArray(data)) {
      clientes.value = data as Cliente[]
    }
  } catch (error) {
    console.error('Error al cargar clientes:', error)
  }
}

const handleFileChange = (event: Event) => {
  mensaje.value = ''
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file && (file.type === 'text/xml' || file.name.endsWith('.xml'))) {
    selectedFile.value = file
  } else {
    alert('Por favor, seleccione un archivo XML valido.')
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

const procesarArchivo = async () => {
  if (!selectedFile.value) return

  isProcesando.value = true
  mensaje.value = 'Enviando XML al servidor...'
  mensajeTipo.value = 'info'

  try {
    const contenido = await readFileAsText(selectedFile.value)

    // Usar el endpoint preview-xml del backend para parsear el XML
    const response = await EstadoCuentaService.previewXml(contenido)
    const previewData = response.data

    if (!previewData.operaciones || previewData.operaciones.length === 0) {
      throw new Error('No se encontraron operaciones en el XML')
    }

    // Mapear las operaciones del backend a nuestro formato local
    const nuevasOperaciones: OperacionXml[] = previewData.operaciones.map(op => ({
      fecha: op.fecha || '',
      refOrigen: op.refOrigen || '',
      refCorriente: op.refCorriente || '',
      observaciones: op.observaciones || '',
      importe: op.importe || 0,
      tipo: (op.tipo as 'Cr' | 'Db') || 'Db',
      clienteId: '',
    }))

    operaciones.value = nuevasOperaciones
    mensaje.value = `Se cargaron ${nuevasOperaciones.length} operaciones del XML`
    mensajeTipo.value = 'success'

  } catch (error) {
    console.error('Error al procesar XML:', error)
    const err = error as { response?: { data?: { message?: string } } }
    mensaje.value = err.response?.data?.message || (error instanceof Error ? error.message : 'Error al procesar el archivo')
    mensajeTipo.value = 'error'
  } finally {
    isProcesando.value = false
  }
}

const asignarATodos = () => {
  if (!clienteGlobal.value) return
  operaciones.value.forEach(op => {
    op.clienteId = clienteGlobal.value
  })
}

const limpiarDatos = () => {
  operaciones.value = []
  clienteGlobal.value = ''
  selectedFile.value = null
  mensaje.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const guardarOperaciones = async () => {
  if (!todasAsignadas.value) {
    alert('Debe asignar un cliente a todas las operaciones')
    return
  }

  isGuardando.value = true
  mensaje.value = 'Guardando operaciones...'
  mensajeTipo.value = 'info'

  try {
    // Preparar operaciones para el batch
    const batchItems: EstadoCuentaBatchItem[] = operaciones.value.map(op => {
      // Asegurar que la fecha sea string en formato yyyy-MM-dd
      let fechaStr = ''
      if (op.fecha) {
        if (typeof op.fecha === 'string') {
          fechaStr = op.fecha
        } else if (typeof op.fecha === 'object') {
          // Si viene como objeto LocalDate {year, month, day}
          const f = op.fecha as unknown as { year?: number; monthValue?: number; dayOfMonth?: number }
          if (f.year && f.monthValue && f.dayOfMonth) {
            fechaStr = `${f.year}-${String(f.monthValue).padStart(2, '0')}-${String(f.dayOfMonth).padStart(2, '0')}`
          }
        }
      }

      return {
        fecha: fechaStr,
        refOrigen: op.refOrigen || '',
        refCorriente: op.refCorriente || '',
        observaciones: op.observaciones || '',
        type: op.tipo || 'Db',
        importe: op.importe || 0,
        clienteId: op.clienteId || null
      }
    })

    // Log para debug
    console.log('Enviando batch:', JSON.stringify(batchItems, null, 2))

    // Enviar todas las operaciones en un solo request
    const response = await EstadoCuentaService.crearBatch(batchItems)

    mensaje.value = `Se guardaron ${response.data.totalCreated} operaciones exitosamente`
    mensajeTipo.value = 'success'
    limpiarDatos()

  } catch (error: unknown) {
    console.error('Error al guardar operaciones:', error)
    const err = error as { response?: { data?: { message?: string; error?: string }; status?: number } }
    const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error al guardar las operaciones'
    mensaje.value = `Error: ${errorMsg}`
    mensajeTipo.value = 'error'

    // Log detallado para debug
    if (err.response) {
      console.error('Status:', err.response.status)
      console.error('Data:', err.response.data)
    }
  } finally {
    isGuardando.value = false
  }
}

onMounted(() => {
  cargarClientes()
})
</script>

<style scoped>
.procesar-xml-view {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
}

/* Upload Section */
.upload-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 25px;
}

.upload-container {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.file-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  flex: 1;
  min-width: 200px;
}

.btn-procesar {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-procesar:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-procesar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-limpiar {
  background-color: #e74c3c;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-limpiar:hover {
  background-color: #c0392b;
}

.message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 4px;
  font-weight: 500;
}

.info { background-color: #e3f2fd; color: #1976d2; }
.success { background-color: #e8f5e9; color: #388e3c; }
.error { background-color: #ffebee; color: #d32f2f; }

/* Operaciones Section */
.operaciones-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.resumen {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.resumen .separator {
  color: #ccc;
}

.resumen .credito {
  color: #27ae60;
}

.resumen .debito {
  color: #e74c3c;
}

/* Tabla */
.operaciones-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.operaciones-table th,
.operaciones-table td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: left;
  font-size: 0.9em;
}

.operaciones-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.operaciones-table tr:nth-child(even) {
  background-color: #fafafa;
}

.operaciones-table tr:hover {
  background-color: #f0f7ff;
}

.observaciones {
  min-width: 280px;
  max-width: 400px;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
}

.importe {
  text-align: right;
  font-weight: 500;
}

.tipo-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.8em;
}

.tipo-badge.credito {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.tipo-badge.debito {
  background-color: #ffebee;
  color: #c62828;
}

.select-cliente {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85em;
  min-width: 180px;
}

/* Footer */
.acciones-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.asignacion-rapida {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.asignacion-rapida label {
  font-weight: 500;
  color: #555;
}

.select-cliente-global {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 250px;
}

.btn-asignar {
  background-color: #9b59b6;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-asignar:hover:not(:disabled) {
  background-color: #8e44ad;
}

.btn-asignar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1em;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.warning-message {
  margin-top: 15px;
  padding: 12px;
  background-color: #fff3e0;
  color: #e65100;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}
</style>
