<!-- src/App.vue -->

<template>
  <div id="app" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Top Header -->
    <header class="top-header">
      <div class="header-left">
        <button class="sidebar-toggle" @click="toggleSidebar" aria-label="Toggle sidebar">
          <i class="fa-solid fa-bars"></i>
        </button>
        <router-link to="/" class="brand">Sistema Finca</router-link>
      </div>

      <div class="header-right">
        <FincaSelector v-if="isAuthenticated && isAdmin" />

        <div v-if="isAuthenticated" class="user-menu" @click="toggleUserMenu">
          <span class="user-avatar">{{ currentUser?.username?.charAt(0).toUpperCase() }}</span>
          <span class="user-name">{{ currentUser?.username }}</span>
          <i class="fa-solid fa-chevron-down"></i>

          <div class="user-dropdown" :class="{ 'open': userMenuOpen }">
            <div class="user-info">
              <strong>{{ currentUser?.trabajadorNombre || currentUser?.username }}</strong>
              <span class="role">{{ currentUser?.rol }}</span>
            </div>
            <hr />
            <button @click="handleLogout" class="logout-btn">
              <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'collapsed': sidebarCollapsed, 'mobile-open': mobileMenuOpen }">
      <div class="sidebar-overlay" @click="closeMobileMenu"></div>

      <nav class="sidebar-nav">
        <router-link to="/" class="nav-item" @click="closeMobileMenu">
          <i class="fa-solid fa-gauge-high"></i>
          <span>Dashboard</span>
        </router-link>

        <!-- Operaciones -->
        <div class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('operaciones')">
            <i class="fa-solid fa-gears"></i>
            <span>Operaciones</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('operaciones') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('operaciones') }">
            <router-link to="/entrada-produccion" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Entrada Producción
            </router-link>
            <router-link to="/produccion-terminada" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-circle-check"></i> Producción Terminada
            </router-link>
            <router-link to="/salidas" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-arrow-right-from-bracket"></i> Salidas
            </router-link>
            <router-link to="/historial-movimientos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-arrows-rotate"></i> Historial Movimientos
            </router-link>
            <router-link to="/historial-stock" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-clock-rotate-left"></i> Historial Stock
            </router-link>
          </div>
        </div>

        <!-- Personal -->
        <div class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('personal')">
            <i class="fa-solid fa-users"></i>
            <span>Personal</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('personal') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('personal') }">
            <router-link to="/trabajadores" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-person-digging"></i> Trabajadores
            </router-link>
            <router-link to="/lista-cargos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-briefcase"></i> Cargos
            </router-link>
            <router-link to="/lista-grupos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-people-group"></i> Grupos
            </router-link>
            <router-link to="/evaluaciones" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-clipboard-check"></i> Evaluaciones
            </router-link>
          </div>
        </div>

        <!-- Inventario -->
        <div class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('inventario')">
            <i class="fa-solid fa-warehouse"></i>
            <span>Inventario</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('inventario') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('inventario') }">
            <router-link to="/productos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-boxes-stacked"></i> Productos
            </router-link>
            <router-link to="/fincas" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-tractor"></i> Fincas
            </router-link>
            <router-link to="/finca-productos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-cubes"></i> Stock por Finca
            </router-link>
            <router-link to="/almacenes" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-store"></i> Almacenes
            </router-link>
            <router-link to="/campos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-seedling"></i> Campos
            </router-link>
            <router-link to="/tipos-cultivo" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-wheat-awn"></i> Tipos de Cultivo
            </router-link>
            <router-link to="/lista-tipo-animales" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-cow"></i> Tipos de Animal
            </router-link>
            <router-link to="/alertas-stock" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-triangle-exclamation"></i> Alertas Stock
            </router-link>
          </div>
        </div>

        <!-- Activos Fijos -->
        <div class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('aft')">
            <i class="fa-solid fa-building-columns"></i>
            <span>Activos Fijos</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('aft') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('aft') }">
            <router-link to="/grupos-activos-fijos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-layer-group"></i> Grupos AFT
            </router-link>
            <router-link to="/activos-fijos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-screwdriver-wrench"></i> Activos Fijos
            </router-link>
            <router-link to="/activos-animales" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-cow"></i> Activos Animales
            </router-link>
            <router-link to="/plantaciones" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-tree"></i> Plantaciones
            </router-link>
            <router-link to="/depreciacion" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-chart-line"></i> Depreciación
            </router-link>
          </div>
        </div>

        <!-- Contabilidad -->
        <div class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('contabilidad')">
            <i class="fa-solid fa-calculator"></i>
            <span>Contabilidad</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('contabilidad') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('contabilidad') }">
            <router-link to="/contabilidad/libro-diario" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-book"></i> Libro Diario
            </router-link>
            <router-link to="/contabilidad/mayor-por-cuenta" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-file-lines"></i> Mayor por Cuenta
            </router-link>
            <router-link to="/contabilidad/balance-comprobacion" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-scale-balanced"></i> Balance Comprobación
            </router-link>
            <router-link to="/contabilidad/plan-cuentas" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-diagram-project"></i> Plan de Cuentas
            </router-link>
            <router-link to="/centros-costo" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-folder-tree"></i> Centros de Costo
            </router-link>
            <router-link to="/contabilidad/reglas" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Reglas Contabilización
            </router-link>
          </div>
        </div>

        <!-- Finanzas -->
        <div class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('finanzas')">
            <i class="fa-solid fa-coins"></i>
            <span>Finanzas</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('finanzas') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('finanzas') }">
            <router-link to="/deudas-trabajadores" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-hand-holding-dollar"></i> Deudas y Pagos
            </router-link>
            <router-link to="/liquidacion-caja" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-cash-register"></i> Liquidación / Caja
            </router-link>
            <router-link to="/reportes/ventas-pagos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-receipt"></i> Resumen Ventas/Pagos
            </router-link>
            <router-link to="/estado-cuenta" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-file-invoice-dollar"></i> Estados de Cuenta
            </router-link>
            <router-link to="/prestamos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-money-bill-transfer"></i> Préstamos
            </router-link>
            <router-link to="/toma-prestamos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-handshake"></i> Toma de Préstamos
            </router-link>
            <router-link to="/clientes" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-address-card"></i> Clientes
            </router-link>
          </div>
        </div>

        <!-- Reportes -->
        <div class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('reportes')">
            <i class="fa-solid fa-chart-pie"></i>
            <span>Reportes</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('reportes') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('reportes') }">
            <router-link to="/reportes-consolidados" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-table-cells-large"></i> Panel Reportes
            </router-link>
            <router-link to="/reporte-consolidado" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-file-contract"></i> Consolidado General
            </router-link>
            <router-link to="/reporte-consolidado-por-responsable" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-user-tie"></i> Por Responsable
            </router-link>
            <router-link to="/reportes/consolidado-movimientos" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-route"></i> Por Destino
            </router-link>
            <router-link to="/reportes" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-clipboard-list"></i> Reportes de Trabajo
            </router-link>
            <router-link to="/gerencial-dashboard" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-desktop"></i> Dashboard Gerencial
            </router-link>
          </div>
        </div>

        <!-- Admin (solo ADMIN) -->
        <div v-if="isAdmin" class="nav-group">
          <button class="nav-group-header" @click="toggleGroup('admin')">
            <i class="fa-solid fa-shield-halved"></i>
            <span>Administración</span>
            <i class="fa-solid fa-chevron-right arrow" :class="{ 'open': openGroups.includes('admin') }"></i>
          </button>
          <div class="nav-group-items" :class="{ 'open': openGroups.includes('admin') }">
            <router-link to="/usuarios" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-user-gear"></i> Usuarios
            </router-link>
            <router-link to="/auditoria" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-magnifying-glass"></i> Auditoría
            </router-link>
            <router-link to="/configuracion-empresa" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-building"></i> Config. Empresa
            </router-link>
            <router-link to="/lista-tipo-reportes" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-folder-tree"></i> Tipos de Reporte
            </router-link>
            <router-link to="/estado-cuenta/upload" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-cloud-arrow-up"></i> Cargar XML
            </router-link>
            <router-link to="/estado-cuenta/procesar" class="nav-item sub" @click="closeMobileMenu">
              <i class="fa-solid fa-gear"></i> Procesar XML
            </router-link>
          </div>
        </div>
      </nav>

      <!-- Collapse Button (desktop) -->
      <button class="collapse-btn" @click="toggleSidebar">
        <i class="fa-solid" :class="sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Global Components -->
    <NotificationContainer />
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import NotificationContainer from '@/components/NotificationContainer.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FincaSelector from '@/components/FincaSelector.vue'
import AuthService from '@/services/AuthService'

