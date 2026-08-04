<!-- src/components/CrearGrupo.vue -->
<template>
  <div class="crear-grupo">
    <div class="formulario-contenedor">
      <h2>Crear Nuevo Grupo</h2>

      <form @submit.prevent="guardarGrupo" class="formulario">
        <div class="grupo-formulario">
          <label for="nombre">Nombre *</label>
          <input
            id="nombre"
            v-model="formulario.nombre"
            type="text"
            placeholder="Ej: Brigada A"
            required
          />
        </div>

        <div class="grupo-formulario">
          <label for="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            v-model="formulario.descripcion"
            placeholder="Descripción del grupo"
            rows="4"
          ></textarea>
        </div>

        <div class="grupo-formulario">
          <label>Adicionar Trabajadores</label>
          <div v-if="trabajadores.length === 0" class="loading-message">
            Cargando trabajadores...
          </div>
          <div v-else class="trabajadores-selector">
            <div class="selector-container">
              <select v-model="trabajadorSeleccionado" class="form-select">
                <option value="">Seleccione un trabajador</option>
                <option
                  v-for="trab in trabajadoresDisponibles"
                  :key="trab.id"
                  :value="trab.id"
                >
                  {{ trab.nombre }} - {{ trab.ruc }} {{ trab.cargoName ? `(${trab.cargoName})` : '' }}
                </option>
              </select>
              <button
                type="button"
                @click="agregarTrabajador"
                class="btn-agregar"
                :disabled="!trabajadorSeleccionado"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>

        <div v-if="trabajadoresAsignados.length > 0" class="grupo-formulario">
          <label>Trabajadores Asignados</label>
          <div class="lista-trabajadores">
            <div v-for="trab in trabajadoresAsignados" :key="trab.id" class="item-trabajador">
              <span>{{ trab.nombre }} - {{ trab.ruc }} {{ trab.cargoName ? `(${trab.cargoName})` : '' }}</span>
              <button
                type="button"
                @click="removerTrabajador(trab.id)"
                class="btn-remover"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div class="grupo-formulario">
          <label for="jefeId">Jefe del Grupo *</label>
          <div v-if="trabajadores.length === 0" class="loading-message">
            Cargando trabajadores...
          </div>
          <select v-else id="jefeId" v-model="formulario.jefeId" required>
            <option value="">Seleccione un jefe</option>
            <option v-for="trab in trabajadores" :key="trab.id" :value="trab.id">
              {{ trab.nombre }} - RUC: {{ trab.ruc }} {{ trab.cargoName ? `(${trab.cargoName})` : '' }}
            </option>
          </select>
        </div>

        <div class="acciones">
          <button type="submit" :disabled="isLoading" class="btn-guardar">
            {{ isLoading ? 'Guardando...' : 'Guardar Grupo' }}
          </button>
          <button type="button" @click="irALista" class="btn-cancelar">Cancelar</button>
        </div>
      </form>

      <div v-if="mensaje.texto" :class="['mensaje', mensaje.tipo]">
        {{ mensaje.texto }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GrupoService from '@/services/GrupoService'
import TrabajadorService from '@/services/TrabajadorService'
import type { CreateGrupoRequest } from '@/types/Grupo'
import type { Trabajador } from '@/types/Trabajador'

const router = useRouter()

const formulario = ref<CreateGrupoRequest>({
  nombre: '',
  descripcion: '',
  jefeId: ''
})

const isLoading = ref(false)
const mensaje = ref({ texto: '', tipo: 'exito' })
const trabajadores = ref<Trabajador[]>([])
const trabajadoresAsignados = ref<Trabajador[]>([])
const trabajadorSeleccionado = ref('')

const trabajadoresDisponibles = computed(() => {
  return trabajadores.value.filter(
    t => !trabajadoresAsignados.value.some(ta => ta.id === t.id) && t.id !== formulario.value.jefeId
  )
})

const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.getAll()
    console.log('Respuesta de trabajadores:', response.data)
    trabajadores.value = response.data.data || response.data.content || []
    console.log('Trabajadores cargados:', trabajadores.value)
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  }
}

const agregarTrabajador = () => {
  if (!trabajadorSeleccionado.value) {
    return
  }

  const trabajador = trabajadores.value.find(t => t.id === trabajadorSeleccionado.value)
  if (trabajador && !trabajadoresAsignados.value.some(t => t.id === trabajador.id)) {
    trabajadoresAsignados.value.push(trabajador)
    trabajadorSeleccionado.value = ''
  }
}

const removerTrabajador = (id: string) => {
  trabajadoresAsignados.value = trabajadoresAsignados.value.filter(t => t.id !== id)
}

const guardarGrupo = async () => {
  if (!formulario.value.nombre || !formulario.value.jefeId) {
    mensaje.value = { texto: 'Por favor completa los campos requeridos', tipo: 'error' }
    return
  }

  isLoading.value = true
  try {
    // Crear el grupo
    const grupoResponse = await GrupoService.create(formulario.value)
    const grupoId = grupoResponse.data.id

    // Asignar trabajadores al grupo (si hay algunos asignados)
    if (trabajadoresAsignados.value.length > 0) {
      for (const trab of trabajadoresAsignados.value) {
        try {
          await TrabajadorService.asignarGrupo(trab.id, grupoId)
        } catch (error) {
          console.error(`Error al asignar trabajador ${trab.nombre}:`, error)
        }
      }
    }

    mensaje.value = { texto: 'Grupo creado exitosamente', tipo: 'exito' }
    setTimeout(() => {
      router.push('/lista-grupos')
    }, 1500)
  } catch (error) {
    console.error('Error al crear grupo:', error)
    mensaje.value = { texto: 'Error al crear el grupo', tipo: 'error' }
  } finally {
    isLoading.value = false
  }
}

const irALista = () => {
  router.push('/lista-grupos')
}

onMounted(() => {
  cargarTrabajadores()
})
</script>

<style scoped>
.crear-grupo {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.formulario-contenedor {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.formulario-contenedor h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 30px;
}

.grupo-formulario {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.grupo-formulario label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.grupo-formulario input,
.grupo-formulario textarea {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 1em;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.grupo-formulario select {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 1em;
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.grupo-formulario input:focus,
.grupo-formulario select:focus,
.grupo-formulario textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.acciones {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.btn-guardar {
  flex: 1;
  padding: 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #229954;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  flex: 1;
  padding: 12px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}

.mensaje {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.mensaje.exito {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.mensaje.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.loading-message {
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  color: #666;
  font-style: italic;
  text-align: center;
}

.trabajadores-selector {
  padding: 0;
  border-radius: 0;
  border: none;
  background-color: transparent;
}

.selector-container {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  width: 100%;
  box-sizing: border-box;
}

.form-select {
  flex: 1;
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 1em;
  font-family: inherit;
  min-width: 0;
}

.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.btn-agregar {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  transition: background-color 0.3s;
  height: fit-content;
}

.btn-agregar:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-agregar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.lista-trabajadores {
  background-color: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  max-height: 250px;
  overflow-y: auto;
  margin-top: 10px;
}

.item-trabajador {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: white;
  margin-bottom: 8px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  font-size: 0.95em;
}

.item-trabajador:last-child {
  margin-bottom: 0;
}

.item-trabajador span {
  flex: 1;
}

.btn-remover {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
  margin-left: 10px;
  flex-shrink: 0;
}

.btn-remover:hover {
  background-color: #c0392b;
}
</style>
