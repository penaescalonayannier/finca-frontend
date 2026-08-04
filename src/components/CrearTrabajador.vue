<!-- src/components/CrearTrabajador.vue -->

<template>
  <div class="crear-trabajador">
    <h3>{{ isEditing ? 'Editar Trabajador' : 'Nuevo Trabajador' }}</h3>

    <form @submit.prevent="guardar">
      <div class="form-group">
        <label for="ruc">RUC *</label>
        <input
          id="ruc"
          v-model="form.ruc"
          type="text"
          required
          placeholder="Ej: 1234567890"
        />
      </div>

      <div class="form-group">
        <label for="nombre">Nombre *</label>
        <input
          id="nombre"
          v-model="form.nombre"
          type="text"
          required
          placeholder="Nombre completo"
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

      <div v-if="isEditing" class="form-group">
        <label for="cargo">Cargo</label>
        <div v-if="cargosDisponibles.length === 0" class="loading-cargos">
          Cargando cargos...
        </div>
        <select
          v-else
          id="cargo"
          v-model="form.cargoId"
          class="form-select"
        >
          <option value="">Sin asignar</option>
          <option v-for="cargo in cargosDisponibles" :key="cargo.id" :value="String(cargo.id)">
            {{ cargo.name }}
          </option>
        </select>
      </div>

      <div class="form-group checkbox-group">
        <label for="activo">
          <input
            id="activo"
            v-model="form.activo"
            type="checkbox"
            class="checkbox"
          />
          <span>Activo</span>
        </label>
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
import TrabajadorService from '@/services/TrabajadorService'
import CargoService from '@/services/CargoService'
import type { Trabajador, TrabajadorRequest } from '@/types/Trabajador'
import type { CargoEntity } from '@/types/Cargo'
import type { AxiosError } from 'axios'

const props = defineProps<{
  trabajador?: Trabajador | null
}>()

const emit = defineEmits<{
  created: []
  updated: []
  cancel: []
}>()

const isEditing = computed(() => !!props.trabajador?.id)
const isGuardando = ref(false)
const cargosDisponibles = ref<CargoEntity[]>([])
const cargoIdOriginal = ref<string | undefined>()

const form = ref<TrabajadorRequest & { cargoId?: string }>({
  ruc: '',
  nombre: '',
  cuenta: '',
  activo: true,
  cargoId: undefined
})

const cargarCargos = async () => {
  try {
    console.log('[cargarCargos] Iniciando carga de cargos...')
    const response = await CargoService.getAll()
    console.log('[cargarCargos] Respuesta completa:', response)
    console.log('[cargarCargos] response.data:', response.data)

    // response.data es un objeto con data, totalPages, etc.
    const cargosArray = response.data.data || response.data || []
    console.log('[cargarCargos] Array de cargos extraído:', cargosArray)

    cargosDisponibles.value = cargosArray
    console.log('[cargarCargos] ✅ Cargos cargados correctamente:', cargosDisponibles.value.length, 'cargos')
    cargosDisponibles.value.forEach(c => {
      console.log(`  - ${c.id}: ${c.name}`)
    })
  } catch (error) {
    console.error('[cargarCargos] ❌ Error al cargar cargos:', error)
    cargosDisponibles.value = []
  }
}

const cargarDatos = () => {
  console.log('[cargarDatos] Iniciando...')
  console.log('[cargarDatos] props.trabajador:', props.trabajador)
  console.log('[cargarDatos] Cargos disponibles:', cargosDisponibles.value.length)

  if (!props.trabajador) {
    console.log('[cargarDatos] props.trabajador es null/undefined, saliendo')
    return
  }

  const cargoId = props.trabajador.cargoId ? String(props.trabajador.cargoId) : ''
  console.log('[cargarDatos] CargoId del trabajador:', cargoId)

  form.value = {
    ruc: props.trabajador.ruc || '',
    nombre: props.trabajador.nombre || '',
    cuenta: props.trabajador.cuenta || '',
    activo: props.trabajador.activo !== false,
    cargoId: cargoId
  }
  cargoIdOriginal.value = cargoId

  console.log('[cargarDatos] Formulario actualizado:', form.value)

  // Verificar si el cargoId existe en los cargos disponibles
  if (cargoId && cargosDisponibles.value.length > 0) {
    const cargoEncontrado = cargosDisponibles.value.find(c => String(c.id) === cargoId)
    if (cargoEncontrado) {
      console.log('[cargarDatos] ✅ CARGO ENCONTRADO EN LISTA:', cargoEncontrado.name)
    } else {
      console.log('[cargarDatos] ❌ CARGO NO ENCONTRADO en lista. CargoId buscado:', cargoId)
      console.log('[cargarDatos] IDs disponibles:', cargosDisponibles.value.map(c => String(c.id)))
    }
  } else {
    console.log('[cargarDatos] CargoId vacío o no hay cargos disponibles')
  }
}

