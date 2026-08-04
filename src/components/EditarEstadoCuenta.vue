<template>
  <div class="editar-estado-cuenta">
    <h3>Editar Estado de Cuenta</h3>

    <form @submit.prevent="actualizarEstadoCuenta">
      <div class="form-group">
        <label for="fecha">Fecha:</label>
        <input
          type="date"
          id="fecha"
          v-model="estadoCuentaLocal.fecha"
          required
        />
      </div>

      <div class="form-group">
        <label for="refOrigen">Referencia Origen:</label>
        <input
          type="text"
          id="refOrigen"
          v-model="estadoCuentaLocal.refOrigen"
          required
        />
      </div>

      <div class="form-group">
        <label for="refCorriente">Referencia Corriente:</label>
        <input
          type="text"
          id="refCorriente"
          v-model="estadoCuentaLocal.refCorriente"
          required
        />
      </div>

      <div class="form-group">
        <label for="observaciones">Observaciones:</label>
        <textarea
          id="observaciones"
          v-model="estadoCuentaLocal.observaciones"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="importe">Importe:</label>
        <input
          type="number"
          id="importe"
          v-model.number="estadoCuentaLocal.importe"
          step="0.01"
          required
        />
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="cargando" class="btn-actualizar">
          {{ cargando ? 'Actualizando...' : 'Actualizar' }}
        </button>
        <button type="button" @click="emit('cancelar')" class="btn-cancelar">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { EstadoCuenta } from '@/types/EstadoCuenta'

const props = defineProps<{
  estadoCuenta: EstadoCuenta
}>()

const emit = defineEmits<{
  'estadoCuenta-actualizado': [estadoCuenta: EstadoCuenta]
  'cancelar': []
}>()

const cargando = ref(false)

const estadoCuentaLocal = reactive<EstadoCuenta>({ ...props.estadoCuenta })

watch(
  () => props.estadoCuenta,
  (newVal) => {
    Object.assign(estadoCuentaLocal, newVal)
  },
  { deep: true }
)

const actualizarEstadoCuenta = async () => {
  cargando.value = true

  try {
    alert(`Estado de cuenta actualizado (simulado)\nID: ${estadoCuentaLocal.id}`)
    emit('estadoCuenta-actualizado', { ...estadoCuentaLocal })
  } catch (error) {
    console.error('Error al actualizar estado de cuenta:', error)
    alert('Error al actualizar el estado de cuenta')
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.editar-estado-cuenta {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-actualizar {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-actualizar:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-cancelar {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
