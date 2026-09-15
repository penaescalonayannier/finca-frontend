<!-- src/components/ListaGrupos.vue -->
<template>
  <div class="lista-grupos">
    <!-- Header -->
    <div class="header">
      <h2>Gestión de Grupos</h2>
      <div class="header-acciones">
        <button
          v-if="trabajadoresSinGrupo.length > 0"
          @click="mostrarSinGrupo = true"
          class="btn-sin-grupo"
        >
          <span class="badge-alerta">{{ trabajadoresSinGrupo.length }}</span>
          Sin grupo
        </button>
        <button @click="irACrear" class="btn-crear">+ Nuevo Grupo</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>

    <!-- Table -->
    <div v-else-if="grupos.length > 0" class="tabla-contenedor">
      <table class="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th class="col-cantidad">Trabajadores</th>
            <th>Jefe</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="grupo in grupos" :key="grupo.id">
            <td>{{ grupo.nombre }}</td>
            <td>{{ grupo.descripcion || '-' }}</td>
            <td class="col-cantidad">
              <span class="badge-cantidad">{{ (grupo.trabajadores?.length || 0) + (grupo.jefe ? 1 : 0) }}</span>
            </td>
            <td class="jefe-celda">
              <div v-if="grupo.jefe" class="jefe-info">
                <div class="jefe-nombre">{{ grupo.jefe.nombre }}</div>
                <div class="jefe-cargo">{{ grupo.jefe.cargoName || 'Sin cargo' }}</div>
              </div>
              <div v-else class="sin-jefe">-</div>
            </td>
            <td class="acciones">
              <button @click="abrirDetalles(grupo)" class="btn-detalles" title="Ver detalles">👁️</button>
              <button @click="abrirEditar(grupo)" class="btn-editar" title="Editar">✏️</button>
              <button @click="confirmarEliminar(grupo)" class="btn-eliminar" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="fila-total">
            <td colspan="2" class="total-label">Total</td>
            <td class="col-cantidad">
              <span class="badge-total">{{ totalTrabajadores }}</span>
              <span
                class="tooltip-ayuda"
                title="No incluye a los jefes de grupo porque ya están contados como trabajadores en su grupo (ej: Dirección)"
              >?</span>
            </td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Sin datos -->
    <div v-else class="sin-datos">
      <p>No hay grupos registrados</p>
    </div>

    <!-- Modal confirmación eliminar -->
    <div v-if="grupoAEliminar" class="modal-overlay" @click="!eliminandoGrupo && (grupoAEliminar = null)">
      <div class="modal" @click.stop>
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar el grupo "{{ grupoAEliminar.nombre }}"?</p>
        <p v-if="grupoAEliminar.trabajadores?.length" class="modal-advertencia">
          ⚠️ Este grupo tiene {{ grupoAEliminar.trabajadores.length }} trabajadores asignados.
        </p>
        <div class="modal-acciones">
          <button @click="eliminarGrupo" class="btn-confirmar" :disabled="eliminandoGrupo">
            {{ eliminandoGrupo ? 'Eliminando...' : 'Eliminar' }}
          </button>
          <button @click="grupoAEliminar = null" class="btn-cancelar" :disabled="eliminandoGrupo">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal editar grupo -->
    <div v-if="grupoEditar" class="modal-overlay" @click="cerrarEditar">
      <div class="modal modal-editar" @click.stop>
        <h3>Editar Grupo</h3>
        <form @submit.prevent="guardarEdicion">
          <div class="form-group">
            <label>Nombre *</label>
            <input v-model="formularioEditar.nombre" type="text" required />
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea v-model="formularioEditar.descripcion" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Jefe del Grupo *</label>
            <select v-model="formularioEditar.jefeId" required>
              <option value="">Seleccione un jefe</option>
              <option v-for="trab in todosLosTrabajadores" :key="trab.id" :value="trab.id">
                {{ trab.nombre }} - {{ trab.ruc }}
              </option>
            </select>
          </div>
          <div class="modal-acciones">
            <button type="submit" class="btn-guardar" :disabled="guardandoEdicion">
              {{ guardandoEdicion ? 'Guardando...' : 'Guardar' }}
            </button>
            <button type="button" @click="cerrarEditar" class="btn-cancelar">Cancelar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal detalles del grupo -->
    <div v-if="grupoDetalles" class="modal-overlay" @click="grupoDetalles = null">
      <div class="modal modal-detalles" @click.stop>
        <h3>{{ grupoDetalles.nombre }}</h3>

        <div class="detalles-section">
          <h4>Información General</h4>
          <div class="info-row">
            <label>Descripción:</label>
            <span>{{ grupoDetalles.descripcion || '-' }}</span>
          </div>
        </div>

        <div class="detalles-section">
          <div class="section-header">
            <h4>Trabajadores Asignados ({{ (grupoDetalles.trabajadores?.length || 0) + (grupoDetalles.jefe ? 1 : 0) }})</h4>
            <button @click="toggleAgregarTrabajador" class="btn-agregar-trabajador">
              {{ mostrarAgregarTrabajador ? '✕ Cancelar' : '+ Agregar' }}
            </button>
          </div>

          <!-- Panel para agregar trabajadores -->
          <div v-if="mostrarAgregarTrabajador" class="agregar-trabajador-panel">
            <div v-if="cargandoTrabajadores" class="loading-small">Cargando trabajadores...</div>
            <template v-else>
              <div class="lista-trabajadores-checkbox">
                <label
                  v-for="trab in trabajadoresDisponibles"
                  :key="trab.id"
                  class="trabajador-checkbox-item"
                  :class="{ 'tiene-grupo': trab.grupoName }"
                >
                  <input
                    type="checkbox"
                    :value="trab.id"
                    v-model="trabajadoresSeleccionados"
                  />
                  <div class="trab-info">
                    <div class="trab-nombre">{{ trab.nombre }}</div>
                    <div class="trab-ruc">RUC: {{ trab.ruc }}</div>
                    <div v-if="trab.grupoName" class="trab-grupo-actual">⚠️ Grupo: {{ trab.grupoName }}</div>
                  </div>
                </label>
              </div>
              <div v-if="trabajadoresDisponibles.length === 0" class="sin-resultados">
                No hay trabajadores disponibles
              </div>
              <div v-if="trabajadoresSeleccionados.length > 0" class="acciones-agregar">
                <span class="seleccionados-count">{{ trabajadoresSeleccionados.length }} seleccionado(s)</span>
                <button @click="confirmarAgregarTrabajadores" class="btn-agregar-seleccionados">
                  Agregar al grupo
                </button>
              </div>
            </template>
          </div>

          <div v-if="grupoDetalles.trabajadores && grupoDetalles.trabajadores.length > 0" class="trabajadores-detalle">
            <div v-for="trab in grupoDetalles.trabajadores" :key="trab.id" class="trabajador-detalle">
              <div class="trab-info">
                <div class="trab-nombre">{{ trab.nombre }}</div>
                <div class="trab-ruc">RUC: {{ trab.ruc }}</div>
                <div v-if="trab.cargoName" class="trab-cargo">{{ trab.cargoName }}</div>
              </div>
              <button
                @click="confirmarQuitarTrabajador(trab)"
                class="btn-quitar-trabajador"
                title="Quitar del grupo"
              >
                ❌
              </button>
            </div>
          </div>
          <div v-else class="sin-trabajadores-detalle">
            <p>Este grupo no tiene trabajadores asignados</p>
          </div>
        </div>

        <div class="detalles-section jefe-section">
          <h4>Jefe del Grupo</h4>
          <div v-if="grupoDetalles.jefe" class="jefe-detalle">
            <div class="jefe-detalle-nombre">{{ grupoDetalles.jefe.nombre }}</div>
            <div class="jefe-detalle-info">
              <span class="info-item">RUC: {{ grupoDetalles.jefe.ruc }}</span>
              <span v-if="grupoDetalles.jefe.cargoName" class="info-item">{{ grupoDetalles.jefe.cargoName }}</span>
            </div>
          </div>
          <div v-else class="sin-jefe-detalle">
            Sin jefe asignado
          </div>
        </div>

        <div class="modal-acciones">
          <button @click="cerrarModalDetalles" class="btn-cancelar">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal confirmar agregar trabajadores al grupo -->
    <div v-if="trabajadoresAAgregar.length > 0" class="modal-overlay" @click="trabajadoresAAgregar = []">
      <div class="modal modal-agregar-multiple" @click.stop>
        <h3>Agregar trabajadores al grupo</h3>
        <p>¿Agregar {{ trabajadoresAAgregar.length }} trabajador(es) al grupo <strong>{{ grupoDetalles?.nombre }}</strong>?</p>
        <div class="lista-a-agregar">
          <div v-for="trab in trabajadoresAAgregar" :key="trab.id" class="item-a-agregar">
            <span class="nombre">{{ trab.nombre }}</span>
            <span v-if="trab.grupoName" class="advertencia-grupo">⚠️ Sale de: {{ trab.grupoName }}</span>
          </div>
        </div>
        <div class="modal-acciones">
          <button @click="agregarTrabajadoresAlGrupo" class="btn-confirmar-agregar" :disabled="agregandoTrabajador">
            {{ agregandoTrabajador ? 'Agregando...' : 'Confirmar' }}
          </button>
          <button @click="trabajadoresAAgregar = []" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal confirmar quitar trabajador del grupo -->
    <div v-if="trabajadorAQuitar" class="modal-overlay" @click="trabajadorAQuitar = null">
      <div class="modal" @click.stop>
        <h3>Quitar trabajador del grupo</h3>
        <p>¿Estás seguro de que deseas quitar a <strong>{{ trabajadorAQuitar.nombre }}</strong> del grupo?</p>
        <p class="modal-nota">El trabajador no será eliminado, solo se quitará de este grupo.</p>
        <div class="modal-acciones">
          <button @click="quitarTrabajadorDelGrupo" class="btn-confirmar" :disabled="quitandoTrabajador">
            {{ quitandoTrabajador ? 'Quitando...' : 'Quitar' }}
          </button>
          <button @click="trabajadorAQuitar = null" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Modal evaluación de trabajadores -->
    <CrearEvaluacion
      :grupo="grupoParaEvaluar"
      @close="cerrarEvaluacion"
      @save="cerrarEvaluacion"
    />

    <!-- Modal trabajadores sin grupo -->
    <div v-if="mostrarSinGrupo" class="modal-overlay" @click="mostrarSinGrupo = false">
      <div class="modal modal-sin-grupo" @click.stop>
        <h3>Trabajadores sin grupo ({{ trabajadoresSinGrupo.length }})</h3>
        <div class="lista-sin-grupo">
          <div v-if="trabajadoresSinGrupo.length === 0" class="sin-resultados">
            Todos los trabajadores tienen grupo asignado
          </div>
          <div v-else class="tabla-contenedor">
            <table class="tabla tabla-compacta">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUC</th>
                  <th>Cargo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="trab in trabajadoresSinGrupo" :key="trab.id">
                  <td>{{ trab.nombre }}</td>
                  <td>{{ trab.ruc }}</td>
                  <td>{{ trab.cargoName || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-acciones">
          <button @click="mostrarSinGrupo = false" class="btn-cancelar">Cerrar</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GrupoService from '@/services/GrupoService'
import TrabajadorService from '@/services/TrabajadorService'
import CrearEvaluacion from './CrearEvaluacion.vue'
import type { Grupo } from '@/types/Grupo'
import type { Trabajador } from '@/types/Trabajador'

const router = useRouter()

const grupos = ref<Grupo[]>([])
const isLoading = ref(false)
const grupoAEliminar = ref<Grupo | null>(null)
const grupoDetalles = ref<Grupo | null>(null)
const grupoParaEvaluar = ref<Grupo | null>(null)
const trabajadorAQuitar = ref<Trabajador | null>(null)
const quitandoTrabajador = ref(false)
const mostrarAgregarTrabajador = ref(false)
const trabajadoresDisponibles = ref<Trabajador[]>([])
const cargandoTrabajadores = ref(false)
const trabajadoresSeleccionados = ref<string[]>([])
const trabajadoresAAgregar = ref<Trabajador[]>([])
const agregandoTrabajador = ref(false)
const grupoEditar = ref<Grupo | null>(null)
const formularioEditar = ref({ nombre: '', descripcion: '', jefeId: '' })
const guardandoEdicion = ref(false)
const todosLosTrabajadores = ref<Trabajador[]>([])

// Computed: total de trabajadores (sin contar jefes, ya están en Dirección)
const totalTrabajadores = computed(() => {
  return grupos.value.reduce((total, grupo) => {
    return total + (grupo.trabajadores?.length || 0)
  }, 0)
})

// Trabajadores sin grupo
const mostrarSinGrupo = ref(false)
const trabajadoresSinGrupo = computed(() => {
  return todosLosTrabajadores.value.filter(t => !t.grupoId && t.activo !== false)
})

const cargarTodosLosTrabajadores = async () => {
  try {
    const response = await TrabajadorService.getAll()
    todosLosTrabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error cargando trabajadores:', error)
  }
}

const cargarGrupos = async () => {
  isLoading.value = true
  try {
    const response = await GrupoService.getAll()
    grupos.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar grupos:', error)
  } finally {
    isLoading.value = false
  }
}

const irACrear = () => {
  router.push('/crear-grupo')
}

const abrirEditar = async (grupo: Grupo) => {
  grupoEditar.value = grupo
  formularioEditar.value = {
    nombre: grupo.nombre,
    descripcion: grupo.descripcion || '',
    jefeId: grupo.jefeId || ''
  }
  if (todosLosTrabajadores.value.length === 0) {
    await cargarTodosLosTrabajadores()
  }
}

const cerrarEditar = () => {
  grupoEditar.value = null
  formularioEditar.value = { nombre: '', descripcion: '', jefeId: '' }
}

const guardarEdicion = async () => {
  if (!grupoEditar.value || !formularioEditar.value.nombre || !formularioEditar.value.jefeId) return

  guardandoEdicion.value = true
  try {
    await GrupoService.update(grupoEditar.value.id, {
      id: grupoEditar.value.id,
      nombre: formularioEditar.value.nombre,
      descripcion: formularioEditar.value.descripcion,
      jefeId: formularioEditar.value.jefeId
    })
    cerrarEditar()
    await cargarGrupos()
  } catch (error) {
    console.error('Error al actualizar grupo:', error)
    alert('Error al actualizar el grupo')
  } finally {
    guardandoEdicion.value = false
  }
}

const abrirDetalles = (grupo: Grupo) => {
  grupoDetalles.value = grupo
}

const confirmarEliminar = (grupo: Grupo) => {
  grupoAEliminar.value = grupo
}

const abrirEvaluacion = (grupo: Grupo) => {
  grupoParaEvaluar.value = grupo
}

const cerrarEvaluacion = () => {
  grupoParaEvaluar.value = null
}

const abrirEvaluaciones = (grupo: Grupo) => {
  router.push({
    name: 'ListarEvaluaciones',
    params: {
      grupoId: grupo.id,
      grupoNombre: grupo.nombre
    }
  })
}

const eliminandoGrupo = ref(false)

const eliminarGrupo = async () => {
  if (!grupoAEliminar.value) return

  eliminandoGrupo.value = true
  try {
    await GrupoService.delete(grupoAEliminar.value.id)
    grupoAEliminar.value = null
    await cargarGrupos()
  } catch (error: any) {
    console.error('Error al eliminar grupo:', error)
    const mensaje = error.response?.data?.message || error.message || 'Error desconocido'
    alert(`No se pudo eliminar el grupo: ${mensaje}`)
  } finally {
    eliminandoGrupo.value = false
  }
}

const confirmarQuitarTrabajador = (trabajador: Trabajador) => {
  trabajadorAQuitar.value = trabajador
}

const quitarTrabajadorDelGrupo = async () => {
  if (!trabajadorAQuitar.value || !grupoDetalles.value) return

  quitandoTrabajador.value = true
  try {
    await TrabajadorService.quitarGrupo(trabajadorAQuitar.value.id)

    // Actualizar la lista local de trabajadores
    if (grupoDetalles.value.trabajadores) {
      grupoDetalles.value.trabajadores = grupoDetalles.value.trabajadores.filter(
        t => t.id !== trabajadorAQuitar.value?.id
      )
    }

    trabajadorAQuitar.value = null
    // Recargar grupos para actualizar los datos
    cargarGrupos()
  } catch (error) {
    console.error('Error al quitar trabajador del grupo:', error)
    alert('Error al quitar el trabajador del grupo')
  } finally {
    quitandoTrabajador.value = false
  }
}

const cargarTrabajadoresDisponibles = async () => {
  cargandoTrabajadores.value = true
  try {
    const response = await TrabajadorService.getAll()
    // Filtrar los que ya están en este grupo
    const idsEnGrupo = grupoDetalles.value?.trabajadores?.map(t => t.id) || []
    trabajadoresDisponibles.value = (response.data.data || []).filter(
      t => !idsEnGrupo.includes(t.id)
    )
  } catch (error) {
    console.error('Error cargando trabajadores:', error)
  } finally {
    cargandoTrabajadores.value = false
  }
}

const abrirPanelAgregar = () => {
  mostrarAgregarTrabajador.value = true
  trabajadoresSeleccionados.value = []
  cargarTrabajadoresDisponibles()
}

const confirmarAgregarTrabajadores = () => {
  const seleccionados = trabajadoresDisponibles.value.filter(
    t => trabajadoresSeleccionados.value.includes(t.id)
  )
  trabajadoresAAgregar.value = seleccionados
}

const agregarTrabajadoresAlGrupo = async () => {
  if (trabajadoresAAgregar.value.length === 0 || !grupoDetalles.value) return

  agregandoTrabajador.value = true
  try {
    // Agregar cada trabajador al grupo
    for (const trab of trabajadoresAAgregar.value) {
      await TrabajadorService.asignarGrupo(trab.id, grupoDetalles.value.id)
    }

    // Limpiar y cerrar
    trabajadoresAAgregar.value = []
    trabajadoresSeleccionados.value = []
    mostrarAgregarTrabajador.value = false
    trabajadoresDisponibles.value = []

    // Recargar datos
    await cargarGrupos()

    // Actualizar el modal con el grupo actualizado
    const grupoActualizado = grupos.value.find(g => g.id === grupoDetalles.value?.id)
    if (grupoActualizado) {
      grupoDetalles.value = grupoActualizado
    }
  } catch (error) {
    console.error('Error al agregar trabajadores al grupo:', error)
    alert('Error al agregar los trabajadores al grupo')
  } finally {
    agregandoTrabajador.value = false
  }
}

const toggleAgregarTrabajador = () => {
  if (mostrarAgregarTrabajador.value) {
    mostrarAgregarTrabajador.value = false
    trabajadoresSeleccionados.value = []
    trabajadoresDisponibles.value = []
  } else {
    abrirPanelAgregar()
  }
}

const cerrarModalDetalles = () => {
  grupoDetalles.value = null
  mostrarAgregarTrabajador.value = false
  trabajadoresSeleccionados.value = []
  trabajadoresDisponibles.value = []
}


onMounted(async () => {
  await Promise.all([cargarGrupos(), cargarTodosLosTrabajadores()])
})
</script>

<style scoped>
.lista-grupos {
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
.btn-eliminar,
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
  background-color: #3498db;
}

.btn-editar:hover {
  background-color: #f39c12;
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
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  transition: background-color 0.3s;
}

.btn-asignar-item:hover:not(:disabled) {
  background-color: #2980b9;
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

.btn-detalles,
.btn-evaluar,
.btn-evaluaciones {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-detalles:hover {
  background-color: #e8f4f8;
}

.btn-evaluar:hover {
  background-color: #fff3cd;
}

.btn-evaluaciones:hover {
  background-color: #e8f8f5;
}

.col-cantidad {
  text-align: center;
  width: 100px;
}

.badge-cantidad {
  display: inline-block;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9em;
  min-width: 35px;
}

.fila-total {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
}

.fila-total td {
  color: white;
  font-weight: 600;
  padding: 12px 15px;
  border-bottom: none;
}

.total-label {
  text-align: right;
  font-size: 1.05em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-total {
  display: inline-block;
  background: white;
  color: #2c3e50;
  padding: 6px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1em;
  min-width: 40px;
}

.jefe-celda {
  max-width: 200px;
}

.jefe-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.jefe-nombre {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95em;
}

.jefe-cargo {
  font-size: 0.8em;
  color: #7f8c8d;
}

.sin-jefe {
  color: #95a5a6;
  font-style: italic;
}

.modal-detalles {
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-detalles h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.detalles-section {
  margin-bottom: 30px;
}

.detalles-section h4 {
  color: #34495e;
  font-size: 1.1em;
  margin-bottom: 15px;
  border-left: 4px solid #3498db;
  padding-left: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #ecf0f1;
}

.info-row label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 120px;
}

.info-row span {
  color: #555;
  text-align: right;
}

.trabajadores-detalle {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.trabajador-detalle {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #27ae60;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-quitar-trabajador {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1em;
  padding: 5px 8px;
  border-radius: 4px;
  opacity: 0.6;
  transition: opacity 0.2s, background-color 0.2s;
}

.btn-quitar-trabajador:hover {
  opacity: 1;
  background-color: #fee2e2;
}

.modal-nota {
  font-size: 0.9em;
  color: #6b7280;
  font-style: italic;
  margin-top: -5px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
}

.btn-agregar-trabajador {
  padding: 6px 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
}

.btn-agregar-trabajador:hover {
  background-color: #229954;
}

.agregar-trabajador-panel {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.lista-trabajadores-checkbox {
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: white;
}

.trabajador-checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.trabajador-checkbox-item:hover {
  background-color: #f0fdf4;
}

.trabajador-checkbox-item:last-child {
  border-bottom: none;
}

.trabajador-checkbox-item.tiene-grupo {
  background-color: #fffbeb;
}

.trabajador-checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.trab-grupo-actual {
  font-size: 0.8em;
  color: #f59e0b;
  font-style: italic;
}

.acciones-agregar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.seleccionados-count {
  font-size: 0.9em;
  color: #374151;
  font-weight: 500;
}

.btn-agregar-seleccionados {
  padding: 8px 16px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
}

.btn-agregar-seleccionados:hover {
  background-color: #229954;
}

.modal-agregar-multiple {
  max-width: 500px;
}

.lista-a-agregar {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  margin: 15px 0;
}

.item-a-agregar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
}

.item-a-agregar:last-child {
  border-bottom: none;
}

.item-a-agregar .nombre {
  font-weight: 500;
}

.item-a-agregar .advertencia-grupo {
  font-size: 0.8em;
  color: #f59e0b;
}

.sin-resultados {
  text-align: center;
  padding: 15px;
  color: #6b7280;
  font-style: italic;
}

.modal-advertencia {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 4px;
  padding: 10px;
  color: #92400e;
  font-size: 0.9em;
}

.btn-confirmar-agregar {
  padding: 10px 20px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-confirmar-agregar:hover {
  background-color: #229954;
}

.btn-confirmar-agregar:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.trab-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.trab-nombre {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95em;
}

.trab-ruc {
  font-size: 0.85em;
  color: #7f8c8d;
}

.trab-cargo {
  font-size: 0.8em;
  color: #3498db;
  font-style: italic;
}

.sin-trabajadores-detalle {
  padding: 20px;
  text-align: center;
  background-color: #ecf0f1;
  border-radius: 6px;
  color: #7f8c8d;
}

.jefe-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 8px;
  color: white;
}

.jefe-section h4 {
  color: white;
  border-left-color: rgba(255, 255, 255, 0.3);
  margin-top: 0;
}

.jefe-detalle {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.jefe-detalle-nombre {
  font-size: 1.3em;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.jefe-detalle-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  font-size: 0.95em;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
}

.sin-jefe-detalle {
  padding: 15px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  font-style: italic;
  color: rgba(255, 255, 255, 0.8);
}

.modal-editar {
  max-width: 500px;
  width: 90%;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #374151;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95em;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.btn-guardar {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-guardar:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Header acciones */
.header-acciones {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-sin-grupo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f59e0b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-sin-grupo:hover {
  background-color: #d97706;
}

.badge-alerta {
  background: white;
  color: #f59e0b;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9em;
}

/* Modal sin grupo */
.modal-sin-grupo {
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
}

.lista-sin-grupo {
  max-height: 400px;
  overflow-y: auto;
  margin: 15px 0;
}

.tabla-compacta {
  font-size: 0.95em;
}

.tabla-compacta th,
.tabla-compacta td {
  padding: 10px 12px;
}

/* Tooltip de ayuda */
.tooltip-ayuda {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #3498db;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  margin-left: 8px;
  cursor: help;
  vertical-align: middle;
}

.tooltip-ayuda:hover {
  background-color: #2980b9;
}
</style>
