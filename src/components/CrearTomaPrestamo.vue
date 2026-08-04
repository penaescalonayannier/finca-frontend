<script setup lang="ts">
import { ref, onMounted, defineProps, defineEmits, watch } from 'vue'
import { TomaPrestamo, TomaPrestamoRequest, TipoTomaPrestamo } from '@/types/TomaPrestamo' 
import tomaPrestamoService from '@/services/TomaPrestamoService'
import prestamoService from '@/services/PrestamoService'
import type { Prestamo } from '@/types/Prestamo'

// =========================================================================
// PROPS Y EMITS
// =========================================================================

const props = defineProps<{
    isEditing: boolean,
    tomaPrestamoId?: string,
    creditoId: string 
}>()

const emit = defineEmits(['saved', 'cancel'])

// =========================================================================
// ESTADO Y REFS
// =========================================================================

// Lista de cuentas destino disponibles
const cuentasDestino = ref([
  { id: '0662421081590018', nombre: '0662421081590018' },
  // Puedes agregar más cuentas aquí en el futuro
])

const form = ref<TomaPrestamoRequest>({
  importe: 0,
  fecha: new Date().toISOString().substring(0, 10),
  cuentaDestino: '0662421081590018', // Valor por defecto
  tipo: 'EFECTIVO' as TipoTomaPrestamo, 
  observaciones: '',
  creditoId: props.creditoId, 
})

// Nuevo estado para la lista de créditos
const creditosDisponibles = ref<Prestamo[]>([])
const isLoading = ref(false)
const isLoadingCreditos = ref(false)

// =========================================================================
// WATCHERS
// =========================================================================

// Observa si la prop creditoId cambia para actualizar el formulario
watch(
  () => props.creditoId,
  (newCreditoId) => {
    form.value.creditoId = newCreditoId
  },
  { immediate: true }
)

// =========================================================================
// MÉTODOS
// =========================================================================

// Cargar la lista de créditos disponibles
const cargarCreditos = async () => {
  isLoadingCreditos.value = true
  try {
    // Llamar al servicio para obtener los préstamos
    const response = await prestamoService.buscarPrestamos({
      size: 100, // Número máximo de créditos a mostrar
      page: 0,
      query: '',
      filter: []
    })
    
    // Extraer los datos de la respuesta según la estructura esperada
    if (response.data && Array.isArray(response.data.data)) {
      creditosDisponibles.value = response.data.data
    } else if (response.data && Array.isArray(response.data.content)) {
      creditosDisponibles.value = response.data.content
    } else if (Array.isArray(response.data)) {
      creditosDisponibles.value = response.data
    } else {
      console.warn('Estructura de respuesta inesperada:', response.data)
      creditosDisponibles.value = []
    }
  } catch (error: any) {
    console.error('Error al cargar créditos:', error)
    let errorMessage = 'Error al cargar la lista de créditos'
    if (error.response?.data?.message) {
      errorMessage += `: ${error.response.data.message}`
    }
    alert(errorMessage)
  } finally {
    isLoadingCreditos.value = false
  }
}

const cargarDatos = async () => {
  if (props.isEditing && props.tomaPrestamoId) {
    isLoading.value = true
    try {
      // Lógica para cargar datos del servicio
      const data = await tomaPrestamoService.getById(props.tomaPrestamoId)
      // Asignar los datos al formulario, formateando la fecha si es necesario
      form.value = {
        importe: data.importe,
        fecha: data.fecha.substring(0, 10), // Formatear a YYYY-MM-DD
        cuentaDestino: data.cuentaDestino,
        tipo: data.tipo,
        observaciones: data.observaciones || '',
        creditoId: data.creditoId
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error)
      let errorMessage = 'Error al cargar los datos de la toma de préstamo'
      if (error.response?.data?.message) {
        errorMessage += `: ${error.response.data.message}`
      }
      alert(errorMessage)
      emit('cancel') // Cerrar el modal si hay error
    } finally {
      isLoading.value = false
    }
  }
}

