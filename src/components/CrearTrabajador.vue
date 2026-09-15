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

      <div class="form-group">
        <label for="finca">Finca *</label>
        <div v-if="fincasDisponibles.length === 0" class="loading-cargos">
          Cargando fincas...
        </div>
        <select
          v-else
          id="finca"
          v-model="form.fincaId"
          class="form-select"
          required
        >
          <option value="">Seleccionar finca</option>
          <option v-for="finca in fincasDisponibles" :key="finca.id" :value="String(finca.id)">
            {{ finca.code }} - {{ finca.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="grupo">Grupo *</label>
        <div v-if="gruposLoading" class="loading-cargos">
          Cargando grupos...
        </div>
        <div v-else-if="gruposDisponibles.length === 0" class="loading-cargos">
          No hay grupos disponibles
        </div>
        <select
          v-else
          id="grupo"
          v-model="form.grupoId"
          class="form-select"
          required
        >
          <option value="">Seleccionar grupo</option>
          <option v-for="grupo in gruposDisponibles" :key="grupo.id" :value="String(grupo.id)">
            {{ grupo.nombre }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="cargo">Cargo *</label>
        <div v-if="cargosLoading" class="loading-cargos">
          Cargando cargos...
        </div>
        <div v-else-if="cargosDisponibles.length === 0" class="loading-cargos">
          No hay cargos disponibles
        </div>
        <select
          v-else
          id="cargo"
          v-model="form.cargoId"
          class="form-select"
          required
        >
          <option value="">Seleccionar cargo</option>
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
import FincaService from '@/services/FincaService'
import GrupoService from '@/services/GrupoService'
import type { Trabajador, TrabajadorRequest } from '@/types/Trabajador'
import type { CargoEntity } from '@/types/Cargo'
import type { Finca } from '@/types/Finca'
import type { Grupo } from '@/types/Grupo'
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
const cargosLoading = ref(true)
const gruposLoading = ref(true)
const cargosDisponibles = ref<CargoEntity[]>([])
const fincasDisponibles = ref<Finca[]>([])
const gruposDisponibles = ref<Grupo[]>([])

const form = ref<TrabajadorRequest>({
  ruc: '',
  nombre: '',
  cuenta: '',
  fincaId: undefined,
  grupoId: undefined,
  cargoId: undefined,
  activo: true
})

const cargarCargos = async () => {
  cargosLoading.value = true
  try {
    const response = await CargoService.getAll()
    const cargosArray = response.data.data || response.data || []
    cargosDisponibles.value = cargosArray
  } catch (error) {
    console.error('[cargarCargos] Error al cargar cargos:', error)
    cargosDisponibles.value = []
  } finally {
    cargosLoading.value = false
  }
}

const cargarFincas = async () => {
  try {
    const response = await FincaService.buscarFincas({ size: 1000, page: 0, sortBy: 'name', sortType: 'ASC' })
    const fincasArray = response.data.data || response.data || []
    fincasDisponibles.value = fincasArray
  } catch (error) {
    console.error('[cargarFincas] Error al cargar fincas:', error)
    fincasDisponibles.value = []
  }
}

const cargarGrupos = async () => {
  gruposLoading.value = true
  try {
    const response = await GrupoService.getAll()
    const gruposArray = response.data.data || response.data || []
    gruposDisponibles.value = gruposArray
  } catch (error) {
    console.error('[cargarGrupos] Error al cargar grupos:', error)
    gruposDisponibles.value = []
  } finally {
    gruposLoading.value = false
  }
}

const cargarDatos = () => {
  if (!props.trabajador) {
    return
  }

  const cargoId = props.trabajador.cargoId ? String(props.trabajador.cargoId) : ''
  const fincaId = props.trabajador.fincaId ? String(props.trabajador.fincaId) : ''
  const grupoId = props.trabajador.grupoId ? String(props.trabajador.grupoId) : ''

  form.value = {
    ruc: props.trabajador.ruc || '',
    nombre: props.trabajador.nombre || '',
    cuenta: props.trabajador.cuenta || '',
    fincaId: fincaId,
    grupoId: grupoId,
    cargoId: cargoId,
    activo: props.trabajador.activo !== false
  }
}

const guardar = async () => {
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
  if (!form.value.fincaId) {
    alert('La finca es obligatoria')
    return
  }
  if (!form.value.grupoId) {
    alert('El grupo es obligatorio')
    return
  }
  if (!form.value.cargoId) {
    alert('El cargo es obligatorio')
    return
  }

  isGuardando.value = true
  try {
    if (isEditing.value && props.trabajador?.id) {
      await TrabajadorService.actualizarTrabajador(props.trabajador.id, form.value)
      emit('updated')
    } else {
      await TrabajadorService.crearTrabajador(form.value)
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
  await Promise.all([cargarCargos(), cargarFincas(), cargarGrupos()])
})

watch(
  () => props.trabajador,
  async (newVal) => {
    if (newVal) {
      if (cargosDisponibles.value.length === 0 || fincasDisponibles.value.length === 0 || gruposDisponibles.value.length === 0) {
        await Promise.all([cargarCargos(), cargarFincas(), cargarGrupos()])
      }
      cargarDatos()
    } else {
      form.value = {
        ruc: '',
        nombre: '',
        cuenta: '',
        fincaId: '',
        grupoId: '',
        cargoId: '',
        activo: true
      }
    }
  },
  { immediate: true }
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