<!-- src/components/EntradaProduccion.vue -->

<template>
  <div class="entrada-produccion">
    <h2>Entrada de Producción</h2>
    <p class="subtitulo">Registrar entrada de productos al almacén de la finca</p>

    <div class="form-container">
      <form @submit.prevent="registrarEntrada">
        <div class="form-group">
          <label for="finca">Finca *</label>
          <select id="finca" v-model="form.fincaId" required @change="cargarProductosDeFinca">
            <option value="">Seleccione una finca...</option>
            <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
              {{ finca.code }} - {{ finca.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="producto">Producto *</label>
          <select id="producto" v-model="form.productoId" required :disabled="!form.fincaId || isLoadingProductos">
            <option value="">{{ isLoadingProductos ? 'Cargando productos...' : 'Seleccione un producto...' }}</option>
            <option v-for="fp in productosFinca" :key="fp.productoId" :value="fp.productoId">
              {{ fp.productoCode }} - {{ fp.productoName }} (Stock actual: {{ fp.stock }})
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group form-group-half">
            <label for="cantidad">Cantidad a Ingresar *</label>
            <input
              id="cantidad"
              v-model.number="form.cantidad"
              type="number"
              required
              min="1"
              step="1"
              placeholder="0"
            />
          </div>

          <div class="form-group form-group-half stock-actual" v-if="productoSeleccionado">
            <label>Stock Actual</label>
            <div class="stock-value">{{ productoSeleccionado.stock }}</div>
          </div>
        </div>

        <div class="form-group">
          <label for="descripcion">Descripción / Observaciones</label>
          <textarea
            id="descripcion"
            v-model="form.descripcion"
            placeholder="Ej: Cosecha de yuca del lote 3"
            rows="3"
          />
        </div>

        <div class="form-group">
          <label for="centroCosto">Centro de Costo (para contabilidad)</label>
          <select id="centroCosto" v-model="form.centroCosto" :disabled="isLoadingCentros">
            <option value="">{{ isLoadingCentros ? 'Cargando...' : 'Seleccione un centro de costo (opcional)' }}</option>
            <option v-for="centro in centrosCosto" :key="centro.id" :value="centro.codigo">
              {{ centro.codigo }} - {{ centro.nombre }}
            </option>
          </select>
          <small class="hint">Ej: 700.01.04 para Plátano, 700.10.01 para Leche</small>
        </div>

        <div v-if="mensaje" :class="['mensaje', mensajeTipo]">
          {{ mensaje }}
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-registrar" :disabled="isRegistrando || !formValido">
            {{ isRegistrando ? 'Registrando...' : 'Registrar Entrada' }}
          </button>
          <button type="button" class="btn-limpiar" @click="limpiarFormulario">Limpiar</button>
        </div>
      </form>
    </div>

    <!-- Historial reciente -->
    <div v-if="entradasRecientes.length > 0" class="historial">
      <h3>Entradas Recientes (esta sesión)</h3>
      <table class="historial-table">
        <thead>
          <tr>
            <th>Finca</th>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Nuevo Stock</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(entrada, idx) in entradasRecientes" :key="idx">
            <td>{{ entrada.fincaName }}</td>
            <td>{{ entrada.productoName }}</td>
            <td class="cantidad-cell">+{{ entrada.cantidad }}</td>
            <td class="stock-cell">{{ entrada.nuevoStock }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FincaService from '@/services/FincaService'
import FincaProductoService from '@/services/FincaProductoService'
import { CuentaContableService } from '@/services/ContabilidadService'
import type { Finca } from '@/types/Finca'
import type { FincaProducto } from '@/types/FincaProducto'
import type { CuentaContable } from '@/types/Contabilidad'

interface EntradaReciente {
  fincaName: string
  productoName: string
  cantidad: number
  nuevoStock: number
}

const fincas = ref<Finca[]>([])
const productosFinca = ref<FincaProducto[]>([])
const centrosCosto = ref<CuentaContable[]>([])
const isLoadingFincas = ref(false)
const isLoadingProductos = ref(false)
const isLoadingCentros = ref(false)
const isRegistrando = ref(false)
const mensaje = ref('')
const mensajeTipo = ref<'success' | 'error'>('success')
const entradasRecientes = ref<EntradaReciente[]>([])

const form = ref({
  fincaId: '',
  productoId: '',
  cantidad: 1,
  descripcion: '',
  centroCosto: ''
})

const productoSeleccionado = computed(() => {
  if (!form.value.productoId) return null
  return productosFinca.value.find(p => p.productoId === form.value.productoId)
})

const formValido = computed(() => {
  return form.value.fincaId && form.value.productoId && form.value.cantidad > 0
})

const cargarFincas = async () => {
  isLoadingFincas.value = true
  try {
    const response = await FincaService.buscarFincas({ size: 100 })
    const data = response.data as Record<string, unknown>
    if (data.data && Array.isArray(data.data)) {
      fincas.value = data.data as Finca[]
    } else if (data.content && Array.isArray(data.content)) {
      fincas.value = data.content as Finca[]
    }
  } catch (error) {
    console.error('Error al cargar fincas:', error)
    mensaje.value = 'Error al cargar las fincas'
    mensajeTipo.value = 'error'
  } finally {
    isLoadingFincas.value = false
  }
}

const cargarCentrosCosto = async () => {
  isLoadingCentros.value = true
  try {
    centrosCosto.value = await CuentaContableService.getCentrosCosto()
  } catch (error) {
    console.error('Error al cargar centros de costo:', error)
  } finally {
    isLoadingCentros.value = false
  }
}

const cargarProductosDeFinca = async () => {
  if (!form.value.fincaId) {
    productosFinca.value = []
    form.value.productoId = ''
    return
  }

  isLoadingProductos.value = true
  form.value.productoId = ''
  productosFinca.value = []

  try {
    const response = await FincaProductoService.obtenerProductosActivosDeFinca(form.value.fincaId)
    const data = response.data as Record<string, unknown>
    if (data.items && Array.isArray(data.items)) {
      productosFinca.value = data.items as FincaProducto[]
    } else if (Array.isArray(data)) {
      productosFinca.value = data as FincaProducto[]
    }
  } catch (error) {
    console.error('Error al cargar productos:', error)
    mensaje.value = 'Error al cargar los productos de la finca'
    mensajeTipo.value = 'error'
  } finally {
    isLoadingProductos.value = false
  }
}

const registrarEntrada = async () => {
  if (!formValido.value) return

  isRegistrando.value = true
  mensaje.value = ''

  try {
    const response = await FincaProductoService.entradaProduccion({
      fincaId: form.value.fincaId,
      productoId: form.value.productoId,
      cantidad: form.value.cantidad,
      descripcion: form.value.descripcion,
      centroCosto: form.value.centroCosto || undefined
    })

    const resultado = response.data
    mensaje.value = resultado.mensaje || `Entrada de ${form.value.cantidad} unidades registrada correctamente`
    mensajeTipo.value = 'success'

    // Guardar en historial reciente
    const finca = fincas.value.find(f => f.id === form.value.fincaId)
    const producto = productosFinca.value.find(p => p.productoId === form.value.productoId)

    entradasRecientes.value.unshift({
      fincaName: finca?.name || 'N/A',
      productoName: producto?.productoName || 'N/A',
      cantidad: form.value.cantidad,
      nuevoStock: resultado.nuevoStock
    })

    // Mantener solo las últimas 10 entradas
    if (entradasRecientes.value.length > 10) {
      entradasRecientes.value.pop()
    }

    // Actualizar el stock en la lista local
    if (producto) {
      producto.stock = resultado.nuevoStock
    }

    // Limpiar cantidad y descripción
    form.value.cantidad = 1
    form.value.descripcion = ''

  } catch (error: unknown) {
    console.error('Error al registrar entrada:', error)
    const err = error as { response?: { data?: { message?: string, errorFields?: Array<{ message: string }> } } }
    let errorMsg = 'Error al registrar la entrada'
    if (err.response?.data?.errorFields?.[0]?.message) {
      errorMsg = err.response.data.errorFields[0].message
    } else if (err.response?.data?.message) {
      errorMsg = err.response.data.message
    }
    mensaje.value = errorMsg
    mensajeTipo.value = 'error'
  } finally {
    isRegistrando.value = false
  }
}

const limpiarFormulario = () => {
  form.value = {
    fincaId: '',
    productoId: '',
    cantidad: 1,
    descripcion: '',
    centroCosto: ''
  }
  productosFinca.value = []
  mensaje.value = ''
}

onMounted(() => {
  cargarFincas()
  cargarCentrosCosto()
})
</script>

<style scoped>
.entrada-produccion {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 5px;
}

.subtitulo {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 25px;
}

.form-container {
  background: #fff;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-group-half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #27ae60;
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group .hint {
  display: block;
  margin-top: 5px;
  color: #7f8c8d;
  font-size: 0.85em;
}

.stock-actual {
  display: flex;
  flex-direction: column;
}

.stock-value {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 8px;
  font-size: 1.5em;
  font-weight: bold;
  text-align: center;
}

.mensaje {
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.mensaje.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.mensaje.error {
  background-color: #ffebee;
  color: #c62828;
  border: 1px solid #ffcdd2;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

.btn-registrar {
  flex: 1;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 14px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-registrar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
}

.btn-registrar:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-limpiar {
  background: #95a5a6;
  color: white;
  padding: 14px 25px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-limpiar:hover {
  background: #7f8c8d;
}

/* Historial */
.historial {
  margin-top: 30px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.historial h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 1.1em;
}

.historial-table {
  width: 100%;
  border-collapse: collapse;
}

.historial-table th,
.historial-table td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.historial-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9em;
}

.cantidad-cell {
  color: #27ae60;
  font-weight: bold;
}

.stock-cell {
  font-weight: 600;
  color: #2980b9;
}

/* Responsive */
@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-registrar,
  .btn-limpiar {
    width: 100%;
  }
}
</style>
