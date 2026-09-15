<template>
  <div class="config-empresa">
    <h2>Configuración de Empresa</h2>
    <p class="subtitle">Datos obligatorios para documentos oficiales (Modelos SC-2-08 y SC-2-12)</p>

    <div v-if="loading" class="loading">Cargando configuración...</div>

    <form v-else @submit.prevent="guardar" class="form-container">
      <fieldset>
        <legend>Datos de Identificación</legend>

        <div class="form-row">
          <div class="form-group">
            <label for="nombre">Nombre de la Empresa *</label>
            <input
              id="nombre"
              v-model="form.nombre"
              type="text"
              required
              placeholder="Ej: El Coloso S.A."
            />
          </div>

          <div class="form-group">
            <label for="codigo">Código ONEI</label>
            <input
              id="codigo"
              v-model="form.codigo"
              type="text"
              placeholder="Código de entidad"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="nit">NIT (Número de Identificación Tributaria) *</label>
            <input
              id="nit"
              v-model="form.nit"
              type="text"
              required
              placeholder="Obligatorio según Res. 55/2021"
            />
            <small class="hint">Campo obligatorio según normativa vigente</small>
          </div>

          <div class="form-group">
            <label for="cuentaBancaria">Cuenta Bancaria</label>
            <input
              id="cuentaBancaria"
              v-model="form.cuentaBancaria"
              type="text"
              placeholder="Número de cuenta"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Dirección</legend>

        <div class="form-row">
          <div class="form-group full-width">
            <label for="direccion">Dirección</label>
            <input
              id="direccion"
              v-model="form.direccion"
              type="text"
              placeholder="Calle, número, etc."
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="municipio">Municipio</label>
            <input
              id="municipio"
              v-model="form.municipio"
              type="text"
              placeholder="Ej: Puerto Padre"
            />
          </div>

          <div class="form-group">
            <label for="provincia">Provincia</label>
            <input
              id="provincia"
              v-model="form.provincia"
              type="text"
              placeholder="Ej: Las Tunas"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Contacto (Opcional)</legend>

        <div class="form-row">
          <div class="form-group">
            <label for="telefono">Teléfono</label>
            <input
              id="telefono"
              v-model="form.telefono"
              type="text"
              placeholder="Ej: +53 31 XXXXXX"
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="correo@empresa.cu"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="banco">Banco</label>
            <input
              id="banco"
              v-model="form.banco"
              type="text"
              placeholder="Ej: BANDEC"
            />
          </div>
          <div class="form-group"></div>
        </div>
      </fieldset>

      <div class="form-actions">
        <button type="submit" class="btn-guardar" :disabled="guardando">
          {{ guardando ? 'Guardando...' : 'Guardar Configuración' }}
        </button>
      </div>

      <div v-if="mensaje" :class="['mensaje', tipoMensaje]">
        {{ mensaje }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ConfiguracionEmpresaService from '@/services/ConfiguracionEmpresaService'
import type { ConfiguracionEmpresa } from '@/types/ConfiguracionEmpresa'

const loading = ref(true)
const guardando = ref(false)
const mensaje = ref('')
const tipoMensaje = ref<'success' | 'error'>('success')

const form = ref<ConfiguracionEmpresa>({
  nombre: '',
  codigo: '',
  nit: '',
  direccion: '',
  municipio: '',
  provincia: '',
  cuentaBancaria: '',
  banco: '',
  telefono: '',
  email: '',
  activo: true
})

const cargarConfiguracion = async () => {
  try {
    const response = await ConfiguracionEmpresaService.getActive()
    form.value = response.data
  } catch (error: unknown) {
    const axiosError = error as { response?: { status: number } }
    if (axiosError.response?.status !== 404) {
      console.error('Error cargando configuración:', error)
    }
  } finally {
    loading.value = false
  }
}

const guardar = async () => {
  guardando.value = true
  mensaje.value = ''

  try {
    if (form.value.id) {
      await ConfiguracionEmpresaService.update(form.value.id, form.value)
    } else {
      const response = await ConfiguracionEmpresaService.create(form.value)
      form.value = response.data
    }
    mensaje.value = 'Configuración guardada correctamente'
    tipoMensaje.value = 'success'
  } catch (error: unknown) {
    console.error('Error guardando:', error)
    const axiosError = error as { response?: { status: number; data?: { message?: string } }; message?: string }
    const serverMessage = axiosError.response?.data?.message
    const statusCode = axiosError.response?.status
    if (statusCode === 403) {
      mensaje.value = 'Error: No tiene permisos para esta acción'
    } else if (serverMessage) {
      mensaje.value = `Error: ${serverMessage}`
    } else {
      mensaje.value = `Error al guardar (${statusCode || axiosError.message || 'desconocido'})`
    }
    tipoMensaje.value = 'error'
  } finally {
    guardando.value = false
  }
}

onMounted(() => {
  cargarConfiguracion()
})
</script>

<style scoped>
.config-empresa {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin-bottom: 5px;
  color: #2c3e50;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 20px;
  font-size: 0.9em;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.form-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

fieldset {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
}

legend {
  font-weight: 600;
  color: #3498db;
  padding: 0 10px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
}

.form-group.full-width {
  flex: 2;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.hint {
  display: block;
  margin-top: 4px;
  font-size: 0.8em;
  color: #e67e22;
}

.form-actions {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #eee;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
  padding: 12px 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1em;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.mensaje {
  margin: 20px;
  padding: 12px;
  border-radius: 4px;
  text-align: center;
}

.mensaje.success {
  background-color: #d5f5e3;
  color: #27ae60;
}

.mensaje.error {
  background-color: #fadbd8;
  color: #e74c3c;
}
</style>
