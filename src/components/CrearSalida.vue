<!-- src/components/CrearSalida.vue -->
<template>
  <div class="crear-salida">
    <h3>{{ isEditing ? 'Editar Salida' : 'Nueva Salida' }}</h3>

    <form @submit.prevent="handleSubmit">
      <!-- Finca-Producto -->
      <div class="form-row">
        <div class="form-group">
          <label>Finca - Producto *</label>
          <select v-model="form.fincaProductoId" class="form-select" required @change="onFincaProductoChange">
            <option value="">Seleccione...</option>
            <option v-for="fp in fincaProductos" :key="fp.id" :value="fp.id">
              {{ fp.fincaCode }} - {{ fp.productoName }} (Stock: {{ fp.stock }})
            </option>
          </select>
        </div>
      </div>

      <!-- Destino y Tipo (auto-determinado) -->
      <div class="form-row">
        <div class="form-group">
          <label>Destino *</label>
          <select v-model="form.destino" class="form-select" required>
            <option value="TRABAJADORES">Trabajadores</option>
            <option value="COMEDOR">Comedor</option>
            <option value="VENTA_ESTADO">Venta Estado</option>
            <option value="POBLACION">Población</option>
            <option value="INSUMO">Insumo</option>
            <option value="OTROS">Otros</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipo de documento</label>
          <div class="tipo-preview" :class="tipoGenerado === 'FACTURA' ? 'tipo-factura' : 'tipo-vale'">
            {{ tipoGenerado === 'FACTURA' ? 'FACTURA' : 'VALE' }}
            <span class="tipo-hint">(automático según destino)</span>
          </div>
        </div>
      </div>

      <!-- Info Stock -->
      <div v-if="stockDisponible !== null" class="stock-info">
        <span>Stock disponible: <strong>{{ stockDisponible }}</strong></span>
        <span v-if="cantidadTotal > 0" :class="{ 'error': cantidadTotal > stockDisponible }">
          | Cantidad a sacar: <strong>{{ cantidadTotal }}</strong>
        </span>
      </div>

      <!-- Items -->
      <div class="items-section">
        <div class="items-header">
          <h4>Items de Salida</h4>
          <button type="button" class="btn-agregar" @click="agregarItem">+ Agregar Item</button>
        </div>

        <div v-for="(item, index) in form.items" :key="index" class="item-row">
          <div class="form-group" v-if="form.destino === 'TRABAJADORES'">
            <label>Trabajador</label>
            <select v-model="item.trabajadorId" class="form-select">
              <option value="">Seleccione...</option>
              <option v-for="t in trabajadores" :key="t.id" :value="t.id">
                {{ t.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group cantidad-group">
            <label>Cantidad *</label>
            <input v-model.number="item.cantidad" type="number" min="1" class="form-input" required />
          </div>
          <div class="form-group pagado-group" v-if="form.destino === 'TRABAJADORES'">
            <label>
              <input type="checkbox" v-model="item.pagado" /> Pagado
            </label>
          </div>
          <button type="button" class="btn-eliminar-item" @click="eliminarItem(index)" v-if="form.items.length > 1">
            ×
          </button>
        </div>

        <div class="total-items">
          <strong>Total: {{ cantidadTotal }} unidades</strong>
        </div>
      </div>

      <!-- Observaciones -->
      <div class="form-group">
        <label>Observaciones</label>
        <textarea v-model="form.observaciones" class="form-textarea" rows="2"></textarea>
      </div>

      <!-- Acciones -->
      <div class="form-actions">
        <button type="button" class="btn-cancelar" @click="$emit('cancel')">Cancelar</button>
        <button type="submit" class="btn-guardar" :disabled="isSubmitting || !isFormValid">
          {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Salida') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SalidaService from '@/services/SalidaService'
import FincaProductoService from '@/services/FincaProductoService'
import TrabajadorService from '@/services/TrabajadorService'
import { notify } from '@/composables/useNotification'
import type { DestinoSalida, ItemSalida, CreateSalidaRequest } from '@/types/Salida'
import { DESTINO_TIPO_MAP } from '@/types/Salida'

interface FincaProducto {
  id: string
  fincaCode: string
  fincaName: string
  productoCode: string
  productoName: string
  stock: number
}

interface Trabajador {
  id: string
  nombre: string
}

const props = defineProps<{
  salida?: any
}>()

const emit = defineEmits(['created', 'updated', 'cancel'])

const isEditing = computed(() => !!props.salida?.id)
const isSubmitting = ref(false)

const fincaProductos = ref<FincaProducto[]>([])
const trabajadores = ref<Trabajador[]>([])
const stockDisponible = ref<number | null>(null)

const form = ref({
  fincaProductoId: '',
  destino: 'TRABAJADORES' as DestinoSalida,
  observaciones: '',
  items: [{ trabajadorId: '', cantidad: 1, pagado: false }] as ItemSalida[]
})

// RN-09: Tipo automático según destino
const tipoGenerado = computed(() => DESTINO_TIPO_MAP[form.value.destino])

const cantidadTotal = computed(() => {
  return form.value.items.reduce((sum, item) => sum + (item.cantidad || 0), 0)
})

const isFormValid = computed(() => {
  return form.value.fincaProductoId &&
    form.value.items.length > 0 &&
    cantidadTotal.value > 0 &&
    cantidadTotal.value <= (stockDisponible.value || 0)
})

const cargarFincaProductos = async () => {
  try {
    const response = await FincaProductoService.searchFincaProductos({
      page: 0,
      size: 200,
      filter: []
    })
    fincaProductos.value = response.data.data || []
  } catch (error) {
    console.error('Error cargando finca-productos:', error)
  }
}

const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({
      page: 0,
      size: 200,
      filter: [],
      query: ''
    })
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error cargando trabajadores:', error)
  }
}

const onFincaProductoChange = () => {
  const fp = fincaProductos.value.find(f => f.id === form.value.fincaProductoId)
  stockDisponible.value = fp ? fp.stock : null
}

const agregarItem = () => {
  form.value.items.push({ trabajadorId: '', cantidad: 1, pagado: false })
}

const eliminarItem = (index: number) => {
  form.value.items.splice(index, 1)
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  isSubmitting.value = true
  try {
    const data: CreateSalidaRequest = {
      destino: form.value.destino,
      fincaProductoId: form.value.fincaProductoId,
      observaciones: form.value.observaciones,
      items: form.value.items.map(item => ({
        trabajadorId: item.trabajadorId || '',
        cantidad: item.cantidad
      }))
    }

    if (isEditing.value) {
      await SalidaService.update(props.salida.id, { ...data, id: props.salida.id })
      notify.success('Salida actualizada', 'La salida se actualizó correctamente')
      emit('updated')
    } else {
      await SalidaService.create(data)
      notify.success('Salida creada', 'La salida se registró correctamente')
      emit('created')
    }
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Error al guardar la salida'
    notify.error('Error', msg)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  cargarFincaProductos()
  cargarTrabajadores()

  if (props.salida) {
    form.value = {
      fincaProductoId: props.salida.fincaProductoId,
      destino: props.salida.destino,
      observaciones: props.salida.observaciones || '',
      items: props.salida.items || [{ trabajadorId: '', cantidad: 1, pagado: false }]
    }
  }
})

watch(() => form.value.destino, (newDestino) => {
  if (newDestino !== 'TRABAJADORES') {
    form.value.items.forEach(item => {
      item.trabajadorId = ''
    })
  }
})
</script>

<style scoped>
.crear-salida {
  padding: 10px;
}

h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
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

.form-select, .form-input, .form-textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: border-color 0.2s;
}

