<!-- src/views/HomeView.vue -->

<template>
  <div class="home-view">
    <!-- Hero / Banner -->
    <div class="hero-section">
      <div class="hero-content">
        <h1>🏢 Sistema de Gestión de Finca</h1>
        <p class="subtitle">Panel de control administrativo</p>
      </div>
    </div>

    <!-- Dashboard de Métricas -->
    <div class="metrics-dashboard">
      <div class="metrics-grid">
        <div class="metric-card metric-blue" @click="$router.push('/trabajadores')">
          <div class="metric-icon">👷</div>
          <div class="metric-info">
            <div class="metric-value">{{ isLoading ? '...' : metrics.trabajadores.activos }}</div>
            <div class="metric-label">Trabajadores Activos</div>
          </div>
        </div>

        <div class="metric-card metric-green" @click="$router.push('/productos')">
          <div class="metric-icon">📦</div>
          <div class="metric-info">
            <div class="metric-value">{{ isLoading ? '...' : metrics.productos.total }}</div>
            <div class="metric-label">Productos</div>
          </div>
        </div>

        <div class="metric-card metric-teal" @click="$router.push('/fincas')">
          <div class="metric-icon">🌾</div>
          <div class="metric-info">
            <div class="metric-value">{{ isLoading ? '...' : metrics.fincas.total }}</div>
            <div class="metric-label">Fincas</div>
          </div>
        </div>

        <div class="metric-card metric-orange" :class="{ 'metric-alert': metrics.productos.stockBajo > 0 }" @click="$router.push('/finca-productos')">
          <div class="metric-icon">⚠️</div>
          <div class="metric-info">
            <div class="metric-value">{{ isLoading ? '...' : metrics.productos.stockBajo }}</div>
            <div class="metric-label">Stock Bajo (&lt;10)</div>
          </div>
        </div>

        <div class="metric-card metric-red" :class="{ 'metric-alert': metrics.deudas.trabajadoresConDeuda > 0 }" @click="$router.push('/deudas-trabajadores')">
          <div class="metric-icon">💰</div>
          <div class="metric-info">
            <div class="metric-value">${{ isLoading ? '...' : formatCurrency(metrics.deudas.totalPendiente) }}</div>
            <div class="metric-label">Deudas Pendientes ({{ metrics.deudas.trabajadoresConDeuda }})</div>
          </div>
        </div>

        <router-link to="/salidas" class="metric-card metric-purple action-card">
          <div class="metric-icon">📤</div>
          <div class="metric-info">
            <div class="metric-value">+</div>
            <div class="metric-label">Nueva Salida</div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Menú de módulos -->
    <div class="menu-grid">
      <!-- Financiero -->
      <div class="menu-section">
        <h2 class="section-title">💰 Financiero</h2>
        <div class="section-grid">
          <router-link to="/estado-cuenta" class="menu-card card-blue">
            <div class="card-icon">📊</div>
            <div class="card-content">
              <h3>Estados de Cuenta</h3>
              <p>Consultar, crear y gestionar estados de cuenta</p>
              <span class="card-badge">Gestión</span>
            </div>
          </router-link>

          <router-link to="/prestamos" class="menu-card card-red">
            <div class="card-icon">💰</div>
            <div class="card-content">
              <h3>Préstamos</h3>
              <p>Gestionar préstamos y contratos</p>
              <span class="card-badge">Financiero</span>
            </div>
          </router-link>

          <router-link to="/toma-prestamos" class="menu-card card-teal">
            <div class="card-icon">📥</div>
            <div class="card-content">
              <h3>Toma de Préstamos</h3>
              <p>Registrar tomas de efectivo, suministros y seguros</p>
              <span class="card-badge">Operaciones</span>
            </div>
          </router-link>

          <router-link to="/salidas" class="menu-card card-red">
            <div class="card-icon">📤</div>
            <div class="card-content">
              <h3>Salidas (Vales/Facturas)</h3>
              <p>Gestionar salidas de productos por vale o factura</p>
              <span class="card-badge">Stock</span>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Catálogos -->
      <div class="menu-section">
        <h2 class="section-title">📋 Catálogos</h2>
        <div class="section-grid">
          <router-link to="/clientes" class="menu-card card-green">
            <div class="card-icon">👥</div>
            <div class="card-content">
              <h3>Clientes</h3>
              <p>Administrar información de clientes</p>
              <span class="card-badge">Maestro</span>
            </div>
          </router-link>

          <router-link to="/trabajadores" class="menu-card card-purple">
            <div class="card-icon">👷</div>
            <div class="card-content">
              <h3>Trabajadores</h3>
              <p>Gestionar trabajadores e importar desde Excel/CSV</p>
              <span class="card-badge">Maestro</span>
            </div>
          </router-link>

          <router-link to="/productos" class="menu-card card-cyan">
            <div class="card-icon">📦</div>
            <div class="card-content">
              <h3>Productos</h3>
              <p>Gestionar productos, precios e inventario</p>
              <span class="card-badge">Maestro</span>
            </div>
          </router-link>

          <router-link to="/fincas" class="menu-card card-green-dark">
            <div class="card-icon">🌾</div>
            <div class="card-content">
              <h3>Fincas</h3>
              <p>Gestionar fincas, propiedades y terrenos</p>
              <span class="card-badge">Maestro</span>
            </div>
          </router-link>

          <router-link to="/finca-productos" class="menu-card card-purple-dark">
            <div class="card-icon">🔗</div>
            <div class="card-content">
              <h3>Finca - Productos</h3>
              <p>Gestionar asignación de productos a fincas</p>
              <span class="card-badge">Relación</span>
            </div>
          </router-link>

          <router-link to="/campos" class="menu-card card-orange">
            <div class="card-icon">🌿</div>
            <div class="card-content">
              <h3>Campos</h3>
              <p>Gestionar bloques, áreas, variedades y rendimientos</p>
              <span class="card-badge">Maestro</span>
            </div>
          </router-link>
          <!-- Agregar en el grid de Catálogos -->

