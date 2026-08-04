<template>
  <div class="estado-cuenta-list">
    <h2>Estados de Cuenta</h2>

    <div class="resumen-totales">
      <div class="total-card credito">
        <h3>Total Creditos (Cr)</h3>
        <p>{{ formatCurrency(totalCreditos) }}</p>
      </div>
      <div class="total-card debito">
        <h3>Total Debitos (Db)</h3>
        <p>{{ formatCurrency(totalDebitos) }}</p>
      </div>
    </div>

    <div class="importe-cuenta-110">
      <h3>SALDO ACTUAL - CUENTA 110 (Efectivo Banco)</h3>
      <p class="saldo-valor">{{ formatCurrency(importeCuenta110) }}</p>
    </div>
    <div class="search-bar">
      <input
        v-model="fechaInicio"
        type="date"
        placeholder="Fecha Inicio"
        class="search-input-date"
      />
      <input
        v-model="fechaFin"
        type="date"
        placeholder="Fecha Fin"
        class="search-input-date"
      />

      <select v-model="filterTipo" class="search-input-select">
        <option value="">Todos los Tipos</option>
        <option value="Cr">Creditos (Cr)</option>
        <option value="Db">Debitos (Db)</option>
      </select>

      <input
        v-model="searchQuery"
        placeholder="Buscar..."
        class="search-input"
      />

      <button @click="buscarConReset" class="btn-buscar">Buscar</button>
      <button @click="goToUploadView" class="btn-upload-xml">Cargar XML</button>
      <button @click="exportarAExcel" class="btn-exportar">Exportar Excel</button> 
      <button @click="mostrarModalCrear = true" class="btn-crear">Crear Nuevo</button>
    </div>

    <div v-if="isLoading" class="loading">Cargando...</div>

    <table v-else class="estado-cuenta-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Cliente</th>
          <th>Ref. Origen</th>
          <th>Ref. Corriente</th>
          <th>Observaciones</th>
          <th>Importe</th>
          <th>Tipo</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="estadosCuenta.length === 0">
          <td colspan="8" class="no-data">No se encontraron registros</td>
        </tr>
        <tr v-for="estado in estadosCuenta" :key="estado.id">
          <td>{{ estado.fecha }}</td>
          <td class="cliente-cell">{{ getClienteNombre(estado.clienteId) }}</td>
          <td>{{ estado.refOrigen }}</td>
          <td>{{ estado.refCorriente }}</td>
          <td>{{ estado.observaciones }}</td>
          <td class="importe">{{ formatCurrency(estado.importe) }}</td>
          <td>
            <span :class="['tipo-badge', estado.tipo === 'Cr' ? 'credito' : 'debito']">
              {{ estado.tipo }}
            </span>
          </td>
          <td class="acciones">
            <button @click="editarEstadoCuenta(estado)" class="btn-editar">Editar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!isLoading && estadosCuenta.length > 0" class="pagination">
      <div class="pagination-info">
        <span>Total: {{ totalElementos }} registros</span>
        <span class="separator">|</span>
        <label>
          Mostrar:
          <select v-model="tamanoPagina" @change="cambiarTamanoPagina" class="select-size">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </label>
      </div>
      <div class="pagination-controls">
        <button
          class="btn-pag"
          :disabled="paginaActual === 0"
          @click="cambiarPagina(paginaActual - 1)"
        >
          Anterior
        </button>
        <span class="page-indicator">Pagina {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button
          class="btn-pag"
          :disabled="paginaActual >= totalPaginas - 1 || totalPaginas === 0"
          @click="cambiarPagina(paginaActual + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>
    
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearEstadoCuenta @created="handleEstadoCuentaCreado" @cancel="mostrarModalCrear = false" />
      </div>
    </div>

    <div v-if="mostrarModalEditar" class="modal">
      <div class="modal-content">
        <span class="close" @click="mostrarModalEditar = false">&times;</span>
        <EditarEstadoCuenta
          :estado-cuenta="estadoCuentaEditando"
          @updated="handleEstadoCuentaActualizado"
          @cancel="mostrarModalEditar = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import EstadoCuentaService from '@/services/EstadoCuentaService'
import ClienteService from '@/services/ClienteService'
// ASUMIMOS QUE ESTE ARCHIVO EXISTE Y ESTÁ IMPLEMENTADO
import Cuenta110Service from '@/services/Cuenta110Service'
import CrearEstadoCuenta from './CrearEstadoCuenta.vue'
import EditarEstadoCuenta from './EditarEstadoCuenta.vue'
import type { EstadoCuenta, SearchFilter } from '@/types/EstadoCuenta'
import type { Cliente } from '@/types/Cliente'
import { useRouter } from 'vue-router'

const router = useRouter()

// Variables de Estado y Búsqueda
const estadosCuenta = ref<EstadoCuenta[]>([])
const searchQuery = ref('')
const fechaInicio = ref('')
const fechaFin = ref('')
const filterTipo = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const isLoading = ref(false)

// NUEVA VARIABLE DE ESTADO para el importe de la Cuenta 110
const importeCuenta110 = ref<number>(0);

// Mapa de clientes para mostrar nombre por clienteId
const clientesMap = ref<Map<string, Cliente>>(new Map())

// Modales
const mostrarModalCrear = ref(false)
const mostrarModalEditar = ref(false)
const estadoCuentaEditando = ref<EstadoCuenta | null>(null)

// Propiedades Computadas
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const totalCreditos = computed(() =>
  estadosCuenta.value.filter(e => e.tipo === 'Cr').reduce((sum, e) => sum + (e.importe || 0), 0)
)
const totalDebitos = computed(() =>
  estadosCuenta.value.filter(e => e.tipo === 'Db').reduce((sum, e) => sum + (e.importe || 0), 0)
)

// Funciones de Lógica de Negocio
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP', // Asumiendo pesos colombianos o el que necesite
    minimumFractionDigits: 2,
  }).format(value)
}

