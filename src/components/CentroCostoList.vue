<!-- src/components/CentroCostoList.vue -->
<template>
  <div class="centro-costo-container">
    <div class="header-section">
      <h1 class="main-title">
        <span class="icon">📊</span>
        Centros de Costo
      </h1>
      <p class="subtitle">Gestión del plan de cuentas y centros de costo contables</p>
    </div>

    <div class="stats-cards">
      <div class="stat-card total">
        <div class="stat-icon">📁</div>
        <div class="stat-info">
          <span class="stat-value">{{ centrosCosto.length }}</span>
          <span class="stat-label">Total de Cuentas</span>
        </div>
      </div>
      <div class="stat-card activas">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <span class="stat-value">{{ cuentasActivas }}</span>
          <span class="stat-label">Cuentas Activas</span>
        </div>
      </div>
      <div class="stat-card movimiento">
        <div class="stat-icon">💳</div>
        <div class="stat-info">
          <span class="stat-value">{{ cuentasConMovimiento }}</span>
          <span class="stat-label">Permiten Movimiento</span>
        </div>
      </div>
    </div>

    <div class="actions-section">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="filtro"
          placeholder="Buscar por código o nombre..."
          class="search-input"
        />
      </div>
      <router-link to="/crear-centro-costo" class="btn-nuevo">
        <span>➕</span>
        <span>Nuevo Centro de Costo</span>
      </router-link>
    </div>

    <div v-if="cargando" class="loading-state">
      <div class="spinner"></div>
      <span>Cargando centros de costo...</span>
    </div>

    <div v-else-if="arbolFiltrado.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No hay centros de costo</h3>
      <p>Crea el primer centro de costo para comenzar</p>
      <router-link to="/crear-centro-costo" class="btn-primary">
        Crear Centro de Costo
      </router-link>
    </div>

    <div v-else class="cuentas-grid">
      <div
        v-for="cuenta in arbolFiltrado"
        :key="cuenta.id"
        class="cuenta-card"
        :class="{ 'expanded': expandidos.has(cuenta.id), 'inactiva': !cuenta.activo }"
      >
        <div class="card-header" @click="cuenta.children.length && toggleExpand(cuenta.id)">
          <div class="cuenta-main">
            <div class="expand-btn" :class="{ 'has-children': cuenta.children.length > 0 }">
              <span
                v-if="cuenta.children.length > 0"
                class="expand-icon"
                :class="{ 'rotated': expandidos.has(cuenta.id) }"
              >▼</span>
              <span v-else class="leaf-icon">📄</span>
            </div>

            <div class="codigo-badge">{{ cuenta.codigo }}</div>

            <div class="cuenta-details">
              <h3 class="cuenta-nombre">{{ cuenta.nombre }}</h3>
              <div class="cuenta-meta">
                <span class="badge badge-tipo" :class="cuenta.tipo.toLowerCase()">
                  {{ cuenta.tipo }}
                </span>
                <span v-if="cuenta.permiteMovimiento" class="badge badge-movimiento">
                  💳 Movimiento
                </span>
                <span class="badge badge-estado" :class="cuenta.activo ? 'activo' : 'inactivo'">
                  {{ cuenta.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="cuenta.children.length > 0" class="children-count">
            <span class="count-number">{{ cuenta.children.length }}</span>
            <span class="count-label">subcuentas</span>
          </div>

          <div class="card-actions">
            <button
              class="btn-action btn-editar"
              @click.stop="editarCuenta(cuenta.id)"
              title="Editar"
            >✏️</button>
            <button
              class="btn-action"
              :class="cuenta.activo ? 'btn-desactivar' : 'btn-activar'"
              @click.stop="toggleStatus(cuenta)"
              :title="cuenta.activo ? 'Desactivar' : 'Activar'"
            >{{ cuenta.activo ? '🔒' : '🔓' }}</button>
          </div>
        </div>

        <transition name="slide">
          <div v-if="expandidos.has(cuenta.id) && cuenta.children.length > 0" class="card-body">
            <div class="timeline">
              <template v-for="(hijo, idx) in cuenta.children" :key="hijo.id">
                <CuentaTimelineItem
                  :cuenta="hijo"
                  :is-last="idx === cuenta.children.length - 1"
                  :expandidos="expandidos"
                  @toggle="toggleExpand"
                  @editar="editarCuenta"
                  @toggle-status="toggleStatus"
                />
              </template>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- Toast notifications -->
    <Teleport to="body">
      <Transition name="toast">
        <div v-if="toast.visible" :class="['toast', toast.tipo]">
          <span class="toast-icon">{{ toast.tipo === 'exito' ? '✅' : '❌' }}</span>
          {{ toast.mensaje }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { CuentaContableService } from '@/services/ContabilidadService'
import type { CuentaContable } from '@/types/Contabilidad'

interface CuentaTree extends CuentaContable {
  children: CuentaTree[]
}

const router = useRouter()
const centrosCosto = ref<CuentaContable[]>([])
const cargando = ref(true)
const filtro = ref('')
const expandidos = ref<Set<string>>(new Set())
const toast = ref({ visible: false, mensaje: '', tipo: 'exito' })

// Stats computadas
const cuentasActivas = computed(() => centrosCosto.value.filter(c => c.activo).length)
const cuentasConMovimiento = computed(() => centrosCosto.value.filter(c => c.permiteMovimiento).length)

// Construir árbol jerárquico
const arbolCuentas = computed<CuentaTree[]>(() => {
  const mapa = new Map<string, CuentaTree>()
  const raices: CuentaTree[] = []

  centrosCosto.value.forEach(cuenta => {
    mapa.set(cuenta.id, { ...cuenta, children: [] })
  })

  mapa.forEach(cuenta => {
    if (cuenta.cuentaPadreId && mapa.has(cuenta.cuentaPadreId)) {
      mapa.get(cuenta.cuentaPadreId)!.children.push(cuenta)
    } else {
      raices.push(cuenta)
    }
  })

  const ordenar = (arr: CuentaTree[]) => {
    arr.sort((a, b) => a.codigo.localeCompare(b.codigo))
    arr.forEach(c => ordenar(c.children))
  }
  ordenar(raices)

  return raices
})

// Filtrar árbol
const arbolFiltrado = computed<CuentaTree[]>(() => {
  if (!filtro.value.trim()) return arbolCuentas.value

  const busqueda = filtro.value.toLowerCase()

  const filtrarNodo = (nodo: CuentaTree): CuentaTree | null => {
    const coincide = nodo.codigo.toLowerCase().includes(busqueda) ||
                     nodo.nombre.toLowerCase().includes(busqueda)

    const hijosFiltrados = nodo.children
      .map(filtrarNodo)
      .filter((n): n is CuentaTree => n !== null)

    if (coincide || hijosFiltrados.length > 0) {
      return { ...nodo, children: hijosFiltrados }
    }
    return null
  }

  return arbolCuentas.value
    .map(filtrarNodo)
    .filter((n): n is CuentaTree => n !== null)
})

const cargar = async () => {
  cargando.value = true
  try {
    centrosCosto.value = await CuentaContableService.getCentrosCosto()
    // Expandir raíces por defecto
    arbolCuentas.value.forEach(c => {
      if (c.children.length) expandidos.value.add(c.id)
    })
    expandidos.value = new Set(expandidos.value)
  } catch (error) {
    console.error('Error al cargar centros de costo:', error)
    mostrarToast('Error al cargar los centros de costo', 'error')
  } finally {
    cargando.value = false
  }
}

const toggleExpand = (id: string) => {
  const nuevo = new Set(expandidos.value)
  if (nuevo.has(id)) {
    nuevo.delete(id)
  } else {
    nuevo.add(id)
  }
  expandidos.value = nuevo
}

const editarCuenta = (id: string) => {
  router.push(`/editar-centro-costo/${id}`)
}

const toggleStatus = async (cuenta: CuentaTree) => {
  try {
    if (cuenta.activo) {
      await CuentaContableService.desactivar(cuenta.id)
      mostrarToast(`${cuenta.codigo} desactivada`, 'exito')
    } else {
      await CuentaContableService.activar(cuenta.id)
      mostrarToast(`${cuenta.codigo} activada`, 'exito')
    }
    await cargar()
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    mostrarToast('Error al cambiar el estado', 'error')
  }
}

const mostrarToast = (mensaje: string, tipo: 'exito' | 'error') => {
  toast.value = { visible: true, mensaje, tipo }
  setTimeout(() => {
    toast.value.visible = false
  }, 3000)
}

// Componente recursivo de timeline para subcuentas
const CuentaTimelineItem = defineComponent({
  name: 'CuentaTimelineItem',
  props: {
    cuenta: { type: Object as () => CuentaTree, required: true },
    isLast: { type: Boolean, default: false },
    expandidos: { type: Object as () => Set<string>, required: true }
  },
  emits: ['toggle', 'editar', 'toggle-status'],
  setup(props, { emit }) {
    const tieneHijos = computed(() => props.cuenta.children.length > 0)
    const estaExpandido = computed(() => props.expandidos.has(props.cuenta.id))

    return () => {
      const elements = []

      // Timeline item principal
      elements.push(
        h('div', {
          class: ['timeline-item', { 'timeline-item-last': props.isLast }]
        }, [
          // Marcador del timeline
          h('div', {
            class: ['timeline-marker', props.cuenta.tipo.toLowerCase(), { 'has-children': tieneHijos.value }]
          }),

          // Contenido
          h('div', {
            class: ['timeline-content', { 'inactiva': !props.cuenta.activo }]
          }, [
            // Header
            h('div', {
              class: 'timeline-header',
              onClick: () => tieneHijos.value && emit('toggle', props.cuenta.id)
            }, [
              // Código
              h('span', { class: 'badge codigo' }, props.cuenta.codigo),
              // Nombre
              h('span', { class: 'cuenta-nombre' }, props.cuenta.nombre),
              // Tipo
              h('span', {
                class: ['badge', 'badge-tipo', props.cuenta.tipo.toLowerCase()]
              }, props.cuenta.tipo),
              // Movimiento
              props.cuenta.permiteMovimiento && h('span', {
                class: 'badge badge-movimiento'
              }, '💳'),
              // Estado
              h('span', {
                class: ['badge', 'badge-estado', props.cuenta.activo ? 'activo' : 'inactivo']
              }, props.cuenta.activo ? 'Activo' : 'Inactivo'),
              // Contador hijos
              tieneHijos.value && h('span', { class: 'children-badge' }, [
                h('span', { class: ['expand-arrow', { rotated: estaExpandido.value }] }, '▼'),
                ` ${props.cuenta.children.length}`
              ]),
              // Spacer
              h('div', { class: 'spacer' }),
              // Acciones
              h('div', { class: 'timeline-actions' }, [
                h('button', {
                  class: 'btn-action-small btn-editar',
                  onClick: (e: Event) => { e.stopPropagation(); emit('editar', props.cuenta.id) },
                  title: 'Editar'
                }, '✏️'),
                h('button', {
                  class: ['btn-action-small', props.cuenta.activo ? 'btn-desactivar' : 'btn-activar'],
                  onClick: (e: Event) => { e.stopPropagation(); emit('toggle-status', props.cuenta) },
                  title: props.cuenta.activo ? 'Desactivar' : 'Activar'
                }, props.cuenta.activo ? '🔒' : '🔓')
              ])
            ]),

            // Sub-timeline para hijos
            tieneHijos.value && estaExpandido.value && h('div', { class: 'sub-timeline' },
              props.cuenta.children.map((hijo, idx) =>
                h(CuentaTimelineItem, {
                  key: hijo.id,
                  cuenta: hijo,
                  isLast: idx === props.cuenta.children.length - 1,
                  expandidos: props.expandidos,
                  onToggle: (id: string) => emit('toggle', id),
                  onEditar: (id: string) => emit('editar', id),
                  onToggleStatus: (c: CuentaTree) => emit('toggle-status', c)
                })
              )
            )
          ])
        ])
      )

      return h('div', { class: 'timeline-wrapper' }, elements)
    }
  }
})

onMounted(cargar)
</script>

<style scoped>
.centro-costo-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* Header */
.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.main-title {
  font-size: 2em;
  color: #1a1a2e;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.main-title .icon {
  font-size: 1.2em;
}

.subtitle {
  color: #666;
  margin-top: 8px;
  font-size: 1.1em;
}

/* Stats Cards */
.stats-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-card {
  background: linear-gradient(135deg, var(--color-primary, #3498db) 0%, var(--color-primary-dark, #2980b9) 100%);
  border-radius: 16px;
  padding: 20px 30px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  min-width: 200px;
  box-shadow: 0 10px 30px rgba(52, 152, 219, 0.3);
}

.stat-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.stat-card.activas {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  box-shadow: 0 10px 30px rgba(17, 153, 142, 0.3);
}

.stat-card.movimiento {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 10px 30px rgba(245, 87, 108, 0.3);
}

.stat-icon {
  font-size: 2.5em;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.8em;
  font-weight: 700;
}

.stat-label {
  font-size: 0.9em;
  opacity: 0.9;
}

/* Actions Section */
.actions-section {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: center;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 50px;
  padding: 5px 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  flex: 1;
  max-width: 500px;
}

.search-icon {
  font-size: 1.2em;
  margin-right: 10px;
}

.search-input {
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 1em;
  flex: 1;
  background: transparent;
}

.btn-nuevo {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 50px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-nuevo:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4);
}

/* Loading & Empty States */
.loading-state, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--color-primary, #3498db);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
}

.empty-state h3 {
  margin: 0;
  color: #333;
}

.empty-state p {
  margin: 10px 0 20px;
}

.btn-primary {
  display: inline-block;
  background: linear-gradient(135deg, var(--color-primary, #3498db) 0%, var(--color-primary-dark, #2980b9) 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 50px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(52, 152, 219, 0.4);
}

/* Cuentas Grid */
.cuentas-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Cuenta Card */
.cuenta-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.cuenta-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.cuenta-card.expanded {
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
}

.cuenta-card.inactiva {
  opacity: 0.7;
}

.cuenta-card.inactiva .card-header {
  background: #f5f5f5;
}

/* Card Header */
.card-header {
  display: flex;
  align-items: center;
  padding: 20px 25px;
  cursor: pointer;
  transition: background 0.2s;
  gap: 20px;
}

.card-header:hover {
  background: #f8f9ff;
}

.cuenta-main {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.expand-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 8px;
  background: #f0f0f0;
  transition: all 0.2s;
}

.expand-btn.has-children {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
}

.expand-btn.has-children:hover {
  transform: scale(1.1);
}

.expand-icon {
  color: white;
  font-size: 0.8em;
  transition: transform 0.3s;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

.leaf-icon {
  font-size: 1em;
}

/* Código Badge */
.codigo-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.95em;
  font-family: 'Courier New', monospace;
  flex-shrink: 0;
}

/* Cuenta Details */
.cuenta-details {
  flex: 1;
  min-width: 0;
}

.cuenta-nombre {
  margin: 0 0 8px 0;
  font-size: 1.1em;
  color: #1a1a2e;
}

.cuenta-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
  text-transform: uppercase;
}

.badge.codigo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Courier New', monospace;
  text-transform: none;
}

.badge-tipo {
  background: #e8f4fd;
  color: #1976d2;
}

.badge-tipo.costo {
  background: #fff3e0;
  color: #e65100;
}

.badge-tipo.gasto {
  background: #fce4ec;
  color: #c2185b;
}

.badge-tipo.activo {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-tipo.pasivo {
  background: #f3e5f5;
  color: #7b1fa2;
}

.badge-tipo.patrimonio {
  background: #e0f2f1;
  color: #00695c;
}

.badge-tipo.ingreso {
  background: #e3f2fd;
  color: #1565c0;
}

.badge-movimiento {
  background: #f1f8e9;
  color: #558b2f;
}

.badge-estado.activo {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge-estado.inactivo {
  background: #ffebee;
  color: #c62828;
}

/* Children Count */
.children-count {
  text-align: center;
  padding: 0 15px;
  flex-shrink: 0;
}

.count-number {
  display: block;
  font-size: 1.3em;
  font-weight: 700;
  color: #667eea;
}

.count-label {
  font-size: 0.75em;
  color: #888;
}

/* Card Actions */
.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.1em;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-editar {
  background: #e3f2fd;
}

.btn-editar:hover {
  background: #bbdefb;
  transform: scale(1.1);
}

.btn-desactivar {
  background: #ffebee;
}

.btn-desactivar:hover {
  background: #ffcdd2;
  transform: scale(1.1);
}

.btn-activar {
  background: #e8f5e9;
}

.btn-activar:hover {
  background: #c8e6c9;
  transform: scale(1.1);
}

/* Card Body */
.card-body {
  border-top: 1px solid #eee;
  padding: 25px;
  background: #fafbff;
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding: 0 25px;
}

/* ============== TIMELINE STYLES ============== */
.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.timeline-wrapper {
  /* Wrapper for recursive items */
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;
}

.timeline-item:last-child,
.timeline-item.timeline-item-last {
  padding-bottom: 0;
}

/* Timeline marker */
.timeline-marker {
  position: absolute;
  left: -26px;
  top: 8px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  background: #667eea;
  z-index: 1;
}

.timeline-marker.has-children {
  width: 18px;
  height: 18px;
  left: -28px;
  top: 6px;
}

.timeline-marker.costo {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
}

.timeline-marker.gasto {
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
}

.timeline-marker.activo {
  background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
}

.timeline-marker.pasivo {
  background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
}

.timeline-marker.patrimonio {
  background: linear-gradient(135deg, #009688 0%, #00796b 100%);
}

.timeline-marker.ingreso {
  background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
}

/* Timeline content */
.timeline-content {
  background: white;
  border-radius: 12px;
  padding: 15px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
}

.timeline-content:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.timeline-content.inactiva {
  opacity: 0.6;
  background: #f9f9f9;
}

/* Timeline header */
.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  cursor: pointer;
}

.timeline-header .cuenta-nombre {
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
  margin: 0;
}

.timeline-header .spacer {
  flex: 1;
}

.children-badge {
  background: #f0f4ff;
  color: #667eea;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.expand-arrow {
  font-size: 0.7em;
  transition: transform 0.3s;
}

.expand-arrow.rotated {
  transform: rotate(180deg);
}

/* Timeline actions */
.timeline-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.timeline-content:hover .timeline-actions {
  opacity: 1;
}

.btn-action-small {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85em;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action-small.btn-editar {
  background: #e3f2fd;
}

.btn-action-small.btn-editar:hover {
  background: #bbdefb;
  transform: scale(1.1);
}

.btn-action-small.btn-desactivar {
  background: #ffebee;
}

.btn-action-small.btn-desactivar:hover {
  background: #ffcdd2;
  transform: scale(1.1);
}

.btn-action-small.btn-activar {
  background: #e8f5e9;
}

.btn-action-small.btn-activar:hover {
  background: #c8e6c9;
  transform: scale(1.1);
}

/* Sub-timeline for nested children */
.sub-timeline {
  position: relative;
  margin-top: 15px;
  padding-left: 25px;
  border-left: 2px solid #e0e0e0;
  margin-left: 5px;
}

.sub-timeline .timeline-item {
  padding-bottom: 15px;
}

.sub-timeline .timeline-marker {
  left: -31px;
  width: 12px;
  height: 12px;
}

.sub-timeline .timeline-marker.has-children {
  width: 14px;
  height: 14px;
  left: -32px;
}

.sub-timeline .timeline-content {
  padding: 12px 15px;
}

.sub-timeline .timeline-header .cuenta-nombre {
  font-size: 0.9em;
}

.sub-timeline .badge {
  padding: 2px 8px;
  font-size: 0.7em;
}

/* Deeper nesting */
.sub-timeline .sub-timeline {
  margin-left: 3px;
  padding-left: 20px;
}

.sub-timeline .sub-timeline .timeline-marker {
  width: 10px;
  height: 10px;
  left: -26px;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 15px 25px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.toast.exito {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.toast.error {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.toast-icon {
  font-size: 1.2em;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .main-title {
    font-size: 1.5em;
  }

  .stats-cards {
    flex-direction: column;
    align-items: stretch;
  }

  .stat-card {
    min-width: auto;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
  }

  .cuenta-main {
    width: 100%;
  }

  .children-count {
    display: none;
  }

  .timeline-actions {
    opacity: 1;
  }

  .timeline-header {
    flex-wrap: wrap;
  }

  .timeline-header .spacer {
    display: none;
  }

  .toast {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}
</style>
