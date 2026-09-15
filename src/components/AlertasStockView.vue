<template>
  <div class="alertas-stock">
    <div class="header">
      <h1>Alertas de Stock</h1>
      <router-link to="/reportes-consolidados" class="btn-back">← Volver a Reportes</router-link>
    </div>

    <!-- Filters -->
    <div class="filters">
      <div class="filter-group">
        <label>Finca:</label>
        <select v-model="filtros.fincaId" @change="cargarAlertas">
          <option value="">Todas</option>
          <option v-for="finca in fincas" :key="finca.id" :value="finca.id">
            {{ finca.name }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label>Estado:</label>
        <select v-model="filtros.estado" @change="cargarAlertas">
          <option value="">Todos</option>
          <option value="CRITICO">Crítico</option>
          <option value="BAJO">Bajo</option>
          <option value="NORMAL">Normal</option>
          <option value="EXCESO">Exceso</option>
        </select>
      </div>
      <button class="btn-refresh" @click="cargarAlertas" :disabled="loading">
        {{ loading ? 'Cargando...' : '🔄 Actualizar' }}
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="resumen" class="summary-cards">
      <div class="card critico" @click="filtrarPorEstado('CRITICO')">
        <div class="value">{{ resumen.productosCriticos }}</div>
        <div class="label">Críticos</div>
      </div>
      <div class="card bajo" @click="filtrarPorEstado('BAJO')">
        <div class="value">{{ resumen.productosBajos }}</div>
        <div class="label">Bajos</div>
      </div>
      <div class="card normal" @click="filtrarPorEstado('NORMAL')">
        <div class="value">{{ resumen.productosNormales }}</div>
        <div class="label">Normales</div>
      </div>
      <div class="card exceso" @click="filtrarPorEstado('EXCESO')">
        <div class="value">{{ resumen.productosExceso }}</div>
        <div class="label">En Exceso</div>
      </div>
    </div>

    <!-- Alerts Table -->
    <div v-if="resumen && resumen.alertas.length > 0" class="section">
      <h2>Productos con Alerta</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Estado</th>
            <th>Finca</th>
            <th>Producto</th>
            <th>Stock Actual</th>
            <th>Stock Mínimo</th>
            <th>Déficit</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alerta in resumen.alertas" :key="alerta.fincaProductoId">
            <td>
              <span :class="['estado-badge', alerta.estado.toLowerCase()]">
                {{ alerta.estado }}
              </span>
            </td>
            <td>{{ alerta.fincaName }}</td>
            <td>
              <strong>{{ alerta.productoCode }}</strong>
              <br />
              <small>{{ alerta.productoName }}</small>
            </td>
            <td :class="{ 'text-danger': alerta.stockActual === 0 }">
              {{ alerta.stockActual }} {{ alerta.unidadMedida }}
            </td>
            <td>{{ alerta.stockMinimo }}</td>
            <td class="deficit">
              <span v-if="alerta.deficit > 0">-{{ alerta.deficit }}</span>
              <span v-else>-</span>
            </td>
            <td>
              <button class="btn-edit" @click="editarUmbrales(alerta)">
                ⚙️ Configurar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="resumen && resumen.alertas.length === 0" class="empty-state">
      No hay alertas de stock para los filtros seleccionados.
    </div>

    <!-- Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h3>Configurar Umbrales</h3>
        <p>{{ editingItem?.productoName }} - {{ editingItem?.fincaName }}</p>

        <div class="form-group">
          <label>Stock Mínimo:</label>
          <input type="number" v-model.number="editForm.stockMinimo" min="0" />
        </div>

        <div class="form-group">
          <label>Stock Máximo (opcional):</label>
          <input type="number" v-model.number="editForm.stockMaximo" min="0" />
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Cancelar</button>
          <button class="btn-save" @click="guardarUmbrales">Guardar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ReportesService from '@/services/ReportesConsolidadosService'
import FincaService from '@/services/FincaService'
import type { ResumenAlertas, AlertaStock, EstadoStock } from '@/types/Reportes'
import type { Finca } from '@/types/Finca'

const loading = ref(false)
const resumen = ref<ResumenAlertas | null>(null)
const fincas = ref<Finca[]>([])
const showModal = ref(false)
const editingItem = ref<AlertaStock | null>(null)

const filtros = reactive({
  fincaId: '',
  estado: ''
})

const editForm = reactive({
  stockMinimo: 0,
  stockMaximo: undefined as number | undefined
})

const cargarFincas = async () => {
  try {
    const response = await FincaService.getAll()
    fincas.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error loading fincas:', error)
  }
}

const cargarAlertas = async () => {
  loading.value = true
  try {
    const params = {
      fincaId: filtros.fincaId || undefined,
      estado: filtros.estado || undefined,
      limit: 100
    }
    const response = await ReportesService.getResumenAlertas(params)
    resumen.value = response.data
  } catch (error) {
    console.error('Error loading alerts:', error)
    alert('Error al cargar las alertas')
  } finally {
    loading.value = false
  }
}

const filtrarPorEstado = (estado: EstadoStock) => {
  filtros.estado = estado
  cargarAlertas()
}

const editarUmbrales = (alerta: AlertaStock) => {
  editingItem.value = alerta
  editForm.stockMinimo = alerta.stockMinimo
  editForm.stockMaximo = undefined
  showModal.value = true
}

const guardarUmbrales = async () => {
  if (!editingItem.value) return

  try {
    await ReportesService.actualizarStockMinMax(
      editingItem.value.fincaProductoId,
      editForm.stockMinimo,
      editForm.stockMaximo
    )
    showModal.value = false
    cargarAlertas()
  } catch (error) {
    console.error('Error saving thresholds:', error)
    alert('Error al guardar los umbrales')
  }
}

onMounted(() => {
  cargarFincas()
  cargarAlertas()
})
</script>

<style scoped>
.alertas-stock {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.btn-back {
  color: #3498db;
  text-decoration: none;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 0.85rem;
  color: #666;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.btn-refresh {
  padding: 10px 20px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-refresh:disabled {
  background: #bdc3c7;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 30px;
}

.card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}

.card.critico {
  background: #dc3545;
  color: white;
}

.card.bajo {
  background: #fd7e14;
  color: white;
}

.card.normal {
  background: #28a745;
  color: white;
}

.card.exceso {
  background: #17a2b8;
  color: white;
}

.card .value {
  font-size: 2rem;
  font-weight: bold;
}

.card .label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.section h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.data-table th,
.data-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.estado-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.estado-badge.critico {
  background: #dc3545;
  color: white;
}

.estado-badge.bajo {
  background: #fd7e14;
  color: white;
}

.estado-badge.normal {
  background: #28a745;
  color: white;
}

.estado-badge.exceso {
  background: #17a2b8;
  color: white;
}

.text-danger {
  color: #dc3545;
  font-weight: bold;
}

.deficit {
  color: #dc3545;
  font-weight: bold;
}

.btn-edit {
  padding: 6px 12px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.btn-edit:hover {
  background: #e9ecef;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f8f9fa;
  border-radius: 8px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  min-width: 350px;
}

.modal h3 {
  margin: 0 0 10px 0;
}

.modal p {
  color: #666;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save {
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
