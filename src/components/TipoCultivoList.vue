<template>
  <div class="tipo-cultivo-list">
    <div class="page-header">
      <h1>Tipos de Cultivo</h1>
      <p class="subtitle">Nomenclador de cultivos para reportes de trabajo</p>
    </div>

    <div class="actions-bar">
      <button class="btn btn-primary" @click="openModal()">
        <i class="fa-solid fa-plus"></i> Nuevo Tipo de Cultivo
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>

    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Requiere Campo</th>
            <th>Estado</th>
            <th>Orden</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tipo in tiposCultivo" :key="tipo.id">
            <td><code>{{ tipo.codigo }}</code></td>
            <td>{{ tipo.nombre }}</td>
            <td>{{ tipo.descripcion || '-' }}</td>
            <td>
              <span :class="['badge', tipo.requiereCampo ? 'badge-success' : 'badge-secondary']">
                {{ tipo.requiereCampo ? 'Sí (Bloque/Campo)' : 'No' }}
              </span>
            </td>
            <td>
              <span :class="['badge', tipo.activo ? 'badge-active' : 'badge-inactive']">
                {{ tipo.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>{{ tipo.orden ?? '-' }}</td>
            <td class="actions">
              <button class="btn btn-sm btn-edit" @click="openModal(tipo)" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-delete" @click="confirmDelete(tipo)" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
          <tr v-if="tiposCultivo.length === 0">
            <td colspan="7" class="empty-message">No hay tipos de cultivo registrados</td>
          </tr>
        </tbody>
      </table>
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
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.requiereCampo" />
              <span>Requiere selección de Bloque y Campo</span>
            </label>
            <small class="hint">
              Marcar para cultivos como Caña que necesitan identificar bloque y campo específico.
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
import { ref, onMounted } from 'vue'
import TipoCultivoService from '@/services/TipoCultivoService'
import type { TipoCultivo, TipoCultivoRequest } from '@/types/TipoCultivo'

const tiposCultivo = ref<TipoCultivo[]>([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const selectedTipo = ref<TipoCultivo | null>(null)

const form = ref<TipoCultivoRequest>({
  codigo: '',
  nombre: '',
  descripcion: '',
  requiereCampo: false,
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
    tiposCultivo.value = response.content
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
      requiereCampo: tipo.requiereCampo,
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
      requiereCampo: false,
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
</style>
