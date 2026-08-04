<!-- src/components/ListaGrupos.vue -->
<template>
  <div class="lista-grupos">
    <!-- Header -->
    <div class="header">
      <h2>Gestión de Grupos</h2>
      <button @click="irACrear" class="btn-crear">+ Nuevo Grupo</button>
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
            <th>Jefe</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="grupo in grupos" :key="grupo.id">
            <td>{{ grupo.nombre }}</td>
            <td>{{ grupo.descripcion || '-' }}</td>
            <td class="jefe-celda">
              <div v-if="grupo.jefe" class="jefe-info">
                <div class="jefe-nombre">{{ grupo.jefe.nombre }}</div>
                <div class="jefe-cargo">{{ grupo.jefe.cargoName || 'Sin cargo' }}</div>
              </div>
              <div v-else class="sin-jefe">-</div>
            </td>
            <td class="acciones">
              <button @click="abrirDetalles(grupo)" class="btn-detalles" title="Ver detalles">👁️</button>
              <button @click="abrirEvaluacion(grupo)" class="btn-evaluar" title="Crear evaluación">📊</button>
              <button @click="abrirEvaluaciones(grupo)" class="btn-evaluaciones" title="Ver evaluaciones">📋</button>
              <button @click="irAEditar(grupo.id)" class="btn-editar" title="Editar">✏️</button>
              <button @click="confirmarEliminar(grupo)" class="btn-eliminar" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin datos -->
    <div v-else class="sin-datos">
      <p>No hay grupos registrados</p>
    </div>

    <!-- Modal confirmación eliminar -->
    <div v-if="grupoAEliminar" class="modal-overlay" @click="grupoAEliminar = null">
      <div class="modal" @click.stop>
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar el grupo "{{ grupoAEliminar.nombre }}"?</p>
        <div class="modal-acciones">
          <button @click="eliminarGrupo" class="btn-confirmar">Eliminar</button>
          <button @click="grupoAEliminar = null" class="btn-cancelar">Cancelar</button>
        </div>
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

        <div class="detalles-section">
          <h4>Trabajadores Asignados ({{ grupoDetalles.trabajadores?.length || 0 }})</h4>
          <div v-if="grupoDetalles.trabajadores && grupoDetalles.trabajadores.length > 0" class="trabajadores-detalle">
            <div v-for="trab in grupoDetalles.trabajadores" :key="trab.id" class="trabajador-detalle">
              <div class="trab-info">
                <div class="trab-nombre">{{ trab.nombre }}</div>
                <div class="trab-ruc">RUC: {{ trab.ruc }}</div>
                <div v-if="trab.cargoName" class="trab-cargo">{{ trab.cargoName }}</div>
              </div>
            </div>
          </div>
          <div v-else class="sin-trabajadores-detalle">
            <p>Este grupo no tiene trabajadores asignados</p>
          </div>
        </div>

        <div class="modal-acciones">
          <button @click="grupoDetalles = null" class="btn-cancelar">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal evaluación de trabajadores -->
    <CrearEvaluacion
      :grupo="grupoParaEvaluar"
      @close="cerrarEvaluacion"
      @save="cerrarEvaluacion"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import GrupoService from '@/services/GrupoService'
import CrearEvaluacion from './CrearEvaluacion.vue'
import type { Grupo } from '@/types/Grupo'

const router = useRouter()

const grupos = ref<Grupo[]>([])
const isLoading = ref(false)
const grupoAEliminar = ref<Grupo | null>(null)
const grupoDetalles = ref<Grupo | null>(null)
const grupoParaEvaluar = ref<Grupo | null>(null)

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

const irAEditar = (id: string) => {
  router.push(`/editar-grupo/${id}`)
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

const eliminarGrupo = async () => {
  if (!grupoAEliminar.value) return

  try {
    await GrupoService.delete(grupoAEliminar.value.id)
    grupoAEliminar.value = null
    cargarGrupos()
  } catch (error) {
    console.error('Error al eliminar grupo:', error)
  }
}


onMounted(() => {
  cargarGrupos()
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
</style>
