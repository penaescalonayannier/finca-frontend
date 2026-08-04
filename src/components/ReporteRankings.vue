<!-- src/components/ReporteRankings.vue -->
<template>
  <div class="reporte-rankings">
    <h2>🏆 Rankings y Comparativas</h2>

    <div class="controles">
      <div class="filtro-cargo">
        <label>Filtrar por cargo:</label>
        <select v-model="cargoSeleccionado">
          <option value="">Todos los cargos</option>
          <option v-for="cargo in cargosUnicos" :key="cargo" :value="cargo">
            {{ cargo }}
          </option>
        </select>
      </div>
      <button @click="exportarPDF" class="btn-exportar">📥 Exportar PDF</button>
    </div>

    <div v-if="datosFiltrados.length > 0" class="rankings-container">
      <div v-for="ranking in datosFiltrados" :key="ranking.cargo" class="ranking-section">
        <div class="ranking-header">
          <h3>{{ ranking.cargo }}</h3>
          <div class="promedio-info">
            Promedio del cargo: <strong>{{ ranking.promedioCargo.toFixed(1) }}%</strong> |
            Total: {{ ranking.totalTrabajadores }} trabajadores
          </div>
        </div>

        <!-- Top 5 Performers -->
        <div class="performers-section">
          <h4 class="section-title top-title">🥇 Top 5 Mejores Desempeño</h4>
          <div class="performers-grid">
            <div v-for="performer in ranking.topPerformers" :key="performer.trabajadorId" class="performer-card top">
              <div class="ranking-badge">{{ performer.ranking }}º</div>
              <div class="performer-name">{{ performer.nombre }}</div>
              <div class="performer-stats">
                <div class="stat">
                  <span class="label">% Cumplimiento</span>
                  <span class="value">{{ performer.porcentajeCumplimiento.toFixed(1) }}%</span>
                </div>
                <div class="stat">
                  <span class="label">Horas</span>
                  <span class="value">{{ performer.totalHoras.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom 5 Performers -->
        <div class="performers-section">
          <h4 class="section-title bottom-title">📉 Bottom 5 Bajo Desempeño</h4>
          <div class="performers-grid">
            <div v-for="performer in ranking.bottomPerformers" :key="performer.trabajadorId" class="performer-card bottom">
              <div class="ranking-badge">{{ performer.ranking }}º</div>
              <div class="performer-name">{{ performer.nombre }}</div>
              <div class="performer-stats">
                <div class="stat">
                  <span class="label">% Cumplimiento</span>
                  <span class="value">{{ performer.porcentajeCumplimiento.toFixed(1) }}%</span>
                </div>
                <div class="stat">
                  <span class="label">Horas</span>
                  <span class="value">{{ performer.totalHoras.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="sin-datos">No hay datos disponibles para los filtros seleccionados</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RankingResponse } from '@/types/Metricas'

const props = defineProps<{
  datos: RankingResponse[]
}>()

const cargoSeleccionado = ref('')

const cargosUnicos = computed(() => {
  return props.datos.map(r => r.cargo).sort()
})

const datosFiltrados = computed(() => {
  if (cargoSeleccionado.value === '') return props.datos
  return props.datos.filter(r => r.cargo === cargoSeleccionado.value)
})

const exportarPDF = () => {
  alert('Función de exportación a PDF en desarrollo')
}
</script>

<style scoped>
.reporte-rankings {
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

.filtro-cargo {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filtro-cargo label {
  font-weight: 600;
  color: #2c3e50;
}

.filtro-cargo select {
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

.rankings-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.ranking-section {
  border: 1px solid #ecf0f1;
  border-radius: 8px;
  padding: 25px;
  background: #f8f9fa;
}

.ranking-header {
  margin-bottom: 25px;
}

.ranking-header h3 {
  color: #2c3e50;
  margin-bottom: 10px;
  font-size: 1.4em;
}

.promedio-info {
  color: #7f8c8d;
  font-size: 0.95em;
}

.performers-section {
  margin-bottom: 30px;
}

.section-title {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.1em;
  font-weight: 600;
  padding-bottom: 10px;
  border-bottom: 2px solid #ecf0f1;
}

.top-title {
  color: #27ae60;
  border-bottom-color: #27ae60;
}

.bottom-title {
  color: #e74c3c;
  border-bottom-color: #e74c3c;
}

.performers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.performer-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  position: relative;
  transition: transform 0.3s, box-shadow 0.3s;
  border-left: 4px solid #3498db;
}

.performer-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.performer-card.top {
  border-left-color: #f39c12;
}

.performer-card.bottom {
  border-left-color: #e74c3c;
}

.ranking-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%);
  color: white;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.85em;
}

.performer-card.bottom .ranking-badge {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.performer-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
  padding-right: 40px;
}

.performer-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat .label {
  color: #7f8c8d;
  font-size: 0.85em;
}

.stat .value {
  font-weight: 600;
  color: #2c3e50;
}

.sin-datos {
  padding: 30px;
  text-align: center;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .performers-grid {
    grid-template-columns: 1fr;
  }
}
</style>