<router-link to="/trabajador-reportes" class="menu-card card-purple-light">
  <div class="card-icon">👥</div>
  <div class="card-content">
    <h3>Trabajador - Reportes</h3>
    <p>Gestionar asignación de trabajadores a reportes</p>
    <span class="card-badge">Relación</span>
  </div>
</router-link>
          <router-link to="/reportes" class="menu-card card-indigo">
  <div class="card-icon">📄</div>
  <div class="card-content">
    <h3>Reportes</h3>
    <p>Gestionar reportes de campo, bloques y áreas</p>
    <span class="card-badge">Documentos</span>
  </div>
</router-link>
        </div>
      </div>

      <!-- Herramientas -->
      <div class="menu-section">
        <h2 class="section-title">🛠️ Herramientas</h2>
        <div class="section-grid">
          <router-link to="/estado-cuenta/upload" class="menu-card card-yellow">
            <div class="card-icon">📤</div>
            <div class="card-content">
              <h3>Cargar XML</h3>
              <p>Importar archivos XML de estados de cuenta</p>
              <span class="card-badge">Importación</span>
            </div>
          </router-link>

          <router-link to="/estado-cuenta/procesar" class="menu-card card-pink">
            <div class="card-icon">🔄</div>
            <div class="card-content">
              <h3>Procesar XML</h3>
              <p>Asignar clientes a operaciones financieras</p>
              <span class="card-badge">Procesamiento</span>
            </div>
          </router-link>
          <!-- src/views/HomeView.vue - Agregar en el grid de Herramientas o en una nueva sección -->

<router-link to="/reporte-consolidado" class="menu-card card-indigo">
  <div class="card-icon">📊</div>
  <div class="card-content">
    <h3>Reporte Consolidado</h3>
    <p>Reporte mensual de tiempo de trabajo por trabajador</p>
    <span class="card-badge">Reportes</span>
  </div>
</router-link>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© 2024 Sistema de Gestión - Todos los derechos reservados</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardService, { type DashboardMetrics } from '@/services/DashboardService'

const isLoading = ref(true)
const metrics = ref<DashboardMetrics>({
  trabajadores: { total: 0, activos: 0 },
  productos: { total: 0, stockBajo: 0 },
  fincas: { total: 0 },
  deudas: { totalPendiente: 0, trabajadoresConDeuda: 0 },
  salidas: { hoy: 0, semana: 0 },
  produccion: { semana: 0 }
})

const formatCurrency = (value: number): string => {
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k'
  }
  return value.toFixed(2)
}