// Obtener nombre del cliente desde el mapa
const getClienteNombre = (clienteId: string | undefined): string => {
  if (!clienteId) return '-'
  const cliente = clientesMap.value.get(clienteId)
  return cliente ? cliente.nombre : 'Cargando...'
}

// Cargar información de clientes para los estados de cuenta cargados
const cargarClientesInfo = async () => {
  // Obtener IDs únicos de clientes que no estén ya en el mapa
  const clienteIds = [...new Set(
    estadosCuenta.value
      .filter(e => e.clienteId && !clientesMap.value.has(e.clienteId))
      .map(e => e.clienteId as string)
  )]

  if (clienteIds.length === 0) return

  // Cargar cada cliente que no esté en el mapa
  for (const clienteId of clienteIds) {
    try {
      const response = await ClienteService.obtenerClientePorId(clienteId)
      if (response.data) {
        clientesMap.value.set(clienteId, response.data)
      }
    } catch (error) {
      console.error(`Error al cargar cliente ${clienteId}:`, error)
    }
  }
}

// NUEVA FUNCIÓN PARA CARGAR EL IMPORTE DE LA CUENTA 110
const cargarImporteCuenta110 = async () => {
  try {
    const response = await Cuenta110Service.obtenerImporteUnico();
    // Asumimos que la respuesta trae el campo 'importe'
    importeCuenta110.value = response.data.importe || 0;
  } catch (error) {
    console.error('Error al cargar el importe de la Cuenta 110:', error);
    // Mostrar un mensaje claro al usuario si el saldo no se pudo cargar
    importeCuenta110.value = 0; 
  }
};