const guardar = async () => {
  // Validaciones
  if (!form.value.ruc.trim()) {
    alert('El RUC es obligatorio')
    return
  }
  if (!form.value.nombre.trim()) {
    alert('El nombre es obligatorio')
    return
  }
  if (!form.value.cuenta.trim()) {
    alert('La cuenta es obligatoria')
    return
  }

  isGuardando.value = true
  try {
    if (isEditing.value && props.trabajador?.id) {
      // Crear objeto sin cargoId para enviar al backend
      const { cargoId, ...trabajadorData } = form.value
      await TrabajadorService.actualizarTrabajador(props.trabajador.id, trabajadorData)

      // IMPORTANTE: Siempre asignar el cargo (incluso si no cambió)
      // para evitar que se pierda la referencia del cargo
      const cargoAAsignar = form.value.cargoId || ''
      console.log('Asignando cargo:', cargoAAsignar, 'al trabajador:', props.trabajador.id)

      if (cargoAAsignar) {
        await TrabajadorService.asignarCargo(props.trabajador.id, cargoAAsignar)
        console.log('Cargo asignado correctamente')
      } else {
        console.warn('No hay cargo para asignar')
      }
      emit('updated')
    } else {
      const { cargoId, ...trabajadorData } = form.value
      await TrabajadorService.crearTrabajador(trabajadorData)
      emit('created')
    }
  } catch (error) {
    console.error('Error al guardar:', error)
    const err = error as AxiosError<{ message: string }>
    const message = err.response?.data?.message || 'Error al guardar el trabajador'
    alert(message)
  } finally {
    isGuardando.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

onMounted(async () => {
  console.log('[onMounted] Componente montado, pre-cargando cargos...')
  await cargarCargos()
  console.log('[onMounted] Cargos pre-cargados, ahora el watch puede usarlos')
})

watch(
  () => props.trabajador,
  async (newVal) => {
    console.log('[Watch] Props trabajador cambió:', newVal?.id)
    if (newVal) {
      console.log('[Watch] Trabajador existe')
      console.log('[Watch] Cargos disponibles en este momento:', cargosDisponibles.value.length)

      // Si los cargos aún no se han cargado (onMounted todavía no terminó), cargarlos ahora
      if (cargosDisponibles.value.length === 0) {
        console.log('[Watch] Cargos no cargados, cargando ahora...')
        await cargarCargos()
      }

      // Ahora los cargos están disponibles, cargar datos del trabajador
      console.log('[Watch] Llamando a cargarDatos()...')
      cargarDatos()
      console.log('[Watch] Datos cargados exitosamente')
    } else {
      console.log('[Watch] Trabajador es null/undefined, inicializando formulario vacío')
      form.value = {
        ruc: '',
        nombre: '',
        cuenta: '',
        activo: true,
        cargoId: ''
      }
      cargoIdOriginal.value = ''
    }
  },
  { immediate: true }  // IMPORTANTE: Se dispara cuando el componente se monta
)
</script>

<style scoped>
.crear-trabajador {
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
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  margin-bottom: 0;
  cursor: pointer;
}

.checkbox-group .checkbox {
  width: auto;
  margin-right: 8px;
  margin-bottom: 0;
  cursor: pointer;
}

.checkbox-group span {
  font-weight: 500;
  color: #555;
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

.loading-cargos {
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #666;
  font-style: italic;
  text-align: center;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }

  .btn-guardar,
  .btn-cancelar {
    width: 100%;
  }
}
</style>