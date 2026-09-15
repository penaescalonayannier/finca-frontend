<!-- src/components/SalidaList.vue -->

<template>
  <div class="salida-list">
    <h2>Gestión de Salidas (Vales/Facturas)</h2>

    <!-- Filtros -->
    <div class="search-bar">
      <div class="search-filters">
        <select v-model="filtroTipo" class="filter-select">
          <option value="">Todos los tipos</option>
          <option value="VALE">Vale</option>
          <option value="FACTURA">Factura</option>
        </select>

        <input
          v-model="searchQuery"
          placeholder="Buscar por número..."
          class="search-input"
          @keyup.enter="buscarConReset"
        />
      </div>

      <div class="button-group">
        <button @click="buscarConReset" class="btn-buscar">Buscar</button>
        <button @click="abrirModalConsolidado" class="btn-consolidado">PDF vales consolidados</button>
        <button @click="mostrarModalCrear = true" class="btn-crear">+ Nueva Salida</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">Cargando salidas...</div>

    <!-- Tabla -->
    <table v-else class="tabla-salidas">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Destino</th>
          <th>Número</th>
          <th>Finca</th>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Fecha</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="salidas.length === 0">
          <td colspan="8" class="no-data">No se encontraron salidas</td>
        </tr>
        <tr v-for="salida in salidas" :key="salida.id">
          <td>
            <span :class="['tipo-badge', salida.tipo === 'VALE' ? 'tipo-vale' : 'tipo-factura']">
              {{ salida.tipo }}
            </span>
          </td>
          <td>
            <span class="destino-badge">{{ formatDestino(salida.destino) }}</span>
          </td>
          <td><strong>{{ salida.numero }}</strong></td>
          <td>
            <strong>{{ salida.fincaCode }}</strong>
            <span class="subtext">{{ salida.fincaName }}</span>
          </td>
          <td>
            <strong>{{ salida.productoCode }}</strong>
            <span class="subtext">{{ salida.productoName }}</span>
          </td>
          <td class="cantidad-cell">{{ salida.cantidadTotal }}</td>
          <td>{{ formatFecha(salida.fecha) }}</td>
          <td class="acciones">
            <button @click="verDetalles(salida)" class="btn-ver">Ver</button>
            <button @click="descargarFactura(salida)" class="btn-descargar">PDF</button>
            <button @click="confirmarEliminar(salida)" class="btn-eliminar">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Paginación -->
    <div v-if="!isLoading && salidas.length > 0" class="pagination">
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
        <span class="page-indicator">Página {{ paginaActual + 1 }} de {{ totalPaginas || 1 }}</span>
        <button class="btn-pag" :disabled="paginaActual >= totalPaginas - 1" @click="cambiarPagina(paginaActual + 1)">
          Siguiente
        </button>
      </div>
    </div>

    <!-- PDF consolidado: solo lectura, no afecta stock ni contabilidad -->
    <div v-if="mostrarModalConsolidado" class="modal" @click.self="cerrarModalConsolidado">
      <div class="modal-content modal-consolidado">
        <span class="close" @click="cerrarModalConsolidado">&times;</span>
        <h3>Vales consolidados por destino</h3>
        <p class="consolidado-info">
          Seleccione los vales activos de la fecha. Puede generar un PDF agrupado por destino o un único PDF que mantenga cada vale en páginas independientes. No modifica inventario ni contabilidad.
        </p>

        <div class="form-group">
          <label>Fecha *</label>
          <input v-model="formConsolidado.fecha" type="date" class="form-input" :disabled="generandoConsolidado || cargandoValesConsolidado" @change="cargarValesConsolidado" />
        </div>

        <div v-if="cargandoValesConsolidado" class="vales-loading">Cargando vales...</div>
        <div v-else-if="valesAgrupados.length === 0" class="vales-vacio">
          No existen vales activos para esta fecha.
        </div>
        <div v-else class="grupos-vales">
          <div v-for="grupo in valesAgrupados" :key="grupo.destino" class="grupo-vales">
            <div class="grupo-vales-header">
              <label>
                <input
                  type="checkbox"
                  :checked="todosValesDelGrupoSeleccionados(grupo.vales)"
                  :disabled="generandoConsolidado"
                  @change="alternarGrupoVales(grupo.vales)"
                />
                <strong>{{ formatDestino(grupo.destino) }}</strong>
              </label>
              <span>{{ grupo.vales.length }} vale(s)</span>
            </div>
            <label v-for="vale in grupo.vales" :key="vale.id" class="vale-seleccionable">
              <input
                type="checkbox"
                :checked="valesSeleccionados.has(vale.id)"
                :disabled="generandoConsolidado"
                @change="alternarValeSeleccionado(vale.id)"
              />
              <span><strong>{{ vale.numero }}</strong> · {{ vale.productoName }}</span>
              <span>{{ vale.cantidadTotal }} {{ vale.unidadMedida || 'ud.' }}</span>
            </label>
          </div>
        </div>
        <p v-if="valesAgrupados.length > 0" class="seleccion-resumen">
          {{ valesSeleccionados.size }} vale(s) seleccionado(s).
        </p>
        <div class="form-actions">
          <button class="btn-cancelar" @click="cerrarModalConsolidado" :disabled="generandoConsolidado">Cancelar</button>
          <button class="btn-individuales" @click="generarPdfValesIndividuales" :disabled="!formConsolidado.fecha || valesSeleccionados.size === 0 || generandoConsolidado">
            {{ generandoConsolidado ? 'Generando...' : 'PDF individuales' }}
          </button>
          <button class="btn-guardar" @click="generarPdfConsolidado" :disabled="!formConsolidado.fecha || valesSeleccionados.size === 0 || generandoConsolidado">
            {{ generandoConsolidado ? 'Generando...' : 'PDF por destino' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Ver Detalles -->
    <div v-if="mostrarModalDetalles" class="modal">
      <div class="modal-content modal-grande">
        <span class="close" @click="cerrarModalDetalles">&times;</span>
        <h3>Detalles de Salida</h3>

        <div class="detalles-header">
          <div class="detalles-badges">
            <span :class="['tipo-badge-lg', salidaSeleccionada?.tipo === 'VALE' ? 'tipo-vale' : 'tipo-factura']">
              {{ salidaSeleccionada?.tipo }}
            </span>
            <span :class="['destino-badge-lg', 'destino-' + (salidaSeleccionada?.destino?.toLowerCase() || '')]">
              {{ formatDestino(salidaSeleccionada?.destino) }}
            </span>
          </div>
          <div class="detalles-numero">
            <strong>{{ salidaSeleccionada?.numero }}</strong>
          </div>
        </div>

        <div class="detalles-info">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Finca</span>
              <span class="info-value">{{ salidaSeleccionada?.fincaCode }} - {{ salidaSeleccionada?.fincaName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Producto</span>
              <span class="info-value">{{ salidaSeleccionada?.productoCode }} - {{ salidaSeleccionada?.productoName }}</span>
            </div>
          </div>
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">Fecha</span>
              <span class="info-value">{{ formatFecha(salidaSeleccionada?.fecha) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Observaciones</span>
              <span class="info-value">{{ salidaSeleccionada?.observaciones || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <h4>Items</h4>
        <table class="tabla-items">
          <thead>
            <tr>
              <th>Trabajador</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in salidaSeleccionada?.items" :key="item.id">
              <td>{{ item.trabajadorNombre }}</td>
              <td>{{ item.productoName || salidaSeleccionada?.productoName }}</td>
              <td class="cantidad-col">{{ item.cantidad }}</td>
              <td class="precio-col">${{ (item.precio || 0).toFixed(2) }}</td>
              <td class="subtotal-col">${{ ((item.cantidad || 0) * (item.precio || 0)).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-detalles">
          <div class="total-row">
            <span>Total Cantidad:</span>
            <strong>{{ salidaSeleccionada?.cantidadTotal }}</strong>
          </div>
          <div class="total-row total-valor">
            <span>Total Valor:</span>
            <strong>${{ calcularTotalValor().toFixed(2) }}</strong>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancelar" @click="cerrarModalDetalles">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal Crear Salida -->
    <div v-if="mostrarModalCrear" class="modal">
      <div class="modal-content modal-grande">
        <span class="close" @click="mostrarModalCrear = false">&times;</span>
        <CrearSalida @created="handleSalidaCreada" @cancel="mostrarModalCrear = false" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import SalidaService from '@/services/SalidaService'
import CrearSalida from '@/components/CrearSalida.vue'
import { notify } from '@/composables/useNotification'
import { confirmDialog } from '@/composables/useConfirmDialog'
import type { Salida } from '@/types/Salida'
import type { SearchFilter } from '@/types/EstadoCuenta'

// Estado
const salidas = ref<Salida[]>([])
const isLoading = ref(false)
const searchQuery = ref('')
const paginaActual = ref(0)
const tamanoPagina = ref(10)
const totalElementos = ref(0)
const filtroTipo = ref('')

// Modales
const mostrarModalDetalles = ref(false)
const mostrarModalCrear = ref(false)
const mostrarModalConsolidado = ref(false)
const generandoConsolidado = ref(false)
const cargandoValesConsolidado = ref(false)
const formConsolidado = ref({
  fecha: new Date().toISOString().slice(0, 10)
})
const valesConsolidado = ref<Salida[]>([])
const valesSeleccionados = ref<Set<string>>(new Set())

const salidaSeleccionada = ref<Salida | null>(null)

// Computed
const totalPaginas = computed(() => Math.ceil(totalElementos.value / tamanoPagina.value))

const valesAgrupados = computed(() => {
  const grupos = new Map<string, Salida[]>()
  valesConsolidado.value.forEach(vale => {
    const grupo = grupos.get(vale.destino) || []
    grupo.push(vale)
    grupos.set(vale.destino, grupo)
  })
  return Array.from(grupos, ([destino, vales]) => ({ destino, vales }))
})

const cargarSalidas = async () => {
  isLoading.value = true
  try {
    const filters: SearchFilter[] = []

    if (filtroTipo.value) {
      filters.push({ field: 'tipo', operator: 'EQUALS', value: filtroTipo.value })
    }

    const response = await SalidaService.search({
      page: paginaActual.value,
      size: tamanoPagina.value,
      query: searchQuery.value,
      filter: filters,
      sortType: 'DES'
    })

    salidas.value = response.data.data || []
    totalElementos.value = response.data.totalElements || 0
  } catch (error) {
    console.error('Error al cargar salidas:', error)
  } finally {
    isLoading.value = false
  }
}

const buscarConReset = () => {
  paginaActual.value = 0
  cargarSalidas()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina >= 0 && nuevaPagina < totalPaginas.value) {
    paginaActual.value = nuevaPagina
    cargarSalidas()
  }
}

const cambiarTamanoPagina = () => {
  paginaActual.value = 0
  cargarSalidas()
}

const abrirModalConsolidado = async () => {
  formConsolidado.value = {
    fecha: new Date().toISOString().slice(0, 10)
  }
  valesConsolidado.value = []
  valesSeleccionados.value = new Set()
  mostrarModalConsolidado.value = true
  await cargarValesConsolidado()
}

const cerrarModalConsolidado = () => {
  if (generandoConsolidado.value) return
  mostrarModalConsolidado.value = false
  valesConsolidado.value = []
  valesSeleccionados.value = new Set()
}

const cargarValesConsolidado = async () => {
  if (!formConsolidado.value.fecha) return
  cargandoValesConsolidado.value = true
  try {
    const response = await SalidaService.obtenerValesPorFecha(formConsolidado.value.fecha)
    valesConsolidado.value = response.data || []
    valesSeleccionados.value = new Set(valesConsolidado.value.map(vale => vale.id))
  } catch (error) {
    console.error('Error al cargar vales consolidados:', error)
    valesConsolidado.value = []
    valesSeleccionados.value = new Set()
    notify.error('Error', 'No se pudieron cargar los vales de la fecha')
  } finally {
    cargandoValesConsolidado.value = false
  }
}

const alternarValeSeleccionado = (id: string) => {
  const seleccionados = new Set(valesSeleccionados.value)
  if (seleccionados.has(id)) {
    seleccionados.delete(id)
  } else {
    seleccionados.add(id)
  }
  valesSeleccionados.value = seleccionados
}

const todosValesDelGrupoSeleccionados = (vales: Salida[]): boolean =>
  vales.length > 0 && vales.every(vale => valesSeleccionados.value.has(vale.id))

const alternarGrupoVales = (vales: Salida[]) => {
  const seleccionados = new Set(valesSeleccionados.value)
  const seleccionar = !todosValesDelGrupoSeleccionados(vales)
  vales.forEach(vale => {
    if (seleccionar) seleccionados.add(vale.id)
    else seleccionados.delete(vale.id)
  })
  valesSeleccionados.value = seleccionados
}

const generarPdfConsolidado = async () => {
  if (!formConsolidado.value.fecha) return
  generandoConsolidado.value = true
  try {
    await SalidaService.descargarValesConsolidadosPorDestino(
      formConsolidado.value.fecha,
      Array.from(valesSeleccionados.value)
    )
    notify.success('PDF generado', 'Se descargó el PDF agrupado por destino sin modificar registros contables ni de inventario')
    generandoConsolidado.value = false
    cerrarModalConsolidado()
  } catch (error: unknown) {
    console.error('Error al generar vale consolidado:', error)
    notify.error('Error', 'No se pudo generar el PDF consolidado')
  } finally {
    generandoConsolidado.value = false
  }
}

const generarPdfValesIndividuales = async () => {
  if (!formConsolidado.value.fecha || valesSeleccionados.value.size === 0) return
  generandoConsolidado.value = true
  try {
    await SalidaService.descargarValesIndividuales(
      formConsolidado.value.fecha,
      Array.from(valesSeleccionados.value)
    )
    notify.success('PDF generado', 'Se descargó un único PDF con cada vale en páginas independientes')
    cerrarModalConsolidado()
  } catch (error) {
    console.error('Error al generar vales individuales:', error)
    notify.error('Error', 'No se pudo generar el PDF de vales individuales')
  } finally {
    generandoConsolidado.value = false
  }
}

// Ver detalles
const verDetalles = async (salida: Salida) => {
  try {
    const response = await SalidaService.findById(salida.id)
    salidaSeleccionada.value = response.data
    mostrarModalDetalles.value = true
  } catch (error) {
    console.error('Error al cargar detalles:', error)
  }
}

const cerrarModalDetalles = () => {
  mostrarModalDetalles.value = false
  salidaSeleccionada.value = null
}

// Descargar factura PDF
const descargarFactura = async (salida: Salida) => {
  try {
    await SalidaService.descargarFactura(salida.id)
  } catch (error) {
    console.error('Error al descargar factura:', error)
    alert('Error al descargar la factura')
  }
}

// Eliminar
const confirmarEliminar = async (salida: Salida) => {
  const confirmed = await confirmDialog.delete(
    salida.numero,
    'El stock será devuelto automáticamente.'
  )

  if (confirmed) {
    try {
      await SalidaService.delete(salida.id)
      notify.success('Salida eliminada', 'La salida fue eliminada y el stock devuelto')
      cargarSalidas()
    } catch (error: unknown) {
      console.error('Error al eliminar:', error)
      const mensaje = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      notify.error('Error', mensaje || 'Error al eliminar la salida')
    }
  }
}

const handleSalidaCreada = () => {
  mostrarModalCrear.value = false
  cargarSalidas()
}

// Utilidades
const formatFecha = (fecha: string | undefined): string => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDestino = (destino: string | undefined): string => {
  const destinos: Record<string, string> = {
    'TRABAJADORES': 'Trabajadores',
    'COMEDOR': 'Comedor',
    'VENTA_ESTADO': 'Venta Estado',
    'POBLACION': 'Población',
    'INSUMO': 'Insumo',
    'OTROS': 'Otros'
  }
  return destino ? destinos[destino] || destino : ''
}

const calcularTotalValor = (): number => {
  if (!salidaSeleccionada.value?.items) return 0
  return salidaSeleccionada.value.items.reduce((sum, item) => {
    return sum + (item.cantidad || 0) * (item.precio || 0)
  }, 0)
}

// Lifecycle
onMounted(() => {
  cargarSalidas()
})

// Watchers
watch(filtroTipo, () => {
  paginaActual.value = 0
  cargarSalidas()
})
</script>

<style scoped>
.salida-list {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 2em;
  font-weight: 700;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-filters {
  display: flex;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  min-width: 150px;
  background: #fff;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn-buscar {
  background-color: var(--color-primary);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-crear {
  background-color: #27ae60;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-consolidado {
  background-color: #8e44ad;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-individuales {
  background-color: #2874a6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.loading, .no-data {
  text-align: center;
  padding: 40px;
  color: #888;
}

.tabla-salidas {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.tabla-salidas th, .tabla-salidas td {
  border: 1px solid #eee;
  padding: 12px 15px;
  text-align: left;
}

.tabla-salidas th {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-weight: 600;
  color: #2c3e50;
}

.tipo-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85em;
}

.tipo-vale {
  background-color: #e3f2fd;
  color: #1565c0;
}

.tipo-factura {
  background-color: #fff3e0;
  color: #e65100;
}

.destino-badge {
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8em;
  font-weight: 500;
  background-color: #e8f5e9;
  color: #2e7d32;
}

.subtext {
  display: block;
  font-size: 0.8em;
  color: #888;
}

.cantidad-cell {
  font-weight: 700;
  color: #e74c3c;
}

.acciones {
  display: flex;
  gap: 5px;
}

.acciones button {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
}

.btn-ver {
  background-color: var(--color-primary);
  color: white;
}

.btn-descargar {
  background-color: var(--color-primary);
  color: white;
}

.btn-eliminar {
  background-color: #e74c3c;
  color: white;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background: #fff;
  border-radius: 12px;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-pag {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

.btn-pag:disabled {
  background: #f5f5f5;
  color: #aaa;
  cursor: not-allowed;
}

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
  border-radius: 16px;
  position: relative;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-grande {
  max-width: 700px;
}

.modal-consolidado {
  max-width: 760px;
}

.consolidado-info {
  margin: 0 0 20px;
  padding: 12px;
  border-radius: 8px;
  background: #f3e8f8;
  color: #5b2c6f;
  line-height: 1.45;
  font-size: 0.9em;
}

.vales-loading,
.vales-vacio {
  padding: 18px;
  text-align: center;
  color: #6c757d;
  border: 1px dashed #c7cdd1;
  border-radius: 8px;
  margin-bottom: 15px;
}

.grupos-vales {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.grupo-vales {
  border: 1px solid #ded4e5;
  border-radius: 8px;
  overflow: hidden;
}

.grupo-vales-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f3e8f8;
  color: #5b2c6f;
}

.grupo-vales-header label,
.vale-seleccionable {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.vale-seleccionable {
  justify-content: space-between;
  padding: 9px 12px;
  border-top: 1px solid #eee;
  color: #34495e;
}

.vale-seleccionable input {
  margin-right: 2px;
}

.vale-seleccionable span:last-child {
  color: #7f8c8d;
  font-size: 0.88em;
}

.seleccion-resumen {
  margin: 0 0 15px;
  color: #5b2c6f;
  font-weight: 600;
}

.modal-small {
  max-width: 400px;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.form-row {
  display: flex;
  gap: 15px;
}

.form-row .form-group {
  flex: 1;
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

.form-select, .form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1em;
}

.stock-info {
  background-color: #e8f5e9;
  padding: 10px 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  color: #2e7d32;
}

.items-section {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.items-header h4 {
  margin: 0;
}

.btn-agregar-item {
  background-color: #27ae60;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85em;
}

.item-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-bottom: 10px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
}

.item-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

.btn-eliminar-item {
  background-color: #e74c3c;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.total-items {
  text-align: right;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 8px;
  margin-top: 10px;
}

.error-stock {
  color: #e74c3c;
  font-weight: 600;
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
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
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
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.detalles-info {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.detalles-info p {
  margin: 8px 0;
}

.tabla-items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
}

.tabla-items th, .tabla-items td {
  border: 1px solid #eee;
  padding: 10px;
  text-align: left;
}

.tabla-items th {
  background: #f5f5f5;
}

.total-detalles {
  text-align: right;
  font-size: 1em;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.total-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 5px;
}

.total-row:last-child {
  margin-bottom: 0;
}

.total-valor {
  font-size: 1.2em;
  color: #27ae60;
}

.cantidad-col {
  text-align: center;
  font-weight: 600;
}

.precio-col {
  text-align: right;
  color: #666;
}

.subtotal-col {
  text-align: right;
  font-weight: 600;
  color: #27ae60;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.select-size {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.separator {
  color: #ccc;
}

.page-indicator {
  padding: 0 15px;
  font-weight: 500;
}

/* Detalles Modal Enhanced Styles */
.detalles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.detalles-badges {
  display: flex;
  gap: 10px;
}

.tipo-badge-lg {
  padding: 8px 20px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 1em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.destino-badge-lg {
  padding: 8px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1em;
}

/* Destino color variants */
.destino-trabajadores {
  background-color: #e3f2fd;
  color: #1565c0;
}

.destino-comedor {
  background-color: #fff3e0;
  color: #e65100;
}

.destino-venta_estado {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.destino-poblacion {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.destino-insumo {
  background-color: #e0f2f1;
  color: #00695c;
}

.destino-otros {
  background-color: #eceff1;
  color: #546e7a;
}

.detalles-numero {
  font-size: 1.3em;
  color: #2c3e50;
}

.info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.85em;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.info-value {
  font-size: 1em;
  color: #2c3e50;
  font-weight: 500;
}
</style>
