<!-- src/views/GerencialDashboard.vue -->

<template>
  <div class="gerencial-dashboard">
    <h1>📊 Dashboard Gerencial</h1>
    <p class="subtitle">Reportes estratégicos para la toma de decisiones</p>

    <!-- Selector de Período -->
    <div class="periodo-selector">
      <div class="selector-group">
        <label for="year">Año</label>
        <select v-model="yearSeleccionado" id="year" @change="cargarDatos">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <div class="selector-group">
        <label for="mes">Mes</label>
        <select v-model="mesSeleccionado" id="mes" @change="cargarDatos">
          <option v-for="mes in meses" :key="mes" :value="mes">
            {{ mes }}
          </option>
        </select>
      </div>

      <button @click="cargarDatos" class="btn-consultar" :disabled="isLoading">
        {{ isLoading ? 'Cargando...' : '🔄 Actualizar' }}
      </button>
    </div>

    <!-- Spinner de carga -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Generando reportes...</p>
    </div>

    <!-- Resumen Ejecutivo (KPIs) -->
    <div v-else-if="datosResumen" class="resumen-ejecutivo">
      <h2>Resumen Ejecutivo</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">📋</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ datosResumen.porcentajeAsistenciaPromedio.toFixed(1) }}%</div>
            <div class="kpi-label">Asistencia Promedio</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">⚡</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ datosResumen.porcentajeCumplimientoPromedio.toFixed(1) }}%</div>
            <div class="kpi-label">Cumplimiento Promedio</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">👤</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ datosResumen.totalTrabajadores }}</div>
            <div class="kpi-label">Total Trabajadores</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">⚠️</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ datosResumen.totalAusentistas }}</div>
            <div class="kpi-label">Ausentistas</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">⏰</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ datosResumen.totalHorasExceditasEnMes.toFixed(1) }}</div>
            <div class="kpi-label">Horas Excedidas</div>
          </div>
        </div>

        <div class="kpi-card top-performer" v-if="datosResumen.trabajadorMasProductivo">
          <div class="kpi-icon">🏆</div>
          <div class="kpi-content">
            <div class="kpi-value">{{ datosResumen.trabajadorMasProductivo.nombre }}</div>
            <div class="kpi-label">Más Productivo</div>
            <div class="kpi-sub">({{ datosResumen.trabajadorMasProductivo.porcentajeCumplimiento.toFixed(1) }}%)</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de Reportes -->
    <div v-if="!isLoading" class="reportes-section">
      <h2>Reportes Disponibles</h2>
      <div class="reportes-grid">
        <router-link to="/reportes/ausentismo" class="reporte-card ausentismo" @click="scroll">
          <div class="reporte-icon">📋</div>
          <h3>Ausentismo y Faltas</h3>
          <p>Identifica patrones de inasistencia y trabajadores problemáticos</p>
          <div class="reporte-stats" v-if="datosAbsentismo">
            Total: {{ datosAbsentismo.items.length }} registros
          </div>
        </router-link>

        <router-link to="/reportes/productividad" class="reporte-card productividad" @click="scroll">
          <div class="reporte-icon">⚡</div>
          <h3>Productividad por Trabajador</h3>
          <p>Mide cumplimiento de norma y rendimiento individual</p>
          <div class="reporte-stats" v-if="datosProductividad">
            Total: {{ datosProductividad.items.length }} trabajadores
          </div>
        </router-link>

        <router-link to="/reportes/rankings" class="reporte-card rankings" @click="scroll">
          <div class="reporte-icon">🏆</div>
          <h3>Rankings y Comparativas</h3>
          <p>Identifica top performers y bajo rendimiento por cargo</p>
          <div class="reporte-stats" v-if="datosRankings">
            Total: {{ datosRankings.items.length }} cargos
          </div>
        </router-link>

        <router-link to="/reportes/horas-excedidas" class="reporte-card excedidas" @click="scroll">
          <div class="reporte-icon">⏰</div>
          <h3>Horas Excedidas</h3>
          <p>Control de sobretiempo y costos laborales</p>
          <div class="reporte-stats" v-if="datosExcedidas">
            Total: {{ datosExcedidas.items.length }} trabajadores
          </div>
        </router-link>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-if="!isLoading && !datosResumen" class="no-data">
      <p>No hay datos disponibles para el período seleccionado</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ReportesMetricasService from '@/services/ReportesMetricasService'
