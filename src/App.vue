<!-- src/App.vue -->

<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-brand">🏢 Sistema de Gestión</router-link>
        
        <button class="nav-toggle" @click="toggleMenu" aria-label="Toggle menu">
          <span class="hamburger"></span>
        </button>

        <div class="nav-links" :class="{ 'nav-open': isMenuOpen }">
          <router-link to="/" class="nav-link" @click="closeMenu">Inicio</router-link>

          <!-- Dropdown Financiero -->
          <div class="nav-dropdown-wrapper" @mouseenter="openDropdown('financiero')" @mouseleave="closeDropdown('financiero')">
            <button class="nav-dropdown-trigger" @click="toggleDropdown('financiero')">
              💰 Financiero
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="nav-dropdown-menu" :class="{ 'dropdown-open': activeDropdown === 'financiero' }">
              <router-link to="/estado-cuenta" class="dropdown-link" @click="closeMenu">Estados de Cuenta</router-link>
              <router-link to="/prestamos" class="dropdown-link" @click="closeMenu">Préstamos</router-link>
              <router-link to="/toma-prestamos" class="dropdown-link" @click="closeMenu">Toma de Préstamos</router-link>
              <router-link to="/salidas" class="dropdown-link" @click="closeMenu">Salidas (Vales/Facturas)</router-link>
              <router-link to="/deudas-trabajadores" class="dropdown-link" @click="closeMenu">Deudas Trabajadores</router-link>
              <router-link to="/historial-movimientos" class="dropdown-link" @click="closeMenu">Historial Movimientos</router-link>
            </div>
          </div>

          <!-- Dropdown Catálogos -->
          <div class="nav-dropdown-wrapper" @mouseenter="openDropdown('catalogos')" @mouseleave="closeDropdown('catalogos')">
            <button class="nav-dropdown-trigger" @click="toggleDropdown('catalogos')">
              📋 Catálogos
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="nav-dropdown-menu" :class="{ 'dropdown-open': activeDropdown === 'catalogos' }">
              <router-link to="/clientes" class="dropdown-link" @click="closeMenu">Clientes</router-link>
              <router-link to="/trabajadores" class="dropdown-link" @click="closeMenu">Trabajadores</router-link>
              <router-link to="/lista-cargos" class="dropdown-link" @click="closeMenu">Cargos</router-link>
              <router-link to="/lista-grupos" class="dropdown-link" @click="closeMenu">Grupos</router-link>
              <router-link to="/productos" class="dropdown-link" @click="closeMenu">Productos</router-link>
              <router-link to="/fincas" class="dropdown-link" @click="closeMenu">Fincas</router-link>
              <router-link to="/finca-productos" class="dropdown-link" @click="closeMenu">Finca - Productos</router-link>
              <router-link to="/almacenes" class="dropdown-link" @click="closeMenu">Almacenes</router-link>
              <router-link to="/entrada-produccion" class="dropdown-link" @click="closeMenu">Entrada de Producción</router-link>
              <router-link to="/produccion-terminada" class="dropdown-link" @click="closeMenu">Producción Terminada</router-link>
              <router-link to="/campos" class="dropdown-link" @click="closeMenu">Campos</router-link>
              <router-link to="/reportes" class="dropdown-link" @click="closeMenu">Reportes</router-link>
            </div>
          </div>

          <!-- Dropdown Herramientas -->
          <div class="nav-dropdown-wrapper" @mouseenter="openDropdown('herramientas')" @mouseleave="closeDropdown('herramientas')">
            <button class="nav-dropdown-trigger" @click="toggleDropdown('herramientas')">
              🛠️ Herramientas
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="nav-dropdown-menu" :class="{ 'dropdown-open': activeDropdown === 'herramientas' }">
              <router-link to="/estado-cuenta/upload" class="dropdown-link" @click="closeMenu">Cargar XML</router-link>
              <router-link to="/estado-cuenta/procesar" class="dropdown-link" @click="closeMenu">Procesar XML</router-link>
              <router-link to="/reporte-consolidado" class="dropdown-link" @click="closeMenu">Reporte Consolidado</router-link>
              <router-link to="/reporte-consolidado-por-responsable" class="dropdown-link" @click="closeMenu">Consolidado por Responsable</router-link>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>

    <!-- Sistema de Notificaciones Global -->
    <NotificationContainer />

    <!-- Diálogos de Confirmación Global -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import NotificationContainer from '@/components/NotificationContainer.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const isMenuOpen = ref(false)
const activeDropdown = ref<string | null>(null)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
  activeDropdown.value = null
}

