<!-- src/components/ListaCargos.vue -->
<template>
  <div class="lista-cargos">
    <!-- Header -->
    <div class="header">
      <h2>Gestión de Cargos</h2>
      <button @click="irACrear" class="btn-crear">+ Nuevo Cargo</button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>

    <!-- Table -->
    <div v-else-if="cargos.length > 0" class="tabla-contenedor">
      <table class="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Salario Escala</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cargo in cargos" :key="cargo.id">
            <td>{{ cargo.name }}</td>
            <td>{{ cargo.description || '-' }}</td>
            <td>{{ cargo.salarioEscala ? `$${cargo.salarioEscala.toFixed(2)}` : '-' }}</td>
            <td class="acciones">
              <button @click="abrirModalAsignar(cargo)" class="btn-asignar" title="Asignar Trabajador">👤</button>
              <button @click="irAEditar(cargo.id)" class="btn-editar" title="Editar">✏️</button>
              <button @click="confirmarEliminar(cargo)" class="btn-eliminar" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin datos -->
    <div v-else class="sin-datos">
      <p>No hay cargos registrados</p>
    </div>

    <!-- Modal confirmación eliminar -->
    <div v-if="cargoAEliminar" class="modal-overlay" @click="cargoAEliminar = null">
      <div class="modal" @click.stop>
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar el cargo "{{ cargoAEliminar.name }}"?</p>
        <div class="modal-acciones">
          <button @click="eliminarCargo" class="btn-confirmar">Eliminar</button>
          <button @click="cargoAEliminar = null" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal asignar trabajador -->
    <div v-if="cargoSeleccionado" class="modal-overlay" @click="cargoSeleccionado = null">
      <div class="modal modal-asignar" @click.stop>
        <h3>Asignar Trabajador a: {{ cargoSeleccionado.name }}</h3>

        <div v-if="cargandoTrabajadores" class="loading-small">
          <p>Cargando trabajadores...</p>
        </div>

        <div v-else class="modal-contenido">
          <input
            v-model="filtroTrabajador"
            type="text"
            placeholder="Buscar trabajador..."
            class="input-buscar"
          />

          <div class="lista-trabajadores">
            <div v-if="trabajadoresFiltrados.length === 0" class="sin-trabajadores">
              <p>No hay trabajadores disponibles</p>
            </div>
            <div v-for="trab in trabajadoresFiltrados" :key="trab.id" class="item-trabajador">
              <div class="info-trabajador">
                <strong>{{ trab.nombre }}</strong>
                <span class="badge">{{ trab.ruc }}</span>
              </div>
              <button @click="asignarCargo(trab)" class="btn-asignar-item" :disabled="isAsignando">
                {{ isAsignando ? 'Asignando...' : 'Asignar' }}
              </button>
            </div>
          </div>
        </div>

        <div class="modal-acciones">
          <button @click="cargoSeleccionado = null" class="btn-cancelar">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import CargoService from '@/services/CargoService'
import TrabajadorService from '@/services/TrabajadorService'
import type { CargoEntity } from '@/types/Cargo'
import type { Trabajador } from '@/types/Trabajador'

const router = useRouter()

const cargos = ref<CargoEntity[]>([])
const isLoading = ref(false)
const cargoAEliminar = ref<CargoEntity | null>(null)
const cargoSeleccionado = ref<CargoEntity | null>(null)
const trabajadores = ref<Trabajador[]>([])
const cargandoTrabajadores = ref(false)
const isAsignando = ref(false)
const filtroTrabajador = ref('')

const trabajadoresFiltrados = computed(() => {
  return trabajadores.value.filter(trab =>
    trab.nombre.toLowerCase().includes(filtroTrabajador.value.toLowerCase()) ||
    trab.ruc.toLowerCase().includes(filtroTrabajador.value.toLowerCase())
  )
})

const cargarCargos = async () => {
  isLoading.value = true
  try {
    const response = await CargoService.getAll()
    cargos.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar cargos:', error)
  } finally {
    isLoading.value = false
  }
}

const irACrear = () => {
  router.push('/crear-cargo')
}

const irAEditar = (id: string) => {
  router.push(`/editar-cargo/${id}`)
}

const confirmarEliminar = (cargo: CargoEntity) => {
  cargoAEliminar.value = cargo
}

const eliminarCargo = async () => {
  if (!cargoAEliminar.value) return

  try {
    await CargoService.delete(cargoAEliminar.value.id)
    cargoAEliminar.value = null
    cargarCargos()
  } catch (error) {
    console.error('Error al eliminar cargo:', error)
  }
}

const abrirModalAsignar = async (cargo: CargoEntity) => {
  cargoSeleccionado.value = cargo
  cargandoTrabajadores.value = true
  filtroTrabajador.value = ''

  try {
    const response = await TrabajadorService.getAll()
    trabajadores.value = response.data.data || response.data.content || []
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  } finally {
    cargandoTrabajadores.value = false
  }
}

const asignarCargo = async (trabajador: Trabajador) => {
  if (!cargoSeleccionado.value || !trabajador.id) return

  isAsignando.value = true
  try {
    await TrabajadorService.asignarCargo(trabajador.id, cargoSeleccionado.value.id)
    cargoSeleccionado.value = null
    filtroTrabajador.value = ''
  } catch (error) {
    console.error('Error al asignar cargo:', error)
  } finally {
    isAsignando.value = false
  }
}

onMounted(() => {
  cargarCargos()
})
</script>

<style scoped>
.lista-cargos {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h2 {
  margin: 0;
  color: #2c3e50;
}

.btn-crear {
  padding: 10px 20px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-crear:hover {
  background-color: #229954;
}

.tabla-contenedor {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
}

.tabla thead {
  background-color: #34495e;
  color: white;
}

.tabla th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

.tabla td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla tbody tr:hover {
  background-color: #f8f9fa;
}

.acciones {
  display: flex;
  gap: 10px;
}

.btn-editar,
.btn-eliminar {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-editar:hover {
  background-color: #3498db;
}

.btn-eliminar:hover {
  background-color: #e74c3c;
}

.loading,
.sin-datos {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 400px;
}

.modal h3 {
  margin-top: 0;
  color: #2c3e50;
}

.modal-acciones {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.btn-confirmar {
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirmar:hover {
  background-color: #c0392b;
}

.btn-cancelar {
  padding: 10px 20px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}

.btn-asignar {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-asignar:hover {
  background-color: #9b59b6;
}

.modal-asignar {
  max-width: 500px;
}

.modal-contenido {
  margin: 20px 0;
}

.input-buscar {
  width: 100%;
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 0.95em;
  margin-bottom: 15px;
}

.input-buscar:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.lista-trabajadores {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ecf0f1;
  border-radius: 4px;
}

.item-trabajador {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s;
}

.item-trabajador:hover {
  background-color: #f8f9fa;
}

.info-trabajador {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.badge {
  font-size: 0.85em;
  color: #7f8c8d;
  font-weight: normal;
}

.btn-asignar-item {
  padding: 8px 15px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: background-color 0.3s;
}

.btn-asignar-item:hover:not(:disabled) {
  background-color: #229954;
}

.btn-asignar-item:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.sin-trabajadores {
  padding: 40px 20px;
  text-align: center;
  color: #7f8c8d;
}

.loading-small {
  padding: 20px;
  text-align: center;
  color: #7f8c8d;
}
</style>
