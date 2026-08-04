<template>
  <div class="crear-campos">
    <h3>{{ isEditing ? 'Editar Campo' : 'Nuevo Campo' }}</h3>

    <form @submit.prevent="guardar">
      <div class="form-row">
        <div class="form-group">
          <label for="bloque">Bloque *</label>
          <input
            id="bloque"
            v-model="form.bloque"
            type="text"
            required
            placeholder="Ej: A1"
          />
        </div>

        <div class="form-group">
          <label for="campo">Campo *</label>
          <input
            id="campo"
            v-model="form.campo"
            type="text"
            required
            placeholder="Ej: Campo Norte"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="area">Area *</label>
          <input
            id="area"
            v-model.number="form.area"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label for="variedad">Variedad *</label>
          <input
            id="variedad"
            v-model="form.variedad"
            type="text"
            required
            placeholder="Tipo de variedad"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="cepa">Cepa *</label>
          <input
            id="cepa"
            v-model="form.cepa"
            type="text"
            required
            placeholder="Tipo de cepa"
          />
        </div>

        <div class="form-group">
          <label for="poblacion">Poblacion *</label>
          <input
            id="poblacion"
            v-model.number="form.poblacion"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="destino">Destino *</label>
          <input
            id="destino"
            v-model="form.destino"
            type="text"
            required
            placeholder="Destino del campo"
          />
        </div>

        <div class="form-group">
          <label for="rendimiento">Rendimiento *</label>
          <input
            id="rendimiento"
            v-model.number="form.rendimiento"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
          />
        </div>
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
import CamposService from '@/services/CamposService'
import type { Campos, CamposRequest } from '@/types/Campos'

const props = defineProps<{
  campos?: Campos | null
}>()

const emit = defineEmits<{
  created: []
  updated: []
  cancel: []
}>()

const isEditing = computed(() => !!props.campos?.id)
const isGuardando = ref(false)

const form = ref<CamposRequest>({
  bloque: '',
  campo: '',
  area: 0,
  variedad: '',
  cepa: '',
  poblacion: 0,
  destino: '',
  rendimiento: 0
})

const cargarDatos = () => {
  if (props.campos) {
    form.value = {
      bloque: props.campos.bloque || '',
      campo: props.campos.campo || '',
      area: props.campos.area || 0,
      variedad: props.campos.variedad || '',
      cepa: props.campos.cepa || '',
      poblacion: props.campos.poblacion || 0,
      destino: props.campos.destino || '',
      rendimiento: props.campos.rendimiento || 0
    }
  }
}

const guardar = async () => {
  isGuardando.value = true
  try {
    if (isEditing.value && props.campos?.id) {
      await CamposService.actualizarCampos(props.campos.id, form.value)
      emit('updated')
    } else {
      await CamposService.crearCampos(form.value)
      emit('created')
    }
  } catch (error) {
    console.error('Error al guardar:', error)
    alert('Error al guardar el campo')
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
.crear-campos {
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
  margin-bottom: 15px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
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

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
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