const openDropdown = (dropdown: string) => {
  if (window.innerWidth > 768) {
    activeDropdown.value = dropdown
  }
}

const closeDropdown = (dropdown: string) => {
  if (window.innerWidth > 768) {
    if (activeDropdown.value === dropdown) {
      activeDropdown.value = null
    }
  }
}

const toggleDropdown = (dropdown: string) => {
  if (window.innerWidth <= 768) {
    activeDropdown.value = activeDropdown.value === dropdown ? null : dropdown
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

#app {
  font-family: 'Segoe UI', Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  background: #f5f7fa;
}

/* Navbar */
.navbar {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 3px solid #3498db;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.nav-brand {
  color: #fff;
  font-size: 1.3em;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.nav-brand:hover {
  color: #3498db;
}

/* Nav Toggle (Mobile) */
.nav-toggle {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  width: 44px;
  height: 44px;
  position: relative;
}

.hamburger {
  display: block;
  width: 28px;
  height: 3px;
  background: #fff;
  position: relative;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 28px;
  height: 3px;
  background: #fff;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.hamburger::before {
  top: -8px;
}

.hamburger::after {
  bottom: -8px;
}

.nav-open .hamburger {
  background: transparent;
}

.nav-open .hamburger::before {
  transform: rotate(45deg);
  top: 0;
}

.nav-open .hamburger::after {
  transform: rotate(-45deg);
  bottom: 0;
}

/* Nav Links */
.nav-links {
  display: flex;
  align-items: center;
  gap: 5px;
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.95em;
}

.nav-link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-exact-active {
  color: #fff;
  background: rgba(52, 152, 219, 0.3);
}

/* Dropdown */
.nav-dropdown-wrapper {
  position: relative;
}

.nav-dropdown-trigger {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95em;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-dropdown-trigger:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.dropdown-arrow {
  font-size: 0.6em;
  transition: transform 0.3s ease;
}

.nav-dropdown-wrapper:hover .dropdown-arrow,
.nav-dropdown-menu.dropdown-open .dropdown-arrow {
  transform: rotate(180deg);
}

.nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 220px;
  background: #fff;
  border-radius: 12px;
  padding: 8px 0;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.nav-dropdown-menu.dropdown-open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.nav-dropdown-menu::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 30px;
  width: 16px;
  height: 16px;
  background: #fff;
  transform: rotate(45deg);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  border-left: 1px solid rgba(0, 0, 0, 0.05);
}

.dropdown-link {
  display: block;
  color: #2c3e50;
  text-decoration: none;
  padding: 10px 20px;
  transition: all 0.2s ease;
  font-size: 0.95em;
  border-left: 3px solid transparent;
}

.dropdown-link:hover {
  background: #f5f7fa;
  border-left-color: #3498db;
  padding-left: 24px;
}

.dropdown-link.router-link-exact-active {
  background: #e3f2fd;
  border-left-color: #3498db;
  color: #1976d2;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-toggle {
    display: block;
  }

  .nav-links {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    background: #1a1a2e;
    padding: 20px;
    gap: 5px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    max-height: calc(100vh - 70px);
    overflow-y: auto;
  }

  .nav-links.nav-open {
    display: flex;
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
    border-radius: 8px;
  }

  .nav-dropdown-wrapper {
    width: 100%;
  }

  .nav-dropdown-trigger {
    width: 100%;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: 8px;
  }

  .nav-dropdown-menu {
    position: static;
    opacity: 1;
    visibility: visible;
    transform: none;
    box-shadow: none;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 0;
    margin-top: 5px;
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
    border: none;
  }

  .nav-dropdown-menu.dropdown-open {
    max-height: 500px;
    padding: 8px 0;
  }

  .nav-dropdown-menu::before {
    display: none;
  }

  .dropdown-link {
    color: rgba(255, 255, 255, 0.8);
    padding: 10px 20px;
    border-left: 3px solid transparent;
  }

  .dropdown-link:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border-left-color: #3498db;
  }

  .dropdown-link.router-link-exact-active {
    background: rgba(52, 152, 219, 0.2);
    color: #3498db;
  }
}

@media (max-width: 480px) {
  .nav-container {
    height: 60px;
    padding: 0 15px;
  }

  .nav-brand {
    font-size: 1em;
  }

  .nav-links {
    top: 60px;
    max-height: calc(100vh - 60px);
  }
}

/* Main Content */
.main-content {
  padding: 20px;
  min-height: calc(100vh - 70px);
}
</style>
