<!-- src/components/ReporteAusentismo.vue -->
<template>
  <div class="reporte-ausentismo">
    <h2>📋 Reporte de Ausentismo y Faltas</h2>

    <div class="controles">
      <div class="filtro-asistencia">
        <label>Filtrar por asistencia mínima (%):</label>
        <select v-model="minAsistencia">
          <option value="">Todos</option>
          <option value="90">Excelente (90%+)</option>
          <option value="80">Bueno (80%+)</option>
          <option value="70">Aceptable (70%+)</option>
          <option value="0">Crítico (Bajo 70%)</option>
        </select>
      </div>
      <button @click="exportarPDF" class="btn-exportar">📥 Exportar PDF</button>
    </div>

    <div class="table-responsive">
      <table class="tabla-ausentismo" v-if="datosFiltrados.length > 0">
        <thead>
          <tr>
            <th>Trabajador</th>
            <th>RUC</th>
            <th>Cargo</th>
            <th>Días Laborables</th>
            <th>Días Trabajados</th>
            <th>Faltas</th>
            <th>% Asistencia</th>
            <th>Patrón</th>
            <th>Tendencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in datosFiltrados" :key="item.trabajadorId" :class="getRowClass(item)">
            <td class="nombre-col"><strong>{{ item.nombre }}</strong></td>
            <td>{{ item.ruc }}</td>
            <td>{{ item.cargo }}</td>
            <td>{{ item.diasLaborables }}</td>
            <td>{{ item.diasTrabajados }}</td>
            <td>{{ item.diasFaltados }}</td>
            <td>
              <span :class="['badge', getAsistenciaClass(item.porcentajeAsistencia)]">
                {{ item.porcentajeAsistencia.toFixed(1) }}%
              </span>
            </td>
            <td><span class="patron-badge">{{ item.patron }}</span></td>
            <td><span :class="['tendencia-badge', item.tendencia]">{{ item.tendencia }}</span></td>
          </tr>
        </tbody>
      </table>
      <div v-else class="sin-datos">No hay datos disponibles</div>
    </div>

    <div class="estadisticas">
      <h3>Estadísticas</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Total Trabajadores</div>
          <div class="stat-value">{{ datos.length }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Asistencia Promedio</div>
          <div class="stat-value">{{ asistenciaPromedio.toFixed(1) }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Críticos (Bajo 70%)</div>
          <div class="stat-value">{{ datosCriticos }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Ausentistas (Bajo 80%)</div>
          <div class="stat-value">{{ datosAusentistas }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AbsentismoResponse } from '@/types/Metricas'

const props = defineProps<{
  datos: AbsentismoResponse[]
}>()

const minAsistencia = ref('')

const datosFiltrados = computed(() => {
  if (minAsistencia.value === '') return props.datos
  const min = parseFloat(minAsistencia.value)
  if (min === 0) return props.datos.filter(d => d.porcentajeAsistencia < 70)
  return props.datos.filter(d => d.porcentajeAsistencia >= min)
})

const asistenciaPromedio = computed(() => {
  if (props.datos.length === 0) return 0
  return props.datos.reduce((sum, d) => sum + d.porcentajeAsistencia, 0) / props.datos.length
})

const datosCriticos = computed(() => {
  return props.datos.filter(d => d.porcentajeAsistencia < 70).length
})

const datosAusentistas = computed(() => {
  return props.datos.filter(d => d.porcentajeAsistencia < 80).length
})

const getRowClass = (item: AbsentismoResponse) => {
  if (item.porcentajeAsistencia < 70) return 'critico'
  if (item.porcentajeAsistencia < 80) return 'alerta'
  return 'normal'
}

const getAsistenciaClass = (asistencia: number) => {
  if (asistencia < 70) return 'critico'
  if (asistencia < 80) return 'alerta'
  return 'bueno'
}

const exportarPDF = () => {
  alert('Función de exportación a PDF en desarrollo')
}
</script>

<style scoped>
.reporte-ausentismo {
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

.filtro-asistencia {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filtro-asistencia label {
  font-weight: 600;
  color: #2c3e50;
}

.filtro-asistencia select {
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

.tabla-ausentismo {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.tabla-ausentismo thead {
  background-color: #34495e;
  color: white;
}

.tabla-ausentismo th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.tabla-ausentismo td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla-ausentismo tr.critico {
  background-color: #fadbd8;
}

.tabla-ausentismo tr.alerta {
  background-color: #fef5e7;
}

.tabla-ausentismo tr:hover {
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

.badge.bueno {
  background-color: #27ae60;
  color: white;
}

.patron-badge, .tendencia-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  background-color: #ecf0f1;
}

.tendencia-badge.MEJORANDO {
  background-color: #d5f4e6;
  color: #27ae60;
}

.tendencia-badge.EMPEORANDO {
  background-color: #fadbd8;
  color: #e74c3c;
}

.tendencia-badge.ESTABLE {
  background-color: #fef5e7;
  color: #f39c12;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
</style>