const guardar = async () => {
  // 1. VALIDACIÓN CRÍTICA
  if (!form.value.creditoId) {
    alert('Error de Integración: El ID del crédito no fue proporcionado.')
    return
  }

  // 2. Validaciones adicionales
  if (form.value.importe <= 0) {
    alert('El importe debe ser un valor positivo.')
    return
  }

  if (!form.value.cuentaDestino.trim()) {
    alert('La cuenta destino es requerida.')
    return
  }

  if (!form.value.tipo) {
    alert('El tipo de toma es requerido.')
    return
  }

  isLoading.value = true
  try {
    if (props.isEditing && props.tomaPrestamoId) {
      // Lógica para Actualizar (PUT)
      await tomaPrestamoService.update(props.tomaPrestamoId, form.value)
      alert('Toma de préstamo actualizada correctamente.')
    } else {
      // Lógica para Crear (POST)
      await tomaPrestamoService.create(form.value)
      alert('Toma de préstamo creada correctamente.')
    }
    emit('saved')
  } catch (error: any) {
    console.error('Error al guardar la toma de préstamo:', error)
    let errorMessage = 'Error al guardar la toma de préstamo'
    if (error.response?.data?.message) {
      errorMessage += `: ${error.response.data.message}`
    }
    alert(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

// Función para formatear la visualización del crédito en el selector
const getCreditoDisplay = (credito: Prestamo) => {
  // Buscar campos comunes que podrían identificar el crédito
  // Ajusta estos campos según tu estructura de Prestamo
  if (credito.numeroCredito) {
    return `${credito.numeroCredito} - ${credito.clienteNombre || 'Sin nombre'}`
  } else if (credito.nombre) {
    return credito.nombre
  } else if (credito.descripcion) {
    return credito.descripcion.substring(0, 50) + (credito.descripcion.length > 50 ? '...' : '')
  }
  return credito.id || 'Crédito sin identificación'
}

// =========================================================================
// HOOKS
// =========================================================================

onMounted(() => {
  cargarDatos()
  cargarCreditos() // Cargar la lista de créditos al montar el componente
})
</script>

<template>
  <div class="crear-toma-prestamo">
    <h3>{{ isEditing ? 'Editar Toma de Prestamo' : 'Nueva Toma de Prestamo' }}</h3>

    <form @submit.prevent="guardar">
      <div class="form-group">
        <label for="fecha">Fecha *</label>
        <input
          id="fecha"
          v-model="form.fecha"
          type="date"
          required
          :disabled="isLoading"
        />
      </div>

      <div class="form-group">
        <label for="tipo">Tipo *</label>
        <select id="tipo" v-model="form.tipo" required :disabled="isLoading">
          <option value="">-- Seleccionar --</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="SUMINISTRO">Suministros</option> 
          <option value="SEGURO">Seguro</option>
        </select>
      </div>

      <div class="form-group">
        <label for="cuentaDestino">Cuenta Destino *</label>
        <select
          id="cuentaDestino"
          v-model="form.cuentaDestino"
          required
          :disabled="isLoading"
          class="cuenta-select"
        >
          <option value="">-- Seleccione una cuenta --</option>
          <option 
            v-for="cuenta in cuentasDestino" 
            :key="cuenta.id" 
            :value="cuenta.id"
          >
            {{ cuenta.nombre }}
          </option>
        </select>
        <small class="field-hint">Cuenta destino predefinida para las tomas de préstamo.</small>
      </div>

      <div class="form-group">
        <label for="importe">Importe *</label>
        <input
          id="importe"
          v-model.number="form.importe"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="0.00"
          :disabled="isLoading"
        />
      </div>

      <div class="form-group">
        <label for="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          v-model="form.observaciones"
          placeholder="Detalles de la toma..."
          :disabled="isLoading"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="creditoId">Seleccionar Crédito *</label>
        <select
          id="creditoId"
          v-model="form.creditoId"
          required
          :disabled="isLoading || isLoadingCreditos"
          class="credito-select"
        >
          <option value="">-- Seleccione un crédito --</option>
          <option 
            v-for="credito in creditosDisponibles" 
            :key="credito.id" 
            :value="credito.id"
          >
            {{ getCreditoDisplay(credito) }}
          </option>
        </select>
        <div v-if="isLoadingCreditos" class="loading-credit">
          <span>Cargando créditos...</span>
        </div>
        <small class="field-hint">Seleccione el crédito al que pertenece esta toma.</small>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-guardar" :disabled="isLoading || isLoadingCreditos">
          <span v-if="isLoading">Guardando...</span>
          <span v-else>{{ isEditing ? 'Guardar Cambios' : 'Crear Toma' }}</span>
        </button>
        <button type="button" class="btn-cancelar" @click="cancelar" :disabled="isLoading">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.crear-toma-prestamo {
  padding: 10px;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
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

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* Estilo específico para el selector de cuentas */
.cuenta-select {
  background-color: white;
}

.cuenta-select:disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

/* Estilo específico para el selector de créditos */
.credito-select {
  background-color: white;
}

.credito-select:disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

/* Indicador de carga para créditos */
.loading-credit {
  margin-top: 5px;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  text-align: center;
  color: #6c757d;
  font-size: 0.9em;
}

.field-hint {
  display: block;
  margin-top: 5px;
  color: #777;
  font-size: 0.85em;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-guardar,
.btn-cancelar {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-guardar {
  background-color: #2ecc71;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #27ae60;
}

.btn-cancelar {
  background-color: #bdc3c7;
  color: #2c3e50;
}

.btn-cancelar:hover:not(:disabled) {
  background-color: #95a5a6;
}

.btn-guardar:disabled,
.btn-cancelar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>