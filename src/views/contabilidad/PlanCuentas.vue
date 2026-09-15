<template>
  <div class="plan-cuentas">
    <div class="page-header">
      <h1>Plan de Cuentas</h1>
      <p class="subtitle">Nomenclador de Cuentas según Res. 494/2016 MFP</p>
    </div>

    <!-- Filtros y búsqueda -->
    <div class="filters-card">
      <div class="filters-row">
        <div class="search-group">
          <i class="fas fa-search"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Buscar por código o nombre..."
            @input="searchCuentas"
          />
        </div>
        <div class="filter-group">
          <label>Tipo:</label>
          <select v-model="filtroTipo" @change="filterCuentas">
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="PASIVO">Pasivo</option>
            <option value="PATRIMONIO">Patrimonio</option>
            <option value="INGRESO">Ingreso</option>
            <option value="GASTO">Gasto</option>
            <option value="COSTO">Costo</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Mostrar:</label>
          <select v-model="filtroMostrar" @change="filterCuentas">
            <option value="todas">Todas</option>
            <option value="movibles">Solo movibles</option>
            <option value="centros">Centros de costo</option>
          </select>
        </div>
      </div>

      <div class="stats-row">
        <span class="stat">
          <strong>{{ cuentasFiltradas.length }}</strong> cuentas
        </span>
        <span class="stat">
          <strong>{{ cuentasMovibles }}</strong> movibles
        </span>
        <span class="stat">
          <strong>{{ centrosCosto }}</strong> centros de costo
        </span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando plan de cuentas...</p>
    </div>

    <!-- Lista de cuentas -->
    <div v-else class="cuentas-list">
      <div v-if="cuentasFiltradas.length === 0" class="empty-state">
        <i class="fas fa-folder-open"></i>
        <p>No se encontraron cuentas</p>
      </div>

      <div
        v-for="cuenta in cuentasFiltradas"
        :key="cuenta.id"
        class="cuenta-card"
        :class="[
          `nivel-${cuenta.nivel}`,
          { 'movible': cuenta.permiteMovimientos },
          { 'centro-costo': cuenta.esCentroCosto }
        ]"
      >
        <div class="cuenta-info">
          <span class="cuenta-codigo">{{ cuenta.codigo }}</span>
          <span class="cuenta-nombre">{{ cuenta.nombre }}</span>
        </div>

        <div class="cuenta-badges">
          <span class="tipo-badge" :class="getTipoClass(cuenta.tipo)">
            {{ cuenta.tipo }}
          </span>
          <span class="naturaleza-badge" :class="cuenta.naturaleza.toLowerCase()">
            {{ cuenta.naturaleza === 'DEUDORA' ? 'D' : 'A' }}
          </span>
          <span v-if="cuenta.permiteMovimientos" class="badge movible" title="Permite movimientos">
            <i class="fas fa-check"></i>
          </span>
          <span v-if="cuenta.esCentroCosto" class="badge centro" title="Centro de Costo">
            <i class="fas fa-building"></i>
          </span>
        </div>

        <div v-if="cuenta.descripcion" class="cuenta-descripcion">
          {{ cuenta.descripcion }}
        </div>
      </div>
    </div>

    <!-- Leyenda -->
    <div class="leyenda">
      <h4>Leyenda</h4>
      <div class="leyenda-items">
        <span class="leyenda-item">
          <span class="tipo-badge activo">ACTIVO</span> Bienes y derechos
        </span>
        <span class="leyenda-item">
          <span class="tipo-badge pasivo">PASIVO</span> Obligaciones
        </span>
        <span class="leyenda-item">
          <span class="tipo-badge patrimonio">PATRIMONIO</span> Capital
        </span>
        <span class="leyenda-item">
          <span class="tipo-badge ingreso">INGRESO</span> Ingresos
        </span>
        <span class="leyenda-item">
          <span class="tipo-badge gasto">GASTO</span> Gastos
        </span>
        <span class="leyenda-item">
          <span class="tipo-badge costo">COSTO</span> Costos
        </span>
        <span class="leyenda-item">
          <span class="naturaleza-badge deudora">D</span> Naturaleza Deudora
        </span>
        <span class="leyenda-item">
          <span class="naturaleza-badge acreedora">A</span> Naturaleza Acreedora
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CuentaContableService } from '@/services/ContabilidadService'
import type { CuentaContable, TipoCuenta } from '@/types/Contabilidad'

