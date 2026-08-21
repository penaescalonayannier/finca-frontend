<!-- src/components/CrearAlmacen.vue -->

<template>
  <div class="crear-almacen">
    <h3>{{ isEditMode ? 'Editar Almacen' : 'Nuevo Almacen' }}</h3>

    <form @submit.prevent="guardarAlmacen">
      <div class="form-group">
        <label for="finca">Finca *</label>
        <select id="finca" v-model="form.fincaId" required class="form-select">
          <option value="" disabled>Seleccione una finca...</option>
          <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
            {{ finca.code }} - {{ finca.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="inventario">Numero de Inventario *</label>
        <input
          type="text"
          id="inventario"
          v-model="form.inventario"
          placeholder="Ej: INV-001"
          required
        />
      </div>

      <div class="form-group">
        <label for="nombre">Nombre *</label>
        <input
          type="text"
          id="nombre"
          v-model="form.nombre"
          placeholder="Nombre del almacen"
          required
        />
      </div>

      <div class="form-actions">
        <button type="button" class="btn-cancelar" @click="cancelar">Cancelar</button>
        <button type="submit" class="btn-guardar" :disabled="isSubmitting">
          {{ isSubmitting ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AlmacenService from '@/services/AlmacenService'
import FincaService from '@/services/FincaService'
import { notify } from '@/composables/useNotification'
import type { Almacen, AlmacenRequest } from '@/types/Almacen'
import type { Finca } from '@/types/Finca'

const props = defineProps<{
  almacen?: Almacen | null
}>()

const emit = defineEmits<{
  (e: 'created'): void
  (e: 'updated'): void
  (e: 'cancel'): void
}>()

const form = ref<AlmacenRequest>({
  nombre: '',
  inventario: '',
  fincaId: ''
})

const fincas = ref<Finca[]>([])
const isSubmitting = ref(false)

const isEditMode = computed(() => !!props.almacen?.id)

const cargarFincas = async () => {
  try {
    const response = await FincaService.buscarFincas({ size: 100, page: 0 })
    console.log('Respuesta fincas:', response.data)
    const data = response.data as Record<string, unknown>
    if (data.data && Array.isArray(data.data)) {
      fincas.value = data.data as Finca[]
    } else if (data.content && Array.isArray(data.content)) {
      fincas.value = data.content as Finca[]
    }
    console.log('Fincas cargadas:', fincas.value)
  } catch (error) {
    console.error('Error al cargar fincas:', error)
  }
}

const inicializarFormulario = () => {
  if (props.almacen) {
    form.value = {
      nombre: props.almacen.nombre || '',
      inventario: props.almacen.inventario || '',
      fincaId: props.almacen.fincaId || ''
    }
  } else {
    form.value = {
      nombre: '',
      inventario: '',
      fincaId: ''
    }
  }
}

watch(() => props.almacen, () => {
  inicializarFormulario()
}, { immediate: true })

const guardarAlmacen = async () => {
  if (!form.value.nombre.trim() || !form.value.inventario.trim() || !form.value.fincaId) {
    notify.warning('Campos requeridos', 'Complete todos los campos obligatorios')
    return
  }

  isSubmitting.value = true

  try {
    if (isEditMode.value && props.almacen?.id) {
      await AlmacenService.actualizarAlmacen(props.almacen.id, form.value)
      emit('updated')
    } else {
      await AlmacenService.crearAlmacen(form.value)
      emit('created')
    }
  } catch (error: unknown) {
    console.error('Error al guardar almacen:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const mensaje = err.response?.data?.message || 'Error al guardar el almacen'
    notify.error('Error', mensaje)
  } finally {
    isSubmitting.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

onMounted(async () => {
  await cargarFincas()
  inicializarFormulario()
})
</script>

<style scoped>
.crear-almacen {
  padding: 10px;
}

h3 {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.5em;
  text-align: center;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 0.95em;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #9b59b6;
  box-shadow: 0 0 0 3px rgba(155, 89, 182, 0.1);
}

.form-group input::placeholder {
  color: #aaa;
}

.form-select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  box-sizing: border-box;
  background-color: white;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: #9b59b6;
  box-shadow: 0 0 0 3px rgba(155, 89, 182, 0.1);
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancelar {
  padding: 12px 24px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
  transform: translateY(-2px);
}

.btn-guardar {
  padding: 12px 24px;
  background-color: #9b59b6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #8e44ad;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 480px) {
  .form-actions {
    flex-direction: column;
  }

  .btn-cancelar,
  .btn-guardar {
    width: 100%;
  }
}
</style>
