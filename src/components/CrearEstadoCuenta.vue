<template>
  <div class="crear-estado-cuenta">
    <h3>Crear Nuevo Estado de Cuenta</h3>

    <form @submit.prevent="crearEstadoCuenta">
      <div class="form-group">
        <label for="fecha">Fecha:</label>
        <input
          type="date"
          id="fecha"
          v-model="estadoCuenta.fecha"
          required
        />
      </div>

      <div class="form-group">
        <label for="refOrigen">Referencia Origen:</label>
        <input
          type="text"
          id="refOrigen"
          v-model="estadoCuenta.refOrigen"
          required
        />
      </div>

      <div class="form-group">
        <label for="refCorriente">Referencia Corriente:</label>
        <input
          type="text"
          id="refCorriente"
          v-model="estadoCuenta.refCorriente"
          required
        />
      </div>

      <div class="form-group">
        <label for="observaciones">Observaciones:</label>
        <textarea
          id="observaciones"
          v-model="estadoCuenta.observaciones"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="importe">Importe:</label>
        <input
          type="number"
          id="importe"
          v-model.number="estadoCuenta.importe"
          step="0.01"
          required
        />
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="cargando" class="btn-submit">
          {{ cargando ? 'Creando...' : 'Crear' }}
        </button>
        <button type="button" @click="emit('cancelar')" class="btn-cancelar">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import EstadoCuentaService from '@/services/EstadoCuentaService'
import type { EstadoCuenta } from '@/types/EstadoCuenta'

const emit = defineEmits<{
  'estadoCuenta-creado': []
  'cancelar': []
}>()

const cargando = ref(false)

const estadoCuenta = reactive<EstadoCuenta>({
  fecha: '',
  refOrigen: '',
  refCorriente: '',
  observaciones: '',
  importe: 0
})

const resetForm = () => {
  estadoCuenta.fecha = ''
  estadoCuenta.refOrigen = ''
  estadoCuenta.refCorriente = ''
  estadoCuenta.observaciones = ''
  estadoCuenta.importe = 0
}

const crearEstadoCuenta = async () => {
  cargando.value = true

  try {
    const estadoCuentaParaEnviar: EstadoCuenta = {
      ...estadoCuenta,
      importe: Number(estadoCuenta.importe)
    }

    await EstadoCuentaService.crearEstadoCuenta(estadoCuentaParaEnviar)

    alert('Estado de cuenta creado exitosamente!')
    emit('estadoCuenta-creado')
    resetForm()
  } catch (error) {
    console.error('Error al crear estado de cuenta:', error)
    alert('Error al crear el estado de cuenta')
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.crear-estado-cuenta {
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

.btn-submit {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-submit:disabled {
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