const router = useRouter()

// State
const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)
const openGroups = ref<string[]>(['operaciones'])

// Computed
const isAuthenticated = computed(() => AuthService.isAuthenticated())
const currentUser = computed(() => AuthService.getUser())
const isAdmin = computed(() => currentUser.value?.rol === 'ADMIN')

// Methods
const toggleSidebar = () => {
  if (window.innerWidth <= 768) {
    mobileMenuOpen.value = !mobileMenuOpen.value
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const toggleGroup = (group: string) => {
  const index = openGroups.value.indexOf(group)
  if (index > -1) {
    openGroups.value.splice(index, 1)
  } else {
    openGroups.value.push(group)
  }
}

const handleLogout = () => {
  AuthService.logout()
  router.push('/login')
}

// Click outside handler for user menu
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (!target.closest('.user-menu')) {
    userMenuOpen.value = false
  }
}

// Lifecycle
onMounted(() => {
  const saved = localStorage.getItem('sidebarCollapsed')
  if (saved === 'true') {
    sidebarCollapsed.value = true
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --sidebar-width: 260px;
  --sidebar-collapsed-width: 60px;
  --header-height: 56px;
  --primary-color: #1e3a5f;
  --primary-dark: #152a45;
  --accent-color: #3498db;
  --text-color: #2c3e50;
  --text-muted: #6c757d;
  --bg-color: #f5f7fa;
  --border-color: #e0e0e0;
}

#app {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: var(--text-color);
  min-height: 100vh;
  background: var(--bg-color);
}

/* ==================== TOP HEADER ==================== */
.top-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--header-height);
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.sidebar-toggle:hover {
  background: rgba(255,255,255,0.1);
}

.brand {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  text-decoration: none;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-menu {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  color: #fff;
  transition: background 0.2s;
}

.user-menu:hover {
  background: rgba(255,255,255,0.1);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: var(--accent-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-size: 0.9rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
}

.user-dropdown.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.user-dropdown .user-info {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-dropdown .user-info strong {
  color: var(--text-color);
}

.user-dropdown .role {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
}

.user-dropdown hr {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 0;
}

.logout-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 0.9rem;
  color: #dc3545;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: #fff5f5;
}

/* ==================== SIDEBAR ==================== */
.sidebar {
  position: fixed;
  top: var(--header-height);
  left: 0;
  bottom: 0;
  width: var(--sidebar-width);
  background: #fff;
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1000;
  transition: width 0.25s ease, transform 0.25s ease;
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar.collapsed .nav-group-header span,
.sidebar.collapsed .nav-item span,
.sidebar.collapsed .arrow,
.sidebar.collapsed .nav-group-items {
  display: none;
}

.sidebar.collapsed .nav-group-header,
.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
}

.sidebar.collapsed .nav-group-header i:first-child,
.sidebar.collapsed > nav > .nav-item i {
  margin-right: 0;
  font-size: 1.1rem;
}

.sidebar.collapsed .nav-item.sub i {
  display: none;
}

.sidebar-overlay {
  display: none;
}

.sidebar-nav {
  padding: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.15s;
  margin-bottom: 2px;
}

.nav-item i {
  width: 20px;
  text-align: center;
  color: var(--text-muted);
}

/* Dashboard icon color */
.sidebar-nav > .nav-item:first-child i {
  color: var(--accent-color);
}

.nav-item:hover {
  background: #f0f4f8;
}

.nav-item.router-link-exact-active {
  background: #e3f2fd;
  color: var(--accent-color);
}

.nav-item.router-link-exact-active i {
  color: var(--accent-color);
}

.nav-item.sub {
  padding-left: 1.5rem;
  font-size: 0.85rem;
}

.nav-item.sub i {
  width: 18px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  opacity: 0.7;
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.7rem 1rem;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color);
  border-radius: 8px;
  transition: all 0.15s;
  text-align: left;
}

.nav-group-header i:first-child {
  width: 20px;
  text-align: center;
}

/* Color accents for each section */
.nav-group:nth-child(2) .nav-group-header i:first-child { color: #e67e22; } /* Operaciones - orange */
.nav-group:nth-child(3) .nav-group-header i:first-child { color: #9b59b6; } /* Personal - purple */
.nav-group:nth-child(4) .nav-group-header i:first-child { color: #27ae60; } /* Inventario - green */
.nav-group:nth-child(5) .nav-group-header i:first-child { color: #3498db; } /* Activos - blue */
.nav-group:nth-child(6) .nav-group-header i:first-child { color: #1abc9c; } /* Contabilidad - teal */
.nav-group:nth-child(7) .nav-group-header i:first-child { color: #f1c40f; } /* Finanzas - yellow */
.nav-group:nth-child(8) .nav-group-header i:first-child { color: #e74c3c; } /* Reportes - red */
.nav-group:nth-child(9) .nav-group-header i:first-child { color: #95a5a6; } /* Admin - gray */

.nav-group-header:hover {
  background: #f0f4f8;
}

.nav-group-header .arrow {
  margin-left: auto;
  font-size: 0.65rem;
  transition: transform 0.2s;
}

.nav-group-header .arrow.open {
  transform: rotate(90deg);
}

.nav-group-items {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}

.nav-group-items.open {
  max-height: 500px;
}

.collapse-btn {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: #f0f4f8;
  color: var(--accent-color);
}

/* ==================== MAIN CONTENT ==================== */
.main-content {
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: 1.5rem;
  min-height: calc(100vh - var(--header-height));
  transition: margin-left 0.25s ease;
}

.sidebar-collapsed .main-content {
  margin-left: var(--sidebar-collapsed-width);
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-width);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar.mobile-open .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: -1;
  }

  .sidebar.collapsed {
    width: var(--sidebar-width);
  }

  .sidebar.collapsed .nav-group-header span,
  .sidebar.collapsed .nav-item span,
  .sidebar.collapsed .arrow,
  .sidebar.collapsed .nav-group-items,
  .sidebar.collapsed .nav-item.sub i {
    display: inline-block;
  }

  .sidebar.collapsed .nav-group-header,
  .sidebar.collapsed .nav-item {
    justify-content: flex-start;
    padding: 0.7rem 1rem;
  }

  .main-content {
    margin-left: 0;
  }

  .sidebar-collapsed .main-content {
    margin-left: 0;
  }

  .collapse-btn {
    display: none;
  }

  .user-name {
    display: none;
  }
}

@media (max-width: 480px) {
  .brand {
    font-size: 1rem;
  }

  .main-content {
    padding: 1rem;
  }
}
</style>