.form-select:focus, .form-input:focus, .form-textarea:focus {
  border-color: #3498db;
  outline: none;
}

.stock-info {
  background: #e8f5e9;
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  color: #2e7d32;
  display: flex;
  gap: 15px;
}

.stock-info .error {
  color: #e74c3c;
}

.items-section {
  border: 2px solid #e0e0e0;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 15px;
  background: #fafafa;
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
}

.btn-agregar {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.item-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
}

.item-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.cantidad-group {
  max-width: 100px;
}

.pagado-group {
  max-width: 80px;
  display: flex;
  align-items: center;
}

.pagado-group label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.btn-eliminar-item {
  background: #e74c3c;
  color: white;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
}

.total-items {
  text-align: right;
  padding: 10px;
  background: #e3f2fd;
  border-radius: 8px;
  color: #1565c0;
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
  background: #27ae60;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-guardar:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  background: #95a5a6;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.tipo-preview {
  padding: 10px 15px;
  border-radius: 8px;
  font-weight: 600;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tipo-vale {
  background: #e3f2fd;
  color: #1565c0;
  border: 2px solid #1565c0;
}

.tipo-factura {
  background: #fff3e0;
  color: #e65100;
  border: 2px solid #e65100;
}

.tipo-hint {
  font-size: 0.75em;
  font-weight: 400;
  opacity: 0.8;
}
</style>