import type {
  AbsentismoListResponse,
  ProductividadListResponse,
  RankingsListResponse,
  HorasExcedidasSummaryListResponse,
  MetricasResumen
} from '@/types/Metricas'

// Lista de meses
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Usar Julio 2026 por defecto (datos disponibles en BD)
const isLoading = ref(false)
const yearSeleccionado = ref('2026')
const mesSeleccionado = ref('Julio')

const datosAbsentismo = ref<AbsentismoListResponse | null>(null)
const datosProductividad = ref<ProductividadListResponse | null>(null)
const datosRankings = ref<RankingsListResponse | null>(null)
const datosExcedidas = ref<HorasExcedidasSummaryListResponse | null>(null)
const datosResumen = ref<MetricasResumen | null>(null)

// Lista de años
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearsList = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    yearsList.push(i.toString())
  }
  return yearsList
})

const cargarDatos = async () => {
  if (!yearSeleccionado.value || !mesSeleccionado.value) {
    return
  }

  isLoading.value = true
  try {
    // Cargar todos los reportes en paralelo
    const [ausentismoRes, productividadRes, rankingsRes, excedidasRes] = await Promise.all([
      ReportesMetricasService.obtenerAbsentismo(yearSeleccionado.value, mesSeleccionado.value),
      ReportesMetricasService.obtenerProductividad(yearSeleccionado.value, mesSeleccionado.value),
      ReportesMetricasService.obtenerRankings(yearSeleccionado.value, mesSeleccionado.value),
      ReportesMetricasService.obtenerHorasExceditasSummary(yearSeleccionado.value, mesSeleccionado.value)
    ])

    datosAbsentismo.value = ausentismoRes.data
    datosProductividad.value = productividadRes.data
    datosRankings.value = rankingsRes.data
    datosExcedidas.value = excedidasRes.data

    // Calcular resumen
    calcularResumen()
  } catch (error) {
    console.error('Error al cargar datos:', error)
  } finally {
    isLoading.value = false
  }
}

const calcularResumen = () => {
  if (!datosAbsentismo.value || !datosProductividad.value || !datosRankings.value || !datosExcedidas.value) {
    return
  }

  const ausentismo = datosAbsentismo.value.items
  const productividad = datosProductividad.value.items
  const excedidas = datosExcedidas.value.items

  // Calcular promedios
  const porcentajeAsistenciaPromedio = ausentismo.length > 0
    ? ausentismo.reduce((sum, a) => sum + a.porcentajeAsistencia, 0) / ausentismo.length
    : 0

  const porcentajeCumplimientoPromedio = productividad.length > 0
    ? productividad.reduce((sum, p) => sum + p.porcentajeCumplimiento, 0) / productividad.length
    : 0

  // Trabajador más y menos productivo
  const trabajadorMasProductivo = productividad.length > 0
    ? productividad.reduce((prev, current) =>
        current.porcentajeCumplimiento > prev.porcentajeCumplimiento ? current : prev
      )
    : null

  const trabajadorMenosProductivo = productividad.length > 0
    ? productividad.reduce((prev, current) =>
        current.porcentajeCumplimiento < prev.porcentajeCumplimiento ? current : prev
      )
    : null

  // Total horas excedidas
  const totalHorasExceditasEnMes = excedidas.length > 0
    ? excedidas.reduce((sum, e) => sum + e.totalHorasExcedidas, 0)
    : 0

  // Total ausentistas (asistencia < 80%)
  const totalAusentistas = ausentismo.filter(a => a.porcentajeAsistencia < 80).length

  datosResumen.value = {
    porcentajeAsistenciaPromedio,
    porcentajeCumplimientoPromedio,
    trabajadorMasProductivo: trabajadorMasProductivo ? {
      ranking: 1,
      trabajadorId: trabajadorMasProductivo.trabajadorId,
      nombre: trabajadorMasProductivo.nombre,
      ruc: trabajadorMasProductivo.ruc,
      cargo: trabajadorMasProductivo.cargo,
      indiceProductividad: trabajadorMasProductivo.porcentajeCumplimiento,
      totalHoras: trabajadorMasProductivo.totalHoras,
      porcentajeCumplimiento: trabajadorMasProductivo.porcentajeCumplimiento
    } : null,
    trabajadorMenosProductivo: trabajadorMenosProductivo ? {
      ranking: productividad.length,
      trabajadorId: trabajadorMenosProductivo.trabajadorId,
      nombre: trabajadorMenosProductivo.nombre,
      ruc: trabajadorMenosProductivo.ruc,
      cargo: trabajadorMenosProductivo.cargo,
      indiceProductividad: trabajadorMenosProductivo.porcentajeCumplimiento,
      totalHoras: trabajadorMenosProductivo.totalHoras,
      porcentajeCumplimiento: trabajadorMenosProductivo.porcentajeCumplimiento
    } : null,
    totalHorasExceditasEnMes,
    totalTrabajadores: productividad.length,
    totalAusentistas
  }
}

