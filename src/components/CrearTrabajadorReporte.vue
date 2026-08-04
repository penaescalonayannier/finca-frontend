<!-- src/components/CrearTrabajadorReporte.vue -->

<template>
  <div class="crear-asignacion">
    <h3>{{ isEditing ? 'Editar Asignación' : 'Asignar Trabajador a Reporte' }}</h3>

    <form @submit.prevent="guardar">
      <div class="form-group">
        <label>Trabajador *</label>
        <select v-model="form.trabajadorId" required class="form-select" :disabled="isEditing">
          <option value="">Seleccione un trabajador</option>
          <option v-for="trabajador in trabajadores" :key="trabajador.id" :value="trabajador.id">
            {{ trabajador.nombre }} - {{ trabajador.ruc }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Reporte *</label>
        <select v-model="form.reporteId" required class="form-select" :disabled="isEditing">
          <option value="">Seleccione un reporte</option>
          <option v-for="reporte in reportes" :key="reporte.id" :value="reporte.id">
            {{ reporte.codigo }} - {{ reporte.bloque }} / {{ reporte.campo }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <div class="form-group form-group-half">
          <label>Horas *</label>
          <input
            v-model="form.horas"
            type="text"
            required
            placeholder="Ej: 8:00"
            class="form-input"
          />
        </div>

        <div class="form-group form-group-half">
          <label>Norma *</label>
          <input
            v-model="form.norma"
            type="text"
            required
            placeholder="Ej: N-001"
            class="form-input"
          />
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-guardar" :disabled="isGuardando">
          {{ isGuardando ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Asignar') }}
        </button>
        <button type="button" class="btn-cancelar" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TrabajadorReporteService from '@/services/TrabajadorReporteService'
import TrabajadorService from '@/services/TrabajadorService'
import ReporteService from '@/services/ReporteService'
import type { Trabajador } from '@/types/Trabajador'
import type { Reporte } from '@/types/Reporte'
import type { AxiosError } from 'axios'

const props = defineProps<{
  asignacion?: any | null
  trabajadorId?: string
  reporteId?: string
}>()

const emit = defineEmits<{
  created: []
  updated: []
  cancel: []
}>()

const isEditing = computed(() => !!props.asignacion?.id)
const isGuardando = ref(false)

const trabajadores = ref<Trabajador[]>([])
const reportes = ref<Reporte[]>([])

const form = ref({
  trabajadorId: props.trabajadorId || '',
  reporteId: props.reporteId || '',
  norma: '',
  horas: ''
})

const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({ size: 999 })
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  }
}

const cargarReportes = async () => {
  try {
    const response = await ReporteService.buscarReportes({ size: 999 })
    reportes.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar reportes:', error)
  }
}

const cargarDatos = () => {
  if (props.asignacion) {
    form.value = {
      trabajadorId: props.asignacion.trabajadorId || props.asignacion.trabajador || '',
      reporteId: props.asignacion.reporteId || props.asignacion.reporte || '',
      norma: props.asignacion.norma || '',
      horas: props.asignacion.horas || ''
    }
  }
}

const guardar = async () => {
  // Validaciones
  if (!form.value.trabajadorId) {
    alert('Seleccione un trabajador')
    return
  }
  if (!form.value.reporteId) {
    alert('Seleccione un reporte')
    return
  }
  if (!form.value.norma.trim()) {
    alert('La norma es obligatoria')
    return
  }
  if (!form.value.horas.trim()) {
    alert('Las horas son obligatorias')
    return
  }

  isGuardando.value = true
  try {
    if (isEditing.value && props.asignacion?.id) {
      await TrabajadorReporteService.actualizarAsignacion(props.asignacion.id, {
        trabajadorId: form.value.trabajadorId,
        reporteId: form.value.reporteId,
        norma: form.value.norma,
        horas: form.value.horas
      })
      emit('updated')
    } else {
      await TrabajadorReporteService.asignarTrabajadorAReporte({
        trabajadorId: form.value.trabajadorId,
        reporteId: form.value.reporteId,
        norma: form.value.norma,
        horas: form.value.horas
      })
      emit('created')
    }
  } catch (error) {
    console.error('Error al guardar:', error)
    const err = error as AxiosError<{ message: string }>
    const message = err.response?.data?.message || 'Error al guardar la asignación'
    alert(message)
  } finally {
    isGuardando.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

watch(() => props.asignacion, () => {
  if (props.asignacion) {
    cargarDatos()
  }
}, { immediate: true })

// Si se proporciona un reporteId y no hay asignación, preseleccionarlo
watch(() => props.reporteId, (newVal) => {
  if (newVal && !props.asignacion && !form.value.reporteId) {
    form.value.reporteId = newVal
  }
}, { immediate: true })

onMounted(() => {
  cargarTrabajadores()
  cargarReportes()
  cargarDatos()
  
  // Si se proporciona un reporteId y no hay asignación, preseleccionarlo
  if (props.reporteId && !props.asignacion && !form.value.reporteId) {
    form.value.reporteId = props.reporteId
  }
})
</script>

<style scoped>
.crear-asignacion {
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

.form-row {
  display: flex;
  gap: 15px;
}

.form-group-half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-select,
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
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
  background-color: #27ae60;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
  transform: translateY(-2px);
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-group-half {
    flex: none;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-guardar,
  .btn-cancelar {
    width: 100%;
  }
}
</style>