const buscarEstadosCuenta = async () => {
  // ... (Lógica de búsqueda existente) ...
  isLoading.value = true
  estadosCuenta.value = []
  try {
    const filters: SearchFilter[] = []

    if (filterTipo.value) {
      filters.push({
        key: 'tipo',
        operator: 'EQUALS',
        value: filterTipo.value,
        logicalOperation: 'AND',
      })
    }

    // Lógica para manejar el rango de fechas
    if (fechaInicio.value) {
      filters.push({
        key: 'fecha',
        operator: 'GREATER_THAN_OR_EQUAL_TO',
        value: fechaInicio.value,
        logicalOperation: 'AND',
      })
    }
    if (fechaFin.value) {
      filters.push({
        key: 'fecha',
        operator: 'LESS_THAN_OR_EQUAL_TO',
        value: fechaFin.value,
        logicalOperation: 'AND',
      })
    }

    const response = await EstadoCuentaService.buscarEstadoCuenta({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
    })

    const data = response.data as Record<string, unknown>
    console.log('Respuesta del backend:', data) // Debug temporal

    // Extraer datos según el formato PaginatedResponse del backend
    // El backend devuelve: { data, totalPages, totalElementsPage, totalElements, size, page }
    if (data.data && Array.isArray(data.data)) {
      // Formato PaginatedResponse de kynsof-share
      estadosCuenta.value = (data.data as EstadoCuenta[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (data.content && Array.isArray(data.content)) {
      // Formato Spring Data Page alternativo
      estadosCuenta.value = (data.content as EstadoCuenta[]) || []
      totalElementos.value = Number(data.totalElements) || 0
    } else if (Array.isArray(data)) {
      // Si la respuesta es directamente un array
      estadosCuenta.value = data as EstadoCuenta[]
      totalElementos.value = estadosCuenta.value.length
    } else {
      estadosCuenta.value = []
      totalElementos.value = 0
    }

    // Debug: mostrar valores de paginacion
    console.log('totalElementos:', totalElementos.value, 'tamanoPagina:', tamanoPagina.value, 'totalPaginas:', Math.ceil(totalElementos.value / tamanoPagina.value))

    // Cargar información de clientes para los estados de cuenta cargados
    await cargarClientesInfo()
  } catch (error) {
    console.error('Error al buscar estados de cuenta:', error)
    estadosCuenta.value = []
    totalElementos.value = 0
  } finally {
    isLoading.value = false
  }
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    buscarEstadosCuenta()
  }
}

// Buscar con reset de página (para nuevas búsquedas)
const buscarConReset = () => {
  paginaActual.value = 0
  buscarEstadosCuenta()
}

// Cambiar tamaño de página
const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  buscarEstadosCuenta()
}

const handleEstadoCuentaCreado = () => {
  mostrarModalCrear.value = false
  paginaActual.value = 0
  buscarEstadosCuenta()
}

const handleEstadoCuentaActualizado = () => {
  mostrarModalEditar.value = false
  buscarEstadosCuenta()
}

const editarEstadoCuenta = (estadoCuenta: EstadoCuenta) => {
  estadoCuentaEditando.value = estadoCuenta
  mostrarModalEditar.value = true
}

const goToUploadView = () => {
  router.push('/estado-cuenta/upload')
}

const exportarAExcel = async () => {
  // ... (Lógica de exportar existente) ...
  try {
    const params = new URLSearchParams()
    if (fechaInicio.value) params.append('fechaInicio', fechaInicio.value)
    if (fechaFin.value) params.append('fechaFin', fechaFin.value)

    const response = await EstadoCuentaService.exportar(params)

    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'EstadoCuentas_Export.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error al exportar a Excel:', error)
    alert('Error al exportar los datos a Excel.')
  }
}

// Lógica de Montaje
onMounted(() => {
  buscarEstadosCuenta()
  cargarImporteCuenta110(); // <-- LLAMADA PARA CARGAR EL SALDO
})
</script>

<style scoped>
/* Estilos para el nuevo elemento de saldo */
.importe-cuenta-110 {
  background-color: #e3f2fd; /* Fondo azul claro */
  border: 1px solid #90caf9;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 20px; /* Separación con la barra de búsqueda */
  text-align: center;
}