const scroll = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Cargar datos iniciales
onMounted(() => {
  // Los valores ya están inicializados, solo cargar datos
  cargarDatos()
})
</script>

<style scoped>
.gerencial-dashboard {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

h1 {
  color: #2c3e50;
  margin-bottom: 5px;
  font-size: 2.5em;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 1.1em;
}

/* Selector de Período */
.periodo-selector {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  margin-bottom: 40px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selector-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95em;
}

.selector-group select {
  padding: 10px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 1em;
  min-width: 120px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.selector-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.btn-consultar {
  padding: 10px 25px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-consultar:hover:not(:disabled) {
  background-color: #2980b9;
}

.btn-consultar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Resumen Ejecutivo */
.resumen-ejecutivo {
  margin-bottom: 50px;
}

.resumen-ejecutivo h2 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 1.8em;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.kpi-card.top-performer {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.kpi-icon {
  font-size: 2.5em;
  flex-shrink: 0;
}

.kpi-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-value {
  font-size: 2em;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.kpi-card.top-performer .kpi-value {
  color: white;
}

.kpi-label {
  font-size: 0.9em;
  color: #7f8c8d;
  margin-top: 5px;
}

.kpi-card.top-performer .kpi-label {
  color: rgba(255, 255, 255, 0.9);
}

.kpi-sub {
  font-size: 0.85em;
  color: #bdc3c7;
  margin-top: 3px;
}

.kpi-card.top-performer .kpi-sub {
  color: rgba(255, 255, 255, 0.8);
}

/* Reportes Grid */
.reportes-section {
  margin-top: 40px;
}

.reportes-section h2 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 1.8em;
}

.reportes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.reporte-card {
  background: white;
  border-radius: 8px;
  padding: 25px;
  text-decoration: none;
  color: inherit;
  border-left: 5px solid #3498db;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.reporte-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.reporte-card.ausentismo {
  border-left-color: #e74c3c;
}

.reporte-card.productividad {
  border-left-color: #f39c12;
}

.reporte-card.rankings {
  border-left-color: #9b59b6;
}

.reporte-card.excedidas {
  border-left-color: #e67e22;
}

.reporte-icon {
  font-size: 2.5em;
  margin-bottom: 15px;
}

.reporte-card h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.3em;
}

.reporte-card p {
  color: #7f8c8d;
  margin-bottom: 15px;
  flex-grow: 1;
}

.reporte-stats {
  font-size: 0.9em;
  color: #3498db;
  font-weight: 600;
  padding-top: 15px;
  border-top: 1px solid #ecf0f1;
}

/* Sin datos */
.no-data {
  background: white;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
  color: #7f8c8d;
  font-size: 1.1em;
}

/* Responsive */
@media (max-width: 768px) {
  .gerencial-dashboard {
    padding: 15px;
  }

  h1 {
    font-size: 1.8em;
  }

  .periodo-selector {
    flex-direction: column;
    align-items: stretch;
  }

  .selector-group select {
    min-width: auto;
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .reportes-grid {
    grid-template-columns: 1fr;
  }
}
</style>
