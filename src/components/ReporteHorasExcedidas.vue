<!-- src/components/ReporteHorasExcedidas.vue -->
<template>
  <div class="reporte-horas-excedidas">
    <h2>⏰ Reporte de Horas Excedidas y Sobretiempo</h2>

    <div class="controles">
      <div class="filtro-exceso">
        <label>Filtrar por horas excedidas:</label>
        <select v-model="filtroExceso">
          <option value="">Todos</option>
          <option value="alto">Crítico (10 horas o más)</option>
          <option value="medio">Alto (5-9.9 horas)</option>
          <option value="bajo">Bajo (Menos de 5 horas)</option>
        </select>
      </div>
      <button @click="exportarPDF" class="btn-exportar">📥 Exportar PDF</button>
    </div>

    <div class="table-responsive">
      <table class="tabla-excedidas" v-if="datosFiltrados.length > 0">
        <thead>
          <tr>
            <th>Trabajador</th>
            <th>RUC</th>
            <th>Cargo</th>
            <th>Días con Exceso</th>
            <th>Total Horas Excedidas</th>
            <th>Promedio/Día</th>
            <th>Días Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in datosFiltrados" :key="item.trabajadorId" :class="getRowClass(item)">
            <td class="nombre-col"><strong>{{ item.nombre }}</strong></td>
            <td>{{ item.ruc }}</td>
            <td>{{ item.cargo || '-' }}</td>
            <td>{{ item.diasExcedidos }}</td>
            <td>
              <span :class="['badge', getExcesoClass(item.totalHorasExcedidas)]">
                {{ item.totalHorasExcedidas.toFixed(1) }}h
              </span>
            </td>
            <td>{{ item.diasExcedidos > 0 ? (item.totalHorasExcedidas / item.diasExcedidos).toFixed(2) : '0.00' }}h</td>
            <td>
              <button
                @click="toggleDetalle(item.trabajadorId)"
                class="btn-detalle"
              >
                {{ detallesAbiertos.includes(item.trabajadorId) ? '▼' : '▶' }}
              </button>
            </td>
          </tr>
          <!-- Filas de detalle -->
          <tr v-for="item in detallesVisibles" :key="`detalle-${item.trabajadorId}`" class="detalle-row">
            <td colspan="7">
              <div class="detalle-dias">
                <h4>Días con exceso de horas ({{ item.diasConExceso?.length || 0 }} días):</h4>
                <div v-if="item.diasConExceso && item.diasConExceso.length > 0" class="dias-grid">
                  <span v-for="(fecha, idx) in item.diasConExceso" :key="idx" class="dia-badge">
                    {{ formatearFecha(fecha) }}
                  </span>
                </div>
                <div v-else class="no-dias">
                  <p>No hay información de días específicos disponible</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="sin-datos">No hay datos disponibles</div>
    </div>

    <div class="estadisticas">
      <h3>Estadísticas</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Trabajadores con Exceso</div>
          <div class="stat-value">{{ datos.length }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Total Horas Excedidas</div>
          <div class="stat-value">{{ totalHorasExcedidas.toFixed(1) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Promedio Exceso/Trabajador</div>
          <div class="stat-value">{{ datos.length > 0 ? (totalHorasExcedidas / datos.length).toFixed(1) : '0.0' }}h</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Críticos (≥10h)</div>
          <div class="stat-value">{{ datosCriticos }}</div>
        </div>
      </div>
    </div>

    <div class="impacto-info">
      <h3>Impacto Económico Estimado</h3>
      <p v-if="totalHorasExcedidas > 0" class="impacto-texto">
        Total de {{ totalHorasExcedidas.toFixed(1) }} horas excedidas en el mes. Considerar esta información para análisis de costos de nómina y productividad.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HorasExcedidasSummaryResponse } from '@/types/Metricas'

const props = defineProps<{
  datos: HorasExcedidasSummaryResponse[]
}>()

const filtroExceso = ref('')
const detallesAbiertos = ref<string[]>([])

const datosFiltrados = computed(() => {
  if (!props.datos || props.datos.length === 0) return []
  if (filtroExceso.value === '') return props.datos
  if (filtroExceso.value === 'alto') return props.datos.filter(d => d.totalHorasExcedidas >= 10)
  if (filtroExceso.value === 'medio') return props.datos.filter(d => d.totalHorasExcedidas >= 5 && d.totalHorasExcedidas < 10)
  if (filtroExceso.value === 'bajo') return props.datos.filter(d => d.totalHorasExcedidas < 5)
  return props.datos
})

const detallesVisibles = computed(() => {
  return datosFiltrados.value.filter(item => detallesAbiertos.value.includes(item.trabajadorId))
})

const totalHorasExcedidas = computed(() => {
  return props.datos.reduce((sum, d) => sum + d.totalHorasExcedidas, 0)
})

const datosCriticos = computed(() => {
  return props.datos.filter(d => d.totalHorasExcedidas >= 10).length
})

const getRowClass = (item: HorasExcedidasSummaryResponse) => {
  if (item.totalHorasExcedidas >= 10) return 'critico'
  if (item.totalHorasExcedidas >= 5) return 'alerta'
  return 'normal'
}

const getExcesoClass = (exceso: number) => {
  if (exceso >= 10) return 'critico'
  if (exceso >= 5) return 'alerta'
  return 'bajo'
}

const toggleDetalle = (trabajadorId: string) => {
  const idx = detallesAbiertos.value.indexOf(trabajadorId)
  if (idx > -1) {
    detallesAbiertos.value.splice(idx, 1)
  } else {
    detallesAbiertos.value.push(trabajadorId)
  }
}

const formatearFecha = (fecha: string) => {
  if (!fecha) return '-'
  try {
    const date = new Date(fecha)
    if (isNaN(date.getTime())) return fecha
    return date.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' })
  } catch (error) {
    return fecha
  }
}

const exportarPDF = () => {
  alert('Función de exportación a PDF en desarrollo')
}
</script>

<style scoped>
.reporte-horas-excedidas {
  padding: 20px;
  background: white;
  border-radius: 8px;
}

h2 {
  color: #2c3e50;
  margin-bottom: 25px;
}

.controles {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ecf0f1;
}

.filtro-exceso {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filtro-exceso label {
  font-weight: 600;
  color: #2c3e50;
}

.filtro-exceso select {
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 0.95em;
}

.btn-exportar {
  padding: 10px 20px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-exportar:hover {
  background-color: #229954;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 30px;
}

.tabla-excedidas {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.tabla-excedidas thead {
  background-color: #34495e;
  color: white;
}

.tabla-excedidas th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.tabla-excedidas td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla-excedidas tr.critico {
  background-color: #fadbd8;
}

.tabla-excedidas tr.alerta {
  background-color: #fef5e7;
}

.tabla-excedidas tr.detalle-row {
  background-color: #f8f9fa;
}

.nombre-col {
  font-weight: 600;
  color: #2c3e50;
}

.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9em;
}

.badge.critico {
  background-color: #e74c3c;
  color: white;
}

.badge.alerta {
  background-color: #f39c12;
  color: white;
}

.badge.bajo {
  background-color: #f39c12;
  color: white;
  opacity: 0.7;
}

.btn-detalle {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1em;
  padding: 0;
}

.btn-detalle:hover {
  color: #2980b9;
}

.detalle-row td {
  padding: 0 !important;
}

.detalle-dias {
  padding: 20px;
  background: white;
}

.detalle-dias h4 {
  color: #2c3e50;
  margin-bottom: 12px;
}

.dias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.dia-badge {
  background-color: #ecf0f1;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  text-align: center;
  color: #2c3e50;
}

.no-dias {
  padding: 10px;
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  font-size: 0.9em;
}

.sin-datos {
  padding: 30px;
  text-align: center;
  color: #7f8c8d;
}

.estadisticas {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
  margin-bottom: 40px;
}

.estadisticas h3 {
  color: #2c3e50;
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.stat-item {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 2em;
  font-weight: 700;
}

.impacto-info {
  background: #fef5e7;
  border-left: 4px solid #f39c12;
  padding: 20px;
  border-radius: 4px;
  margin-top: 40px;
}

.impacto-info h3 {
  color: #2c3e50;
  margin-bottom: 12px;
}

.impacto-texto {
  color: #7f8c8d;
  margin: 0;
}
</style>
