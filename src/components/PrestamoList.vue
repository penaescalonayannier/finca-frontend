<template>
  <div class="prestamo-list">
    <h2>Gestion de Prestamos</h2>

    <div class="search-bar">
      <input
        v-model="searchQuery"
        placeholder="Buscar por contrato, cuenta..."
        class="search-input"
        @keyup.enter="buscarConReset"
      />
      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="mostrarModalCrear = true" class="btn-crear">Nuevo Prestamo</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando prestamos...</div>

    <table v-else class="prestamo-table">
      <thead>
        <tr>
          <th>Contrato</th>
          <th class="col-cuenta">Cuenta</th>
          <th>Toneladas Molibles</th>
          <th>Importe Aprobado</th>
          <th>Efectivo (Aprob/Util/Disp)</th>
          <th>Suministros (Aprob/Util/Disp)</th>
          <th>Seguro (Aprob/Util/Disp)</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="prestamos.length === 0">
          <td colspan="8" class="no-data">No se encontraron prestamos</td>
        </tr>
        <tr v-for="prestamo in prestamos" :key="prestamo.id">
          <td>{{ prestamo.numeroContrato }}</td>
          <td>{{ prestamo.cuenta }}</td>
          <td class="toneladas">{{ formatNumber(prestamo.toneladasMolibles) }}</td>
          <td class="importe">{{ formatCurrency(prestamo.importeAprobado) }}</td>

          <!-- Efectivo -->
          <td class="importe-triple">
            <div class="importe-linea">
              <span class="label">Aprob:</span>
              <span class="aprobado">{{ formatCurrency(prestamo.importeAprobadoEfectivo) }}</span>
            </div>
            <div class="importe-linea">
              <span class="label">Util:</span>
              <span class="utilizado">{{ formatCurrency(prestamo.importeUtilizadoEfectivo) }}</span>
            </div>
            <div class="importe-linea">
              <span class="label">Disp:</span>
              <span :class="['disponible', getDisponibleClass(calcularDisponibleEfectivo(prestamo))]">
                {{ formatCurrency(calcularDisponibleEfectivo(prestamo)) }}
              </span>
            </div>
          </td>
          
          <!-- Suministros -->
          <td class="importe-triple">
            <div class="importe-linea">
              <span class="label">Aprob:</span>
              <span class="aprobado">{{ formatCurrency(prestamo.importeAprobadoSuministros) }}</span>
            </div>
            <div class="importe-linea">
              <span class="label">Util:</span>
              <span class="utilizado">{{ formatCurrency(prestamo.importeUtilizadoSuministros) }}</span>
            </div>
            <div class="importe-linea">
              <span class="label">Disp:</span>
              <span :class="['disponible', getDisponibleClass(calcularDisponibleSuministros(prestamo))]">
                {{ formatCurrency(calcularDisponibleSuministros(prestamo)) }}
              </span>
            </div>
          </td>
          
          <!-- Seguro -->
          <td class="importe-triple">
            <div class="importe-linea">
              <span class="label">Aprob:</span>
              <span class="aprobado">{{ formatCurrency(prestamo.importeAprobadoSeguro) }}</span>
            </div>
            <div class="importe-linea">
              <span class="label">Util:</span>
              <span class="utilizado">{{ formatCurrency(prestamo.importeUtilizadoSeguro) }}</span>
            </div>
            <div class="importe-linea">
              <span class="label">Disp:</span>
              <span :class="['disponible', getDisponibleClass(calcularDisponibleSeguro(prestamo))]">
                {{ formatCurrency(calcularDisponibleSeguro(prestamo)) }}
              </span>
            </div>
          </td>

          <td class="acciones">
            <button @click="editarPrestamo(prestamo)" class="btn-editar">Editar</button>
            <button @click="abrirCrearTomaPrestamo(prestamo)" class="btn-toma">Crear Toma</button>
            <button @click="confirmarEliminar(prestamo)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && prestamos.length > 0" class="pagination">
      <div class="pagination-info">
        <span>Total: {{ totalElementos }} registros</span>
        <span class="separator">|</span>
        <label>
          Mostrar:
          <select v-model="tamanoPagina" @change="cambiarTamanoPagina" class="select-size">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button class="btn-pag" :disabled="paginaActual === 0" @click="cambiarPagina(paginaActual - 1)">
          Anterior
        </button>
        <span class="page-indicator">Pagina {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1 || totalPaginas === 0" @click="cambiarPagina(paginaActual + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <!-- Modal Crear -->
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content modal-large">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearPrestamo @created="handlePrestamoCreado" @cancel="mostrarModalCrear = false" />
      </div>
    </div>

    <!-- Modal Editar -->
    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content modal-large">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <CrearPrestamo
          :prestamo="prestamoEditando"
          @updated="handlePrestamoActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>

    <!-- Modal Crear Toma de Préstamo -->
    <div v-if="mostrarModalCrearToma" class="modal">
      <div class="modal-content">
        <span class="close" @click="cerrarModalCrearToma">&times;</span>
        <CrearTomaPrestamo
          :credito-id="prestamoSeleccionado?.id || ''"
          @saved="handleTomaPrestamoCreada"
          @cancel="cerrarModalCrearToma"
        />
      </div>
    </div>

    <!-- Modal Confirmar Eliminar -->
    <div v-if="mostrarModalEliminar" class="modal">
      <div class="modal-content modal-small">
        <h3>Confirmar Eliminacion</h3>
        <p>¿Esta seguro de eliminar el prestamo <strong>{{ prestamoEliminar?.numeroContrato }}</strong>?</p>
        <div class="modal-buttons">
          <button @click="eliminarPrestamo" class="btn-eliminar">Eliminar</button>
          <button @click="mostrarModalEliminar = false" class="btn-cancelar">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PrestamoService from '@/services/PrestamoService'
import CrearPrestamo from './CrearPrestamo.vue'
import CrearTomaPrestamo from './CrearTomaPrestamo.vue'
import type { Prestamo } from '@/types/Prestamo'
import type { SearchFilter } from '@/types/EstadoCuenta'

const router = useRouter()

const prestamos = ref<Prestamo[]>([])
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)

const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const mostrarModalEliminar = ref(false)
const mostrarModalCrearToma = ref(false)
const prestamoEditando = ref<Prestamo | null>(null)
const prestamoEliminar = ref<Prestamo | null>(null)
const prestamoSeleccionado = ref<Prestamo | null>(null)

const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

// Funciones para calcular el disponible
const calcularDisponibleEfectivo = (prestamo: Prestamo): number => {
  const aprobado = prestamo.importeAprobadoEfectivo || 0
  const utilizado = prestamo.importeUtilizadoEfectivo || 0
  return aprobado - utilizado
}

const calcularDisponibleSuministros = (prestamo: Prestamo): number => {
  const aprobado = prestamo.importeAprobadoSuministros || 0
  const utilizado = prestamo.importeUtilizadoSuministros || 0
  return aprobado - utilizado
}

const calcularDisponibleSeguro = (prestamo: Prestamo): number => {
  const aprobado = prestamo.importeAprobadoSeguro || 0
  const utilizado = prestamo.importeUtilizadoSeguro || 0
  return aprobado - utilizado
}

// Función para determinar la clase CSS según el disponible
const getDisponibleClass = (disponible: number): string => {
  if (disponible > 0) return 'disponible-positivo'
  if (disponible === 0) return 'disponible-cero'
  return 'disponible-negativo'
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value || 0)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

const cargarPrestamos = async () => {
  isLoading.value = true
  prestamos.value = []
  try {
    const filters: SearchFilter[] = []

    const response = await PrestamoService.buscarPrestamos({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
    })

    const data = response.data as Record<string, unknown>
    console.log('Respuesta prestamos:', data)

    if (data.content) {
      prestamos.value = (data.content as Prestamo[]) || []
      totalElementos.value = (data.totalElements as number) || prestamos.value.length
    } else if (data.data) {
      prestamos.value = (data.data as Prestamo[]) || []
      totalElementos.value = (data.total as number) || prestamos.value.length
    } else if (Array.isArray(data)) {
      prestamos.value = data as Prestamo[]
      totalElementos.value = prestamos.value.length
    }
  } catch (error) {
    console.error('Error al cargar prestamos:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarPrestamos()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarPrestamos()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarPrestamos()
}

const editarPrestamo = (prestamo: Prestamo) => {
  prestamoEditando.value = { ...prestamo }
  mostrarModalEditar.value = true
}

const abrirCrearTomaPrestamo = (prestamo: Prestamo) => {
  prestamoSeleccionado.value = prestamo
  mostrarModalCrearToma.value = true
}

const cerrarModalCrearToma = () => {
  mostrarModalCrearToma.value = false
  prestamoSeleccionado.value = null
}

const handleTomaPrestamoCreada = () => {
  cerrarModalCrearToma()
  cargarPrestamos() // Recargar para actualizar importes utilizados
}

const confirmarEliminar = (prestamo: Prestamo) => {
  prestamoEliminar.value = prestamo
  mostrarModalEliminar.value = true
}

const eliminarPrestamo = async () => {
  if (!prestamoEliminar.value?.id) return
  try {
    await PrestamoService.eliminarPrestamo(prestamoEliminar.value.id)
    mostrarModalEliminar.value = false
    prestamoEliminar.value = null
    cargarPrestamos()
  } catch (error) {
    console.error('Error al eliminar:', error)
    alert('Error al eliminar el prestamo')
  }
}

const handlePrestamoCreado = () => {
  mostrarModalCrear.value = false
  paginaActual.value = 0
  cargarPrestamos()
}

const handlePrestamoActualizado = () => {
  mostrarModalEditar.value = false
  cargarPrestamos()
}

onMounted(() => {
  cargarPrestamos()
})
</script>

<style scoped>
.prestamo-list {
  padding: 20px;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn-buscar {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-crear {
  background-color: #27ae60;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-buscar:hover { background-color: #2980b9; }
.btn-crear:hover { background-color: #219a52; }

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.prestamo-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85em;
}

.prestamo-table th,
.prestamo-table td {
  border: 1px solid #eee;
  padding: 8px 6px;
  text-align: left;
}

.prestamo-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  white-space: nowrap;
}

.prestamo-table tr:nth-child(even) {
  background-color: #fafafa;
}

.importe {
  text-align: right;
  font-weight: 600;
  color: #2c3e50;
}

.toneladas {
  text-align: right;
  font-weight: 500;
  color: #8e44ad;
}

/* Estilos para las columnas con triple información */
.importe-triple {
  text-align: left;
  padding: 4px 6px;
}

.importe-linea {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  font-size: 0.8em;
}

.importe-linea .label {
  font-weight: 500;
  color: #666;
  min-width: 40px;
  margin-right: 5px;
}

.importe-linea .aprobado {
  color: #27ae60;
  font-weight: 600;
  text-align: right;
  min-width: 80px;
}

.importe-linea .utilizado {
  color: #e74c3c;
  font-weight: 600;
  text-align: right;
  min-width: 80px;
}

.importe-linea .disponible {
  font-weight: 700;
  text-align: right;
  min-width: 80px;
}

/* Clases para el disponible */
.disponible-positivo {
  color: #27ae60;
}

.disponible-cero {
  color: #f39c12;
}

.disponible-negativo {
  color: #e74c3c;
  text-decoration: line-through;
}

.col-cuenta {
  min-width: 120px;
}

.acciones {
  white-space: nowrap;
  min-width: 200px;
}

.acciones button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  margin-right: 5px;
  margin-bottom: 3px;
}

.btn-editar {
  background-color: #3498db;
  color: white;
}

.btn-toma {
  background-color: #9b59b6;
  color: white;
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

.btn-editar:hover { background-color: #2980b9; }
.btn-toma:hover { background-color: #8e44ad; }
.btn-eliminar:hover { background-color: #c0392b; }

/* Paginación */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.pagination-info .separator { color: #ccc; }

.select-size {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-left: 5px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-indicator {
  padding: 0 15px;
  font-weight: 500;
}

.btn-pag {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.btn-pag:hover:not(:disabled) { background-color: #e9ecef; }
.btn-pag:disabled { background-color: #e9ecef; color: #aaa; cursor: not-allowed; }

/* Modal */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-large {
  width: 90%;
  max-width: 700px;
}

.modal-small {
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.modal-small h3 {
  margin-top: 0;
  color: #e74c3c;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancelar:hover { background-color: #7f8c8d; }

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.close:hover { color: #333; }
</style>