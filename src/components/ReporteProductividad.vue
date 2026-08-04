<!-- src/components/ReporteProductividad.vue -->
<template>
  <div class="reporte-productividad">
    <h2>⚡ Reporte de Productividad por Trabajador</h2>

    <div class="controles">
      <div class="filtro-cumplimiento">
        <label>Filtrar por cumplimiento:</label>
        <select v-model="filtroRango">
          <option value="">Todos</option>
          <option value="alto">Alto (90%+)</option>
          <option value="medio">Medio (70-89%)</option>
          <option value="bajo">Bajo (Bajo 70%)</option>
        </select>
      </div>
      <button @click="exportarPDF" class="btn-exportar">📥 Exportar PDF</button>
    </div>

    <div class="table-responsive">
      <table class="tabla-productividad" v-if="datosFiltrados.length > 0">
        <thead>
          <tr>
            <th>Trabajador</th>
            <th>Cargo</th>
            <th>Días Trabajados</th>
            <th>Total Horas</th>
            <th>Norma Esperada</th>
            <th>% Cumplimiento</th>
            <th>Promedio/Día</th>
            <th>Variabilidad</th>
            <th>Consistencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in datosFiltrados" :key="item.trabajadorId">
            <td class="nombre-col"><strong>{{ item.nombre }}</strong></td>
            <td>{{ item.cargo }}</td>
            <td>{{ item.diasTrabajados }}</td>
            <td>{{ item.totalHoras.toFixed(1) }}</td>
            <td>{{ item.normaEsperada.toFixed(1) }}</td>
            <td>
              <span :class="['badge', getCumplimientoClass(item.porcentajeCumplimiento)]">
                {{ item.porcentajeCumplimiento.toFixed(1) }}%
              </span>
            </td>
            <td>{{ item.horasPromedioDia.toFixed(2) }}</td>
            <td>{{ item.variabilidad.toFixed(2) }}</td>
            <td><span :class="['consistencia-badge', item.consistencia]">{{ item.consistencia }}</span></td>
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
          <div class="stat-label">Cumplimiento Promedio</div>
          <div class="stat-value">{{ cumplimientoPromedio.toFixed(1) }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Horas Totales</div>
          <div class="stat-value">{{ totalHoras.toFixed(0) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Bajo Rendimiento (Bajo 70%)</div>
          <div class="stat-value">{{ bajoRendimiento }}</div>
        </div>
      </div>
    </div>

    <div class="consistencia-info">
      <h3>Clasificación de Consistencia</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="badge ALTA">ALTA</span>
          <span>Variabilidad menor a 0.5 - Muy consistente</span>
        </div>
        <div class="info-item">
          <span class="badge MEDIA">MEDIA</span>
          <span>Variabilidad 0.5-1.5 - Moderadamente consistente</span>
        </div>
        <div class="info-item">
          <span class="badge BAJA">BAJA</span>
          <span>Variabilidad mayor a 1.5 - Poco consistente</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ProductividadResponse } from '@/types/Metricas'

const props = defineProps<{
  datos: ProductividadResponse[]
}>()

const filtroRango = ref('')

const datosFiltrados = computed(() => {
  if (filtroRango.value === '') return props.datos
  if (filtroRango.value === 'alto') return props.datos.filter(d => d.porcentajeCumplimiento >= 90)
  if (filtroRango.value === 'medio') return props.datos.filter(d => d.porcentajeCumplimiento >= 70 && d.porcentajeCumplimiento < 90)
  if (filtroRango.value === 'bajo') return props.datos.filter(d => d.porcentajeCumplimiento < 70)
  return props.datos
})

const cumplimientoPromedio = computed(() => {
  if (props.datos.length === 0) return 0
  return props.datos.reduce((sum, d) => sum + d.porcentajeCumplimiento, 0) / props.datos.length
})

const totalHoras = computed(() => {
  return props.datos.reduce((sum, d) => sum + d.totalHoras, 0)
})

const bajoRendimiento = computed(() => {
  return props.datos.filter(d => d.porcentajeCumplimiento < 70).length
})

const getCumplimientoClass = (cumplimiento: number) => {
  if (cumplimiento >= 90) return 'bueno'
  if (cumplimiento >= 70) return 'medio'
  return 'critico'
}

const exportarPDF = () => {
  alert('Función de exportación a PDF en desarrollo')
}
</script>

<style scoped>
.reporte-productividad {
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

.filtro-cumplimiento {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filtro-cumplimiento label {
  font-weight: 600;
  color: #2c3e50;
}

.filtro-cumplimiento select {
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

.tabla-productividad {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95em;
}

.tabla-productividad thead {
  background-color: #34495e;
  color: white;
}

.tabla-productividad th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.tabla-productividad td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla-productividad tr:hover {
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

.badge.bueno {
  background-color: #27ae60;
  color: white;
}

.badge.medio {
  background-color: #f39c12;
  color: white;
}

.badge.critico {
  background-color: #e74c3c;
  color: white;
}

.badge.ALTA {
  background-color: #27ae60;
  color: white;
}

.badge.MEDIA {
  background-color: #f39c12;
  color: white;
}

.badge.BAJA {
  background-color: #e74c3c;
  color: white;
}

.consistencia-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 600;
}

.consistencia-badge.ALTA {
  background-color: #d5f4e6;
  color: #27ae60;
}

.consistencia-badge.MEDIA {
  background-color: #fef5e7;
  color: #f39c12;
}

.consistencia-badge.BAJA {
  background-color: #fadbd8;
  color: #e74c3c;
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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

.consistencia-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.consistencia-info h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.info-item span:last-child {
  color: #7f8c8d;
  font-size: 0.9em;
}
</style>
