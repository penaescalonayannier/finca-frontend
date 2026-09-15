<!-- src/components/EditarCentroCosto.vue -->
<template>
  <div class="editar-centro-costo">
    <div class="header">
      <h2>Editar Centro de Costo</h2>
    </div>

    <div v-if="cargando" class="loading">
      <div class="spinner"></div>
      <p>Cargando centro de costo...</p>
    </div>

    <form v-else @submit.prevent="guardar" class="formulario">
      <div class="form-group">
        <label for="codigo">Codigo *</label>
        <input
          type="text"
          id="codigo"
          v-model="form.codigo"
          placeholder="Ej: 700.05"
          required
        />
        <small class="hint">Codigo contable unico (usar formato 700.XX)</small>
      </div>

      <div class="form-group">
        <label for="nombre">Nombre *</label>
        <input
          type="text"
          id="nombre"
          v-model="form.nombre"
          placeholder="Nombre del centro de costo"
          required
        />
      </div>

      <div class="form-group">
        <label for="descripcion">Descripcion</label>
        <textarea
          id="descripcion"
          v-model="form.descripcion"
          placeholder="Descripcion opcional"
          rows="3"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="tipo">Tipo de Cuenta *</label>
          <select id="tipo" v-model="form.tipo" required>
            <option value="COSTO">Costo</option>
            <option value="GASTO">Gasto</option>
            <option value="ACTIVO">Activo</option>
            <option value="PASIVO">Pasivo</option>
            <option value="PATRIMONIO">Patrimonio</option>
            <option value="INGRESO">Ingreso</option>
          </select>
        </div>

        <div class="form-group">
          <label for="naturaleza">Naturaleza *</label>
          <select id="naturaleza" v-model="form.naturaleza" required>
            <option value="DEUDORA">Deudora</option>
            <option value="ACREEDORA">Acreedora</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="nivel">Nivel *</label>
          <input
            type="number"
            id="nivel"
            v-model.number="form.nivel"
            min="1"
            max="5"
            required
          />
          <small class="hint">Nivel jerarquico (2 para subcuentas de 700)</small>
        </div>

        <div class="form-group">
          <label for="cuentaPadre">Cuenta Padre</label>
          <select id="cuentaPadre" v-model="form.cuentaPadreId">
            <option value="">Sin cuenta padre</option>
            <option v-for="cuenta in cuentasPadre" :key="cuenta.id" :value="cuenta.id">
              {{ cuenta.codigo }} - {{ cuenta.nombre }}
            </option>
          </select>
        </div>
      </div>

      <div class="form-row checkboxes">
        <div class="form-group checkbox">
          <label>
            <input type="checkbox" v-model="form.permiteMovimiento" />
            Permite Movimiento
          </label>
        </div>

        <div class="form-group checkbox">
          <label>
            <input type="checkbox" v-model="form.activo" />
            Activo
          </label>
        </div>
      </div>

      <div v-if="mensaje.texto" :class="['mensaje', mensaje.tipo]">
        {{ mensaje.texto }}
      </div>

      <div class="form-actions">
        <router-link to="/centros-costo" class="btn-cancelar">
          Cancelar
        </router-link>
        <button type="submit" class="btn-guardar" :disabled="guardando">
          {{ guardando ? 'Guardando...' : 'Actualizar Centro de Costo' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CuentaContableService } from '@/services/ContabilidadService'
import type { CuentaContable, CuentaContableRequest, TipoCuenta, NaturalezaCuenta } from '@/types/Contabilidad'

const router = useRouter()
const route = useRoute()

const form = ref<CuentaContableRequest>({
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo: 'COSTO' as TipoCuenta,
  naturaleza: 'DEUDORA' as NaturalezaCuenta,
  nivel: 2,
  cuentaPadreId: undefined,
  permiteMovimiento: true,
  esCentroCosto: true,
  activo: true
})

const cuentasPadre = ref<CuentaContable[]>([])
const cargando = ref(true)
const guardando = ref(false)
const mensaje = ref({ texto: '', tipo: 'exito' })

const cargarCuentasPadre = async () => {
  try {
    // Load cost centers to allow creating sub-accounts at any level
    const cuentas = await CuentaContableService.getCentrosCosto()
    cuentasPadre.value = cuentas.sort((a, b) => a.codigo.localeCompare(b.codigo))
  } catch (error) {
    console.error('Error al cargar cuentas padre:', error)
  }
}

const cargarCentroCosto = async () => {
  const id = route.params.id as string
  if (!id) {
    mensaje.value = { texto: 'ID no valido', tipo: 'error' }
    cargando.value = false
    return
  }

  try {
    const cuenta = await CuentaContableService.getById(id)
    form.value = {
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      descripcion: cuenta.descripcion || '',
      tipo: cuenta.tipo,
      naturaleza: cuenta.naturaleza,
      nivel: cuenta.nivel,
      cuentaPadreId: cuenta.cuentaPadreId,
      permiteMovimiento: cuenta.permiteMovimiento,
      esCentroCosto: cuenta.esCentroCosto,
      activo: cuenta.activo
    }
  } catch (error) {
    console.error('Error al cargar centro de costo:', error)
    mensaje.value = { texto: 'Error al cargar el centro de costo', tipo: 'error' }
  } finally {
    cargando.value = false
  }
}

const guardar = async () => {
  if (!form.value.codigo.trim() || !form.value.nombre.trim()) {
    mensaje.value = { texto: 'Complete los campos obligatorios', tipo: 'error' }
    return
  }

  guardando.value = true
  mensaje.value = { texto: '', tipo: 'exito' }

  const id = route.params.id as string

  try {
    // Always keep as cost center
    form.value.esCentroCosto = true

    await CuentaContableService.update(id, form.value)
    mensaje.value = { texto: 'Centro de costo actualizado exitosamente', tipo: 'exito' }

    // Redirect after short delay
    setTimeout(() => {
      router.push('/centros-costo')
    }, 1000)
  } catch (error: unknown) {
    console.error('Error al actualizar centro de costo:', error)
    const err = error as { response?: { data?: { message?: string } } }
    const errorMsg = err.response?.data?.message || 'Error al actualizar el centro de costo'
    mensaje.value = { texto: errorMsg, tipo: 'error' }
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  await cargarCuentasPadre()
  await cargarCentroCosto()
})
</script>

<style scoped>
.editar-centro-costo {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  color: #1abc9c;
  margin: 0;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #7f8c8d;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #1abc9c;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.formulario {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-width: 700px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #1abc9c;
}

.form-group textarea {
  resize: vertical;
}

.hint {
  display: block;
  margin-top: 5px;
  color: #7f8c8d;
  font-size: 0.85em;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-row.checkboxes {
  margin-top: 10px;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.mensaje {
  margin: 20px 0;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
}

.mensaje.exito {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.mensaje.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.btn-cancelar {
  padding: 12px 24px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
  transition: background-color 0.3s;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}

.btn-guardar {
  padding: 12px 24px;
  background-color: #1abc9c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #16a085;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancelar,
  .btn-guardar {
    width: 100%;
    text-align: center;
  }
}
</style>
