<!-- src/views/ReportesView.vue -->
<template>
  <div class="reportes-view">
    <!-- Header con navegación -->
    <div class="reportes-header">
      <router-link to="/gerencial-dashboard" class="btn-volver">
        ← Volver al Dashboard
      </router-link>
      <h1>{{ getTituloReporte() }}</h1>

      <!-- Selector de período -->
      <div class="periodo-selector">
        <select v-model="yearSeleccionado" @change="cargarDatos">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
        <select v-model="mesSeleccionado" @change="cargarDatos">
          <option v-for="mes in meses" :key="mes" :value="mes">
            {{ mes }}
          </option>
        </select>
        <button @click="cargarDatos" :disabled="isLoading">
          {{ isLoading ? 'Cargando...' : '🔄 Actualizar' }}
        </button>
      </div>
    </div>
    <div v-if="mensajeError" class="error-banner" role="alert">{{ mensajeError }}</div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Cargando datos...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="datosReporte" class="reportes-content">
      <ReporteAusentismo v-if="tipoReporte === 'ausentismo'" :datos="datosReporte" />
      <ReporteProductividad v-if="tipoReporte === 'productividad'" :datos="datosReporte" />
      <ReporteRankings v-if="tipoReporte === 'rankings'" :datos="datosReporte" />
      <ReporteHorasExcedidas v-if="tipoReporte === 'horas-excedidas'" :datos="datosReporte" />
    </div>

    <!-- Sin datos -->
    <div v-else class="no-data">
      <p>No hay datos disponibles. Seleccione un período y presione actualizar.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ReportesMetricasService from '@/services/ReportesMetricasService'
import ReporteAusentismo from '@/components/ReporteAusentismo.vue'
import ReporteProductividad from '@/components/ReporteProductividad.vue'
import ReporteRankings from '@/components/ReporteRankings.vue'
import ReporteHorasExcedidas from '@/components/ReporteHorasExcedidas.vue'
import { notify } from '@/composables/useNotification'

const route = useRoute()

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const isLoading = ref(false)
const fechaActual = new Date()
const yearSeleccionado = ref(String(fechaActual.getFullYear()))
const mesSeleccionado = ref(meses[fechaActual.getMonth()])
const datosReporte = ref<any>(null)
const mensajeError = ref('')

const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearsList = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    yearsList.push(i.toString())
  }
  return yearsList
})

const tipoReporte = computed(() => {
  const path = route.path
  if (path.includes('ausentismo')) return 'ausentismo'
  if (path.includes('productividad')) return 'productividad'
  if (path.includes('rankings')) return 'rankings'
  if (path.includes('horas-excedidas')) return 'horas-excedidas'
  return ''
})

const getTituloReporte = () => {
  if (tipoReporte.value === 'ausentismo') return '📋 Reporte de Ausentismo'
  if (tipoReporte.value === 'productividad') return '⚡ Reporte de Productividad'
  if (tipoReporte.value === 'rankings') return '🏆 Rankings y Comparativas'
  if (tipoReporte.value === 'horas-excedidas') return '⏰ Horas Excedidas'
  return 'Reporte'
}

const cargarDatos = async () => {
  if (!yearSeleccionado.value || !mesSeleccionado.value) {
    return
  }

  isLoading.value = true
  mensajeError.value = ''
  try {
    if (tipoReporte.value === 'ausentismo') {
      const res = await ReportesMetricasService.obtenerAbsentismo(yearSeleccionado.value, mesSeleccionado.value)
      datosReporte.value = res.data.items
    } else if (tipoReporte.value === 'productividad') {
      const res = await ReportesMetricasService.obtenerProductividad(yearSeleccionado.value, mesSeleccionado.value)
      datosReporte.value = res.data.items
    } else if (tipoReporte.value === 'rankings') {
      const res = await ReportesMetricasService.obtenerRankings(yearSeleccionado.value, mesSeleccionado.value)
      datosReporte.value = res.data.items
    } else if (tipoReporte.value === 'horas-excedidas') {
      const res = await ReportesMetricasService.obtenerHorasExceditasSummary(yearSeleccionado.value, mesSeleccionado.value)
      datosReporte.value = res.data.items
    }
  } catch (error) {
    console.error('Error al cargar datos:', error)
    datosReporte.value = null
    mensajeError.value = 'No se pudo cargar el reporte para el período seleccionado. Intente nuevamente.'
    notify.error('Error al cargar el reporte', mensajeError.value)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // Los valores ya están inicializados, solo cargar datos
  cargarDatos()
})
</script>

<style scoped>
.reportes-view {
  min-height: 100vh;
  background: #f5f7fa;
}

.reportes-header {
  background: white;
  padding: 25px;
  border-bottom: 1px solid #ecf0f1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.error-banner { margin: 0 auto 16px; max-width: 1200px; padding: 12px 16px; color: #842029; background: #f8d7da; border: 1px solid #f5c2c7; border-radius: 8px; }

.btn-volver {
  display: inline-block;
  padding: 8px 15px;
  background-color: #95a5a6;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9em;
  margin-bottom: 15px;
  transition: background-color 0.3s;
  cursor: pointer;
}

.btn-volver:hover {
  background-color: #7f8c8d;
}

.reportes-header h1 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 2em;
}

.periodo-selector {
  display: flex;
  gap: 15px;
  align-items: center;
}

.periodo-selector select {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 0.95em;
  min-width: 120px;
}

.periodo-selector button {
  padding: 10px 20px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.periodo-selector button:hover:not(:disabled) {
  background-color: #2980b9;
}

.periodo-selector button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.reportes-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 15px 30px;
}

.loading {
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

.no-data {
  max-width: 1400px;
  margin: 0 auto;
  padding: 60px 15px;
  text-align: center;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
  font-size: 1.1em;
}
</style>
