<template>
  <div class="tipo-cultivo-list">
    <header class="page-header">
      <div class="header-copy">
        <p class="eyebrow"><i class="fa-solid fa-seedling"></i> Nomencladores</p>
        <h1>Tipos de cultivo</h1>
        <p class="subtitle">Organiza los cultivos disponibles para los reportes de trabajo y sus reglas operativas.</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <i class="fa-solid fa-plus"></i>
        Nuevo tipo de cultivo
      </button>
    </header>

    <section class="summary-grid" aria-label="Resumen de tipos de cultivo">
      <article class="summary-card">
        <span class="summary-icon icon-green"><i class="fa-solid fa-wheat-awn"></i></span>
        <div><strong>{{ tiposCultivo.length }}</strong><span>Tipos registrados</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon icon-blue"><i class="fa-solid fa-circle-check"></i></span>
        <div><strong>{{ totalActivos }}</strong><span>Activos</span></div>
      </article>
      <article class="summary-card">
        <span class="summary-icon icon-orange"><i class="fa-solid fa-basket-shopping"></i></span>
        <div><strong>{{ totalCosecha }}</strong><span>Actividades de cosecha</span></div>
      </article>
    </section>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>

    <div v-else class="cultivos-panel">
      <div class="panel-heading">
        <div>
          <h2>Catálogo de cultivos</h2>
          <p>Selecciona un cultivo para actualizar su configuración.</p>
        </div>
        <span class="result-count">{{ tiposCultivo.length }} registros</span>
      </div>

      <div v-if="tiposCultivo.length > 0" class="cultivos-grid">
        <article v-for="tipo in tiposCultivo" :key="tipo.id" class="cultivo-card" :class="{ inactive: !tipo.activo }">
          <div class="card-topline">
            <code>{{ tipo.codigo }}</code>
            <span :class="['category-pill', `category-${tipo.categoria.toLowerCase()}`]">{{ categoriaLabel(tipo.categoria) }}</span>
          </div>

          <h3>{{ tipo.nombre }}</h3>
          <p class="card-description">{{ tipo.descripcion || 'Sin descripción registrada.' }}</p>

          <div class="feature-list">
            <span :class="['feature', { enabled: tipo.requiereCampo }]">
              <i class="fa-solid fa-map-location-dot"></i>
              {{ tipo.requiereCampo ? 'Requiere bloque y campo' : 'Sin bloque ni campo' }}
            </span>
            <span :class="['feature', 'harvest', { enabled: tipo.esCosecha }]">
              <i class="fa-solid fa-basket-shopping"></i>
              {{ tipo.esCosecha ? 'Actividad de cosecha' : 'No es cosecha' }}
            </span>
          </div>

          <footer class="card-footer">
            <div class="card-meta">
              <span :class="['status-dot', { active: tipo.activo }]">{{ tipo.activo ? 'Activo' : 'Inactivo' }}</span>
              <span>Orden {{ tipo.orden ?? '—' }}</span>
            </div>
            <div class="card-actions">
              <button class="icon-button btn-edit" @click="openModal(tipo)" title="Editar tipo de cultivo">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="icon-button btn-delete" @click="confirmDelete(tipo)" title="Eliminar tipo de cultivo">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </footer>
        </article>
      </div>

      <div v-else class="empty-message">
        <i class="fa-solid fa-seedling"></i>
        <span>No hay tipos de cultivo registrados</span>
        <button class="empty-action" @click="openModal()">Crear el primero</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Editar' : 'Nuevo' }} Tipo de Cultivo</h2>
          <button class="btn-close" @click="closeModal">&times;</button>
        </div>
        <form @submit.prevent="save" class="modal-body">
          <div class="form-group">
            <label for="codigo">Código *</label>
            <input
              id="codigo"
              v-model="form.codigo"
              type="text"
              required
              maxlength="20"
              placeholder="Ej: CANA, YUCA"
              :disabled="isEditing"
            />
          </div>
          <div class="form-group">
            <label for="nombre">Nombre *</label>
            <input
              id="nombre"
              v-model="form.nombre"
              type="text"
              required
              maxlength="100"
              placeholder="Nombre del cultivo"
            />
          </div>
          <div class="form-group">
            <label for="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              v-model="form.descripcion"
              rows="2"
              maxlength="255"
              placeholder="Descripción opcional"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="categoria">Categoría *</label>
            <select id="categoria" v-model="form.categoria" required>
              <option value="CANNA">Caña</option>
              <option value="VIANDA">Vianda</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.requiereCampo" />
              <span>Requiere selección de Bloque y Campo</span>
            </label>
            <small class="hint">
              Marcar para cultivos como Caña que necesitan identificar bloque y campo específico.
            </small>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.esCosecha" />
              <span>Es una actividad de cosecha</span>
            </label>
            <small class="hint">
              Activa el control de producción terminada frente al salario de los trabajadores participantes.
            </small>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="orden">Orden</label>
              <input
                id="orden"
                v-model.number="form.orden"
                type="number"
                min="1"
                placeholder="1"
              />
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.activo" />
                <span>Activo</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
        </div>
        <div class="modal-body">
          <p>¿Está seguro de eliminar el tipo de cultivo <strong>{{ selectedTipo?.nombre }}</strong>?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">Cancelar</button>
          <button class="btn btn-danger" @click="deleteTipo" :disabled="deleting">
            {{ deleting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import TipoCultivoService from '@/services/TipoCultivoService'
import type { CategoriaTipoCultivo, TipoCultivo, TipoCultivoRequest } from '@/types/TipoCultivo'

const tiposCultivo = ref<TipoCultivo[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const selectedTipo = ref<TipoCultivo | null>(null)

const totalActivos = computed(() => tiposCultivo.value.filter(tipo => tipo.activo).length)
const totalCosecha = computed(() => tiposCultivo.value.filter(tipo => tipo.esCosecha).length)

const categoriaLabel = (categoria: CategoriaTipoCultivo): string => ({
  CANNA: 'Caña',
  VIANDA: 'Vianda',
  OTRO: 'Otro'
})[categoria]

const form = ref<TipoCultivoRequest>({
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: 'OTRO',
  requiereCampo: false,
  esCosecha: false,
  activo: true,
  orden: undefined
})

const loadData = async () => {
  loading.value = true
  try {
    const response = await TipoCultivoService.search({
      page: 0,
      pageSize: 100,
      sortBy: 'orden',
      sortType: 'ASC'
    })
    tiposCultivo.value = Array.isArray(response?.data) ? response.data : []
  } catch (error) {
    console.error('Error loading tipos de cultivo:', error)
  } finally {
    loading.value = false
  }
}

const openModal = (tipo?: TipoCultivo) => {
  if (tipo) {
    isEditing.value = true
    selectedTipo.value = tipo
    form.value = {
      codigo: tipo.codigo,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      categoria: tipo.categoria,
      requiereCampo: tipo.requiereCampo,
      esCosecha: tipo.esCosecha,
      activo: tipo.activo,
      orden: tipo.orden
    }
  } else {
    isEditing.value = false
    selectedTipo.value = null
    form.value = {
      codigo: '',
      nombre: '',
      descripcion: '',
      categoria: 'OTRO' as CategoriaTipoCultivo,
      requiereCampo: false,
      esCosecha: false,
      activo: true,
      orden: tiposCultivo.value.length + 1
    }
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedTipo.value = null
}

const save = async () => {
  saving.value = true
  try {
    if (isEditing.value && selectedTipo.value) {
      await TipoCultivoService.update(selectedTipo.value.id, form.value)
    } else {
      await TipoCultivoService.create(form.value)
    }
    closeModal()
    await loadData()
  } catch (error) {
    console.error('Error saving tipo de cultivo:', error)
    alert('Error al guardar')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (tipo: TipoCultivo) => {
  selectedTipo.value = tipo
  showDeleteConfirm.value = true
}

const deleteTipo = async () => {
  if (!selectedTipo.value) return
  deleting.value = true
  try {
    await TipoCultivoService.delete(selectedTipo.value.id)
    showDeleteConfirm.value = false
    selectedTipo.value = null
    await loadData()
  } catch (error) {
    console.error('Error deleting tipo de cultivo:', error)
    alert('Error al eliminar')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.tipo-cultivo-list {
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

.actions-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.loading {
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

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.data-table code {
  background: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.875rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: #d4edda;
  color: #155724;
}

.badge-secondary {
  background: #e9ecef;
  color: #6c757d;
}

.badge-active {
  background: #cce5ff;
  color: #004085;
}

.badge-inactive {
  background: #f8d7da;
  color: #721c24;
}

.actions {
  white-space: nowrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
}

.btn-edit {
  background: #ffc107;
  color: #212529;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.empty-message {
  text-align: center;
  color: #6c757d;
  padding: 2rem !important;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sm {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
}

.hint {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.75rem;
}

/* Refresco visual del nomenclador */
.tipo-cultivo-list {
  max-width: 1320px;
  padding: 2rem;
  color: #21322a;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.75rem 2rem;
  margin-bottom: 1.25rem;
  border: 1px solid #dce9df;
  border-radius: 20px;
  background: linear-gradient(120deg, #f5fbf4 0%, #fffdf6 100%);
  box-shadow: 0 10px 30px rgba(30, 74, 43, 0.08);
}

.page-header h1 {
  margin: 0.2rem 0 0;
  color: #163c28;
  font-size: clamp(1.65rem, 3vw, 2.15rem);
  letter-spacing: -0.035em;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  color: #43835a;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.subtitle {
  max-width: 680px;
  margin: 0.6rem 0 0;
  color: #5d7065;
  line-height: 1.55;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  background: #fff;
  border: 1px solid #e3ebe4;
  border-radius: 14px;
}

.summary-card strong { display: block; color: #1e412b; font-size: 1.25rem; }
.summary-card span:not(.summary-icon) { color: #6d7c71; font-size: 0.82rem; }
.summary-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
}
.icon-green { color: #257143; background: #e5f5e8; }
.icon-blue { color: #316f9c; background: #e7f2fa; }
.icon-orange { color: #ad6a22; background: #fff1df; }

.table-container {
  border: 1px solid #e2eae3;
  border-radius: 18px;
  overflow-x: auto;
  box-shadow: 0 12px 30px rgba(21, 57, 34, 0.07);
}

.data-table { min-width: 1080px; }
.data-table th,
.data-table td { padding: 1rem; border-color: #edf2ed; vertical-align: middle; }
.data-table th {
  background: #f7faf7;
  color: #58705e;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.065em;
  text-transform: uppercase;
}
.data-table tbody tr:hover { background: #f7fbf7; }
.data-table code {
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  background: #edf4ee;
  color: #326042;
  font-size: 0.78rem;
  font-weight: 700;
}
.crop-name { color: #213c2b; }

.category-pill,
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.category-pill { padding: 0.35rem 0.65rem; }
.category-canna { color: #8a5318; background: #fff0d9; }
.category-vianda { color: #275c3b; background: #e0f3e5; }
.category-otro { color: #5b5e7c; background: #ebecf8; }
.badge { padding: 0.35rem 0.6rem; border: 1px solid transparent; }
.badge-success { background: #e4f6e8; color: #23733b; border-color: #c5e9ce; }
.badge-secondary { background: #f2f4f2; color: #66746a; border-color: #e4e8e4; }
.badge-active { background: #e3f5e7; color: #23733b; }
.badge-inactive { background: #fce9e9; color: #aa4141; }
.badge-active .fa-circle,
.badge-inactive .fa-circle { font-size: 0.5rem; }

.btn { border-radius: 9px; font-weight: 700; }
.btn-primary {
  padding: 0.8rem 1rem;
  background: #257143;
  box-shadow: 0 7px 16px rgba(37, 113, 67, 0.22);
}
.btn-primary:hover { background: #195b34; transform: translateY(-1px); }
.icon-button {
  width: 34px;
  height: 34px;
  margin-right: 0.35rem;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;
}
.icon-button:hover { transform: translateY(-1px); }
.btn-edit { color: #3a713e; background: #e6f4e8; }
.btn-delete { color: #b04444; background: #fbeaea; }

.empty-message { padding: 3rem !important; color: #6b7c70; }
.empty-message i { display: block; margin-bottom: 0.7rem; color: #77a082; font-size: 1.8rem; }
.empty-message span { display: block; }
.empty-action {
  margin-top: 0.8rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #24713f;
  font-weight: 700;
  cursor: pointer;
}

.cultivos-panel {
  padding: 1.35rem;
  border: 1px solid #e2eae3;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(21, 57, 34, 0.07);
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 0.25rem 1.1rem;
}

.panel-heading h2 {
  margin: 0;
  color: #1e412b;
  font-size: 1.05rem;
}

.panel-heading p {
  margin: 0.3rem 0 0;
  color: #718076;
  font-size: 0.82rem;
}

.result-count {
  padding: 0.38rem 0.65rem;
  border-radius: 999px;
  background: #f1f6f1;
  color: #56715e;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.cultivos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 1rem;
}

.cultivo-card {
  display: flex;
  min-height: 245px;
  flex-direction: column;
  padding: 1.15rem;
  border: 1px solid #e4ebe5;
  border-radius: 14px;
  background: linear-gradient(160deg, #fff 0%, #fbfdfb 100%);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.cultivo-card:hover {
  transform: translateY(-3px);
  border-color: #b8d9c0;
  box-shadow: 0 10px 22px rgba(30, 86, 48, 0.1);
}

.cultivo-card.inactive { opacity: 0.64; }

.card-topline,
.card-footer,
.card-actions,
.card-meta {
  display: flex;
  align-items: center;
}

.card-topline { justify-content: space-between; gap: 0.75rem; }
.card-topline code {
  padding: 0.28rem 0.45rem;
  border-radius: 6px;
  background: #edf4ee;
  color: #326042;
  font-size: 0.75rem;
  font-weight: 800;
}

.cultivo-card h3 {
  margin: 1rem 0 0.35rem;
  color: #1e3d29;
  font-size: 1.1rem;
  letter-spacing: -0.015em;
}

.card-description {
  min-height: 2.8rem;
  margin: 0;
  color: #6b7c70;
  font-size: 0.82rem;
  line-height: 1.45;
}

.feature-list {
  display: grid;
  gap: 0.45rem;
  margin: 1rem 0;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #79857d;
  font-size: 0.76rem;
}

.feature i { width: 14px; color: #9aa59e; }
.feature.enabled { color: #28663c; font-weight: 700; }
.feature.enabled i { color: #2d8a4d; }
.feature.harvest.enabled { color: #9a5f1d; }
.feature.harvest.enabled i { color: #c37b28; }

.card-footer {
  justify-content: space-between;
  gap: 0.8rem;
  padding-top: 0.85rem;
  margin-top: auto;
  border-top: 1px solid #edf1ed;
}

.card-meta { gap: 0.65rem; color: #77847a; font-size: 0.72rem; }
.status-dot { display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; color: #a04b4b; }
.status-dot::before { width: 7px; height: 7px; border-radius: 50%; background: #d46a6a; content: ''; }
.status-dot.active { color: #297342; }
.status-dot.active::before { background: #42a05d; }
.card-actions { gap: 0.25rem; }
.card-actions .icon-button { margin-right: 0; }

.modal-overlay { padding: 1rem; background: rgba(17, 36, 24, 0.46); backdrop-filter: blur(3px); }
.modal { border-radius: 16px; }
.modal-header { padding: 1.25rem 1.5rem; border-color: #ebf0eb; background: #fbfdfb; }
.modal-header h2 { color: #1e402b; }
.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  padding: 0.65rem 0.7rem;
  border-color: #d9e4da;
  border-radius: 8px;
  background: #fff;
}
.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  border-color: #54a16c;
  box-shadow: 0 0 0 3px rgba(84, 161, 108, 0.15);
}

@media (max-width: 720px) {
  .tipo-cultivo-list { padding: 1rem; }
  .page-header { align-items: flex-start; flex-direction: column; padding: 1.35rem; }
  .page-header .btn { width: 100%; justify-content: center; }
  .summary-grid { grid-template-columns: 1fr; gap: 0.65rem; }
  .form-row { flex-direction: column; gap: 0; }
  .cultivos-panel { padding: 1rem; }
  .panel-heading { align-items: flex-start; flex-direction: column; }
  .cultivos-grid { grid-template-columns: 1fr; }
}
</style>
