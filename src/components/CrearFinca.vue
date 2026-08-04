<!-- src/components/CrearFinca.vue -->

<template>
  <div class="crear-finca">
    <h3>{{ isEditing ? 'Editar Finca' : 'Nueva Finca' }}</h3>

    <form @submit.prevent="guardar">
      <div class="form-group">
        <label for="code">Código *</label>
        <input
          id="code"
          v-model="form.code"
          type="text"
          required
          placeholder="Ej: FIN-001"
        />
      </div>

      <div class="form-group">
        <label for="name">Nombre *</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          placeholder="Nombre de la finca"
        />
      </div>

      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          placeholder="Descripción de la finca"
          rows="3"
        />
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
import { ref, computed, onMounted, watch } from 'vue'
import FincaService from '@/services/FincaService'
import type { Finca, FincaRequest } from '@/types/Finca'

const props = defineProps<{
  finca?: Finca | null
}>()

const emit = defineEmits<{
  created: []
  updated: []
  cancel: []
}>()

const isEditing = computed(() => !!props.finca?.id)
const isGuardando = ref(false)

const form = ref<FincaRequest>({
  code: '',
  name: '',
  description: ''
})

const cargarDatos = () => {
  if (props.finca) {
    form.value = {
      code: props.finca.code || '',
      name: props.finca.name || '',
      description: props.finca.description || ''
    }
  }
}

const guardar = async () => {
  // Validaciones
  if (!form.value.code.trim()) {
    alert('El código es obligatorio')
    return
  }
  if (!form.value.name.trim()) {
    alert('El nombre es obligatorio')
    return
  }

  isGuardando.value = true
  try {
    if (isEditing.value && props.finca?.id) {
      await FincaService.actualizarFinca(props.finca.id, form.value)
      emit('updated')
    } else {
      await FincaService.crearFinca(form.value)
      emit('created')
    }
  } catch (error: any) {
    console.error('Error al guardar:', error)
    const message = error.response?.data?.message || 'Error al guardar la finca'
    alert(message)
  } finally {
    isGuardando.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

watch(() => props.finca, () => {
  if (props.finca) {
    cargarDatos()
  }
}, { immediate: true })

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.crear-finca {
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
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 60px;
}

.form-group input:focus,
.form-group textarea:focus {
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