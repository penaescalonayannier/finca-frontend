<template>
  <div class="depreciacion-view">
    <div class="header">
      <h2>Control de Depreciación</h2>
      <p class="subtitle">Según NCC No. 7 (Resolución 1038/2017 MFP)</p>
    </div>

    <div class="cards-row">
      <div class="card">
        <h3>Cierre Mensual</h3>
        <p>Ejecutar cierre de depreciación para todos los activos</p>
        <div class="form-row">
          <div class="form-group">
            <label>Mes</label>
            <select v-model="cierreMes">
              <option v-for="m in 12" :key="m" :value="m">{{ nombreMes(m) }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Año</label>
            <input v-model.number="cierreAnio" type="number" min="2020" max="2030" />
          </div>
        </div>
        <div class="card-status" v-if="existeCierreActual !== null">
          <span :class="existeCierreActual ? 'status-warning' : 'status-ok'">
            {{ existeCierreActual ? '⚠️ Ya existe cierre para este período' : '✅ Período disponible' }}
          </span>
        </div>
        <button
          @click="ejecutarCierre"
          :disabled="ejecutandoCierre || existeCierreActual"
          class="btn-primary"
        >
          {{ ejecutandoCierre ? 'Ejecutando...' : 'Ejecutar Cierre' }}
        </button>
      </div>

      <div class="card">
        <h3>Reporte Anual</h3>
        <p>Generar reporte de depreciación por año</p>
        <div class="form-group">
          <label>Año</label>
          <input v-model.number="reporteAnio" type="number" min="2020" max="2030" />
        </div>
        <button @click="generarReporte" :disabled="generandoReporte" class="btn-primary">
          {{ generandoReporte ? 'Generando...' : 'Generar Reporte' }}
        </button>
      </div>
    </div>

    <!-- Resultados del cierre -->
    <div v-if="resultadoCierre" class="resultado-cierre">
      <h3>Resultado del Cierre</h3>
      <p class="mensaje">{{ resultadoCierre.mensaje }}</p>
      <p><strong>Total movimientos:</strong> {{ resultadoCierre.totalMovimientos }}</p>

      <table v-if="resultadoCierre.movimientos.length > 0" class="data-table">
        <thead>
          <tr>
            <th>No. Inventario</th>
            <th>Activo</th>
            <th>Tasa %</th>
            <th>Depreciación</th>
            <th>Acum. Anterior</th>
            <th>Acum. Nueva</th>
            <th>Valor Residual</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mov in resultadoCierre.movimientos" :key="mov.id">
            <td>{{ mov.numeroInventario }}</td>
            <td>{{ mov.descripcionActivo }}</td>
            <td class="numero">{{ mov.tasaAplicada }}%</td>
            <td class="numero">{{ formatCurrency(mov.montoDepreciacion) }}</td>
            <td class="numero">{{ formatCurrency(mov.depreciacionAcumuladaAnterior) }}</td>
            <td class="numero">{{ formatCurrency(mov.depreciacionAcumuladaNueva) }}</td>
            <td class="numero">{{ formatCurrency(mov.valorResidualResultante) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reporte Anual -->
    <div v-if="reporteAnual.length > 0" class="reporte-anual">
      <h3>Reporte de Depreciación {{ reporteAnio }}</h3>

      <table class="data-table">
        <thead>
          <tr>
            <th>Grupo</th>
            <th>No. Inventario</th>
            <th>Descripción</th>
            <th>Valor Adq.</th>
            <th>Tasa %</th>
            <th>Dep. Anual</th>
            <th>Dep. Acum.</th>
            <th>V. Residual</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reporteAnual" :key="item.activoId">
            <td>{{ item.codigoGrupo }}</td>
            <td>{{ item.numeroInventario }}</td>
            <td>{{ item.descripcion }}</td>
            <td class="numero">{{ formatCurrency(item.valorAdquisicion) }}</td>
            <td class="numero">{{ item.tasaDepreciacion }}%</td>
            <td class="numero">{{ formatCurrency(item.depreciacionAnual) }}</td>
            <td class="numero">{{ formatCurrency(item.depreciacionAcumulada) }}</td>
            <td class="numero">{{ formatCurrency(item.valorResidual) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>TOTALES</strong></td>
            <td class="numero"><strong>{{ formatCurrency(totalValorAdq) }}</strong></td>
            <td></td>
            <td class="numero"><strong>{{ formatCurrency(totalDepAnual) }}</strong></td>
            <td class="numero"><strong>{{ formatCurrency(totalDepAcum) }}</strong></td>
            <td class="numero"><strong>{{ formatCurrency(totalVResidual) }}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { DepreciacionService } from '@/services/ActivoFijoService'
import type { MovimientoDepreciacion, ReporteDepreciacion } from '@/types/ActivoFijo'

const hoy = new Date()
const cierreMes = ref(hoy.getMonth() + 1)
const cierreAnio = ref(hoy.getFullYear())
const reporteAnio = ref(hoy.getFullYear())

const ejecutandoCierre = ref(false)
const generandoReporte = ref(false)
const existeCierreActual = ref<boolean | null>(null)

const resultadoCierre = ref<{
  mensaje: string
  movimientos: MovimientoDepreciacion[]
  totalMovimientos: number
} | null>(null)

const reporteAnual = ref<ReporteDepreciacion[]>([])

const nombreMes = (mes: number) => {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return meses[mes - 1]
}

const formatCurrency = (value: number | undefined) => {
  if (value === undefined || value === null) return '-'
  return new Intl.NumberFormat('es-CU', { style: 'currency', currency: 'CUP' }).format(value)
}

const verificarCierre = async () => {
  try {
    const response = await DepreciacionService.existeCierre(cierreMes.value, cierreAnio.value)
    existeCierreActual.value = response.data.existeCierre
  } catch (error) {
    console.error('Error verificando cierre:', error)
    existeCierreActual.value = null
  }
}

watch([cierreMes, cierreAnio], () => {
  verificarCierre()
  resultadoCierre.value = null
}, { immediate: true })

const ejecutarCierre = async () => {
  if (existeCierreActual.value) return

  ejecutandoCierre.value = true
  try {
    const response = await DepreciacionService.ejecutarCierreMensual(cierreMes.value, cierreAnio.value)
    resultadoCierre.value = response.data
    verificarCierre()
  } catch (error: unknown) {
    console.error('Error ejecutando cierre:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    alert('Error al ejecutar cierre: ' + errorMessage)
  } finally {
    ejecutandoCierre.value = false
  }
}

const generarReporte = async () => {
  generandoReporte.value = true
  try {
    const response = await DepreciacionService.generarReporteAnual(reporteAnio.value)
    reporteAnual.value = response.data
  } catch (error) {
    console.error('Error generando reporte:', error)
    alert('Error al generar reporte')
  } finally {
    generandoReporte.value = false
  }
}

const totalValorAdq = computed(() =>
  reporteAnual.value.reduce((sum, item) => sum + (item.valorAdquisicion || 0), 0))

const totalDepAnual = computed(() =>
  reporteAnual.value.reduce((sum, item) => sum + (item.depreciacionAnual || 0), 0))

const totalDepAcum = computed(() =>
  reporteAnual.value.reduce((sum, item) => sum + (item.depreciacionAcumulada || 0), 0))

const totalVResidual = computed(() =>
  reporteAnual.value.reduce((sum, item) => sum + (item.valorResidual || 0), 0))
</script>

<style scoped>
.depreciacion-view {
  padding: 20px;
}

.header {
  margin-bottom: 24px;
}

.subtitle {
  color: #6b7280;
  margin-top: 4px;
}

.cards-row {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex: 1;
  min-width: 300px;
}

.card h3 {
  margin-top: 0;
  margin-bottom: 8px;
}

.card p {
  color: #6b7280;
  margin-bottom: 16px;
}

.card-status {
  margin-bottom: 12px;
}

.status-warning {
  color: #d97706;
}

.status-ok {
  color: #059669;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input, .form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
}

.btn-primary {
  background: #2563eb;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.resultado-cierre, .reporte-anual {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.mensaje {
  color: #059669;
  font-weight: 500;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.data-table th, .data-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 13px;
}

.data-table tfoot {
  background: #f3f4f6;
}

.numero {
  text-align: right;
  font-family: monospace;
}
</style>