const loading = ref(false)
const cuentas = ref<CuentaContable[]>([])
const searchQuery = ref('')
const filtroTipo = ref('')
const filtroMostrar = ref('todas')

const cuentasFiltradas = computed(() => {
  let result = cuentas.value

  // Filtro por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (c) =>
        c.codigo.toLowerCase().includes(query) ||
        c.nombre.toLowerCase().includes(query)
    )
  }

  // Filtro por tipo
  if (filtroTipo.value) {
    result = result.filter((c) => c.tipo === filtroTipo.value)
  }

  // Filtro por movibles/centros
  if (filtroMostrar.value === 'movibles') {
    result = result.filter((c) => c.permiteMovimientos)
  } else if (filtroMostrar.value === 'centros') {
    result = result.filter((c) => c.esCentroCosto)
  }

  return result
})

const cuentasMovibles = computed(() => {
  return cuentas.value.filter((c) => c.permiteMovimientos).length
})

const centrosCosto = computed(() => {
  return cuentas.value.filter((c) => c.esCentroCosto).length
})

const loadCuentas = async () => {
  loading.value = true
  try {
    cuentas.value = await CuentaContableService.getAll()
  } catch (error) {
    console.error('Error loading cuentas:', error)
  } finally {
    loading.value = false
  }
}

const searchCuentas = () => {
  // The filtering is handled by the computed property
}

const filterCuentas = () => {
  // The filtering is handled by the computed property
}

const getTipoClass = (tipo: TipoCuenta): string => {
  return tipo.toLowerCase()
}

onMounted(() => {
  loadCuentas()
})
</script>

<style scoped>
.plan-cuentas {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.subtitle {
  color: #6c757d;
  margin: 0.25rem 0 0 0;
}

.filters-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-group {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-group i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-group input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: #6c757d;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.stats-row {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.stat {
  font-size: 0.875rem;
  color: #6c757d;
}

.loading-container {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.cuenta-card {
  background: white;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-left: 3px solid transparent;
}

.cuenta-card.nivel-1 {
  font-weight: 600;
  background: #f8f9fa;
  border-left-color: #007bff;
}

.cuenta-card.nivel-2 {
  padding-left: 1.5rem;
  border-left-color: #17a2b8;
}

.cuenta-card.nivel-3 {
  padding-left: 2.5rem;
  font-size: 0.875rem;
  border-left-color: #28a745;
}

.cuenta-card.centro-costo {
  border-left-color: #ffc107;
}

.cuenta-info {
  flex: 1;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.cuenta-codigo {
  font-family: monospace;
  font-weight: 600;
  color: #007bff;
  min-width: 60px;
}

.cuenta-nombre {
  color: #495057;
}

.cuenta-badges {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tipo-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 600;
}

.tipo-badge.activo {
  background: #d4edda;
  color: #155724;
}

.tipo-badge.pasivo {
  background: #f8d7da;
  color: #721c24;
}

.tipo-badge.patrimonio {
  background: #d1ecf1;
  color: #0c5460;
}

.tipo-badge.ingreso {
  background: #cce5ff;
  color: #004085;
}

.tipo-badge.gasto {
  background: #fff3cd;
  color: #856404;
}

.tipo-badge.costo {
  background: #e2e3e5;
  color: #383d41;
}

.naturaleza-badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 600;
}

.naturaleza-badge.deudora {
  background: #28a745;
  color: white;
}

.naturaleza-badge.acreedora {
  background: #dc3545;
  color: white;
}

.badge {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
}

.badge.movible {
  background: #28a745;
  color: white;
}

.badge.centro {
  background: #ffc107;
  color: #212529;
}

.cuenta-descripcion {
  flex-basis: 100%;
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
  padding-left: 4.5rem;
}

.leyenda {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.leyenda h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #6c757d;
}

.leyenda-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.leyenda-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6c757d;
}
</style>
