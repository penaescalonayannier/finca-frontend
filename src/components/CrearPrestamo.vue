<template>
  <div class="crear-prestamo">
    <h3>{{ isEditing ? 'Editar Prestamo' : 'Nuevo Prestamo' }}</h3>

    <form @submit.prevent="guardar">
      <div class="form-row">
        <div class="form-group">
          <label for="numeroContrato">Numero de Contrato *</label>
          <input
            id="numeroContrato"
            v-model="form.numeroContrato"
            type="text"
            required
            placeholder="Ej: CONT-001"
          />
        </div>
        <div class="form-group">
          <label for="cuenta">Cuenta *</label>
          <input
            id="cuenta"
            v-model="form.cuenta"
            type="text"
            required
            placeholder="Ej: 110-001"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="importeAprobado">Importe Total Aprobado *</label>
          <input
            id="importeAprobado"
            v-model.number="form.importeAprobado"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
          />
        </div>
        <div class="form-group">
          <label for="toneladasMolibles">Toneladas Molibles</label>
          <input
            id="toneladasMolibles"
            v-model.number="form.toneladasMolibles"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>

      <fieldset class="fieldset-group">
        <legend>Efectivo</legend>
        <div class="form-row">
          <div class="form-group">
            <label for="importeAprobadoEfectivo">Aprobado</label>
            <input
              id="importeAprobadoEfectivo"
              v-model.number="form.importeAprobadoEfectivo"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div class="form-group">
            <label for="importeUtilizadoEfectivo">Utilizado</label>
            <input
              id="importeUtilizadoEfectivo"
              v-model.number="form.importeUtilizadoEfectivo"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      </fieldset>

      <fieldset class="fieldset-group">
        <legend>Suministros</legend>
        <div class="form-row">
          <div class="form-group">
            <label for="importeAprobadoSuministros">Aprobado</label>
            <input
              id="importeAprobadoSuministros"
              v-model.number="form.importeAprobadoSuministros"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div class="form-group">
            <label for="importeUtilizadoSuministros">Utilizado</label>
            <input
              id="importeUtilizadoSuministros"
              v-model.number="form.importeUtilizadoSuministros"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      </fieldset>

      <fieldset class="fieldset-group">
        <legend>Seguro</legend>
        <div class="form-row">
          <div class="form-group">
            <label for="importeAprobadoSeguro">Aprobado</label>
            <input
              id="importeAprobadoSeguro"
              v-model.number="form.importeAprobadoSeguro"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div class="form-group">
            <label for="importeUtilizadoSeguro">Utilizado</label>
            <input
              id="importeUtilizadoSeguro"
              v-model.number="form.importeUtilizadoSeguro"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
        </div>
      </fieldset>

      <div class="form-group">
        <label for="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          v-model="form.observaciones"
          rows="3"
          placeholder="Notas adicionales..."
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-guardar" :disabled="isGuardando">
          {{ isGuardando ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
        </button>
        <button type="button" class="btn-cancelar" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PrestamoService from '@/services/PrestamoService'
import type { Prestamo, PrestamoRequest } from '@/types/Prestamo'

const props = defineProps<{
  prestamo?: Prestamo | null
}>()

const emit = defineEmits<{
  created: []
  updated: []
  cancel: []
}>()

const isEditing = computed(() => !!props.prestamo?.id)
const isGuardando = ref(false)

const form = ref<PrestamoRequest>({
  importeAprobado: 0,
  importeAprobadoEfectivo: 0,
  importeUtilizadoEfectivo: 0,
  importeAprobadoSuministros: 0,
  importeUtilizadoSuministros: 0,
  importeAprobadoSeguro: 0,
  importeUtilizadoSeguro: 0,
  numeroContrato: '',
  cuenta: '',
  observaciones: '',
  toneladasMolibles: 0
})

const cargarDatos = () => {
  if (props.prestamo) {
    form.value = {
      importeAprobado: props.prestamo.importeAprobado || 0,
      importeAprobadoEfectivo: props.prestamo.importeAprobadoEfectivo || 0,
      importeUtilizadoEfectivo: props.prestamo.importeUtilizadoEfectivo || 0,
      importeAprobadoSuministros: props.prestamo.importeAprobadoSuministros || 0,
      importeUtilizadoSuministros: props.prestamo.importeUtilizadoSuministros || 0,
      importeAprobadoSeguro: props.prestamo.importeAprobadoSeguro || 0,
      importeUtilizadoSeguro: props.prestamo.importeUtilizadoSeguro || 0,
      numeroContrato: props.prestamo.numeroContrato || '',
      cuenta: props.prestamo.cuenta || '',
      observaciones: props.prestamo.observaciones || '',
      toneladasMolibles: props.prestamo.toneladasMolibles || 0
    }
  }
}

const guardar = async () => {
  isGuardando.value = true
  try {
    if (isEditing.value && props.prestamo?.id) {
      await PrestamoService.actualizarPrestamo(props.prestamo.id, form.value)
      emit('updated')
    } else {
      await PrestamoService.crearPrestamo(form.value)
      emit('created')
    }
  } catch (error) {
    console.error('Error al guardar:', error)
    alert('Error al guardar el prestamo')
  } finally {
    isGuardando.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.crear-prestamo {
  padding: 10px;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
}

.form-row {
  display: flex;
  gap: 15px;
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
  font-size: 0.9em;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.fieldset-group {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fafafa;
}

.fieldset-group legend {
  font-weight: 600;
  color: #2c3e50;
  padding: 0 10px;
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
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
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
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}
</style>