const loadMetrics = async () => {
  isLoading.value = true
  try {
    metrics.value = await DashboardService.getMetrics()
  } catch (error) {
    console.error('Error loading metrics:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadMetrics()
})
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  padding: 40px 20px 30px;
  margin: -20px -20px 40px -20px;
  border-radius: 0 0 30px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.hero-content h1 {
  color: #fff;
  font-size: 2.8em;
  margin-bottom: 5px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2em;
  margin-bottom: 25px;
  font-weight: 300;
}

/* Metrics Dashboard */
.metrics-dashboard {
  max-width: 1200px;
  margin: -30px auto 30px;
  padding: 0 20px;
  position: relative;
  z-index: 10;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-decoration: none;
  color: inherit;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.metric-icon {
  font-size: 2em;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.metric-info {
  flex: 1;
  min-width: 0;
}

.metric-value {
  font-size: 1.5em;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.metric-label {
  font-size: 0.8em;
  color: #888;
  margin-top: 2px;
}

/* Metric Colors */
.metric-blue .metric-icon { background: #e3f2fd; }
.metric-blue:hover { border-color: #3498db; }

.metric-green .metric-icon { background: #e8f5e9; }
.metric-green:hover { border-color: #27ae60; }

.metric-teal .metric-icon { background: #e0f2f1; }
.metric-teal:hover { border-color: #16a085; }

.metric-orange .metric-icon { background: #fff3e0; }
.metric-orange:hover { border-color: #f39c12; }

.metric-red .metric-icon { background: #ffebee; }
.metric-red:hover { border-color: #e74c3c; }

.metric-purple .metric-icon { background: #f3e5f5; }
.metric-purple:hover { border-color: #9b59b6; }

.metric-alert {
  animation: pulse 2s infinite;
}

.metric-alert .metric-value {
  color: #e74c3c;
}

.action-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px dashed #ccc;
}

.action-card:hover {
  border-style: solid;
  border-color: #9b59b6;
  background: #fff;
}

.action-card .metric-value {
  font-size: 2em;
  color: #9b59b6;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08); }
  50% { box-shadow: 0 4px 20px rgba(231, 76, 60, 0.3); }
}

/* Menú Grid */
.menu-grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

.menu-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 1.6em;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-left: 15px;
  border-left: 4px solid #3498db;
  font-weight: 600;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

/* Cards */
.menu-card {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  background: #fff;
  border-radius: 16px;
  padding: 25px;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.menu-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: height 0.3s ease;
}

.menu-card:hover::before {
  height: 6px;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  border-color: transparent;
}

.card-icon {
  font-size: 2.5em;
  flex-shrink: 0;
  margin-top: 2px;
  width: 50px;
  text-align: center;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  color: #2c3e50;
  margin: 0 0 8px 0;
  font-size: 1.1em;
  font-weight: 600;
}

.card-content p {
  color: #666;
  margin: 0 0 12px 0;
  font-size: 0.9em;
  line-height: 1.4;
}

.card-badge {
  display: inline-block;
  padding: 3px 12px;
  background: #f0f0f0;
  color: #666;
  border-radius: 20px;
  font-size: 0.7em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Card Colors */
.card-blue::before { background: #3498db; }
.card-blue:hover { border-color: #3498db; }
.card-blue .card-badge { background: #e3f2fd; color: #1976d2; }

.card-red::before { background: #e74c3c; }
.card-red:hover { border-color: #e74c3c; }
.card-red .card-badge { background: #ffebee; color: #c62828; }

.card-green::before { background: #27ae60; }
.card-green:hover { border-color: #27ae60; }
.card-green .card-badge { background: #e8f5e9; color: #2e7d32; }

.card-green-dark::before { background: #2e7d32; }
.card-green-dark:hover { border-color: #2e7d32; }
.card-green-dark .card-badge { background: #e8f5e9; color: #1b5e20; }

.card-purple::before { background: #9b59b6; }
.card-purple:hover { border-color: #9b59b6; }
.card-purple .card-badge { background: #f3e5f5; color: #6a1b9a; }

.card-purple-dark::before { background: #6a1b9a; }
.card-purple-dark:hover { border-color: #6a1b9a; }
.card-purple-dark .card-badge { background: #f3e5f5; color: #4a148c; }

.card-cyan::before { background: #1abc9c; }
.card-cyan:hover { border-color: #1abc9c; }
.card-cyan .card-badge { background: #e0f2f1; color: #00695c; }

.card-orange::before { background: #f39c12; }
.card-orange:hover { border-color: #f39c12; }
.card-orange .card-badge { background: #fff3e0; color: #e65100; }

.card-teal::before { background: #16a085; }
.card-teal:hover { border-color: #16a085; }
.card-teal .card-badge { background: #e0f2f1; color: #00695c; }

.card-yellow::before { background: #f1c40f; }
.card-yellow:hover { border-color: #f1c40f; }
.card-yellow .card-badge { background: #fffde7; color: #f57f17; }

.card-pink::before { background: #e91e63; }
.card-pink:hover { border-color: #e91e63; }
.card-pink .card-badge { background: #fce4ec; color: #880e4f; }
/* En HomeView.vue - Agregar en la sección de colores */

.card-indigo::before { background: #3f51b5; }
.card-indigo:hover { border-color: #3f51b5; }
.card-indigo .card-badge { background: #e8eaf6; color: #283593; }

/* Footer */
.footer {
  text-align: center;
  padding: 30px 20px 20px;
  color: #888;
  font-size: 0.9em;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  max-width: 1200px;
  margin: 0 auto;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 1.8em;
  }

  .metrics-dashboard {
    margin-top: -20px;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .metric-card {
    padding: 15px;
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .metric-value {
    font-size: 1.3em;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }

  .menu-card {
    padding: 20px;
  }

  .card-icon {
    font-size: 2em;
    width: 40px;
  }
}

@media (max-width: 480px) {
  .hero-content h1 {
    font-size: 1.6em;
  }
  
  .subtitle {
    font-size: 1em;
  }
  
  .section-title {
    font-size: 1.3em;
  }
}
</style>