.importe-cuenta-110 h3 {
  margin-top: 0;
  color: #1565c0; 
  font-size: 1.1em;
}

.saldo-valor {
  font-size: 2.5em;
  font-weight: bold;
  color: #0d47a1; /* Azul oscuro */
  margin: 5px 0 0 0;
}

/* Indicador de carga */
.loading {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #666;
}

/* Badge de tipo (Cr/Db) */
.tipo-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.85em;
}

.tipo-badge.credito {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.tipo-badge.debito {
  background-color: #ffebee;
  color: #c62828;
}

/* Columna de cliente */
.cliente-cell {
  font-size: 0.9em;
  color: #555;
  min-width: 250px;
  max-width: 300px;
  word-wrap: break-word;
  white-space: normal;
}

/* Columna de importe alineada a la derecha */
td.importe {
  text-align: right;
  font-weight: 500;
}
.estado-cuenta-list {
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.resumen-totales {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  gap: 20px;
}

.total-card {
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.credito {
  background-color: #e8f5e9;
  border-left: 5px solid #4caf50;
}

.debito {
  background-color: #ffebee;
  border-left: 5px solid #f44336;
}

.total-card h3 {
  margin-top: 0;
  font-size: 1.1em;
  color: #555;
}

.total-card p {
  font-size: 1.8em;
  font-weight: bold;
  margin: 5px 0 0 0;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.search-input,
.search-input-date,
.search-input-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-input {
  flex-grow: 1;
  min-width: 150px;
}
.search-input-date,
.search-input-select {
  width: 150px;
}

/* Estilos de botones */
.btn-buscar,
.btn-upload-xml,
.btn-exportar,
.btn-crear {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  white-space: nowrap;
}

.btn-buscar {
  background-color: #007bff;
  color: white;
}
.btn-upload-xml {
  background-color: #ff9800;
  color: white;
}
.btn-exportar {
  background-color: #4CAF50;
  color: white;
}
.btn-crear {
  background-color: #673ab7;
  color: white;
}

.btn-buscar:hover {
  background-color: #0056b3;
}
.btn-upload-xml:hover {
  background-color: #fb8c00;
}
.btn-exportar:hover {
  background-color: #43a047;
}
.btn-crear:hover {
  background-color: #5e35b1;
}

.estado-cuenta-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.estado-cuenta-table th,
.estado-cuenta-table td {
  border: 1px solid #eee;
  padding: 12px;
  text-align: left;
}

.estado-cuenta-table th {
  background-color: #f5f5f5;
  cursor: pointer;
}

.estado-cuenta-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.acciones button {
  margin-right: 5px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-ver {
  background-color: #4caf50;
  color: white;
}

.btn-editar {
  background-color: #2196f3;
  color: white;
}

.btn-ver:hover {
  background-color: #45a049;
}

.btn-editar:hover {
  background-color: #0b7dda;
}

/* ALINEACION DE COLUMNAS */
.estado-cuenta-table td:nth-child(4),
.estado-cuenta-table th:nth-child(4) {
  text-align: left; /* Observaciones */
}

.estado-cuenta-table td:nth-child(5),
.estado-cuenta-table th:nth-child(5) {
  text-align: right; /* Importe */
}

/* ESTILOS VARIOS */
.no-data {
  text-align: center;
  padding: 40px;
  color: #888;
  font-style: italic;
}

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
  font-size: 0.9em;
}

.pagination-info .separator {
  color: #ccc;
}

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
  color: #333;
}

.btn-pag {
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.btn-pag:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.btn-pag:disabled {
  background-color: #e9ecef;
  color: #aaa;
  cursor: not-allowed;
}

/* Modal Styles (Asumidos de una implementación previa) */
.modal {
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fefefe;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  position: relative;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
}
.close:hover {
  color: #000;
}
</style>