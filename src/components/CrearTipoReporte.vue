<!-- src/components/CrearTipoReporte.vue -->
<template>
  <div class="crear-tipo-reporte">
    <div class="formulario-contenedor">
      <h2>Crear Nuevo Tipo de Reporte</h2>

      <form @submit.prevent="guardarTipo" class="formulario">
        <div class="grupo-formulario">
          <label for="codigo">Código *</label>
          <input
            id="codigo"
            v-model="formulario.codigo"
            type="text"
            placeholder="Ej: REPORTE_TALLER"
            required
          />
        </div>

        <div class="grupo-formulario">
          <label for="nombre">Nombre *</label>
          <input
            id="nombre"
            v-model="formulario.nombre"
            type="text"
            placeholder="Ej: Reporte de Taller"
            required
          />
        </div>

        <div class="grupo-formulario">
          <label for="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            v-model="formulario.descripcion"
            placeholder="Descripción del tipo de reporte"
            rows="3"
          ></textarea>
        </div>

        <div class="grupo-formulario">
          <label for="codigoCentroCosto">Código Centro de Costo *</label>
          <input
            id="codigoCentroCosto"
            v-model="formulario.codigoCentroCosto"
            type="text"
            placeholder="Ej: CC-001"
            required
          />
        </div>

        <div class="grupo-formulario">
          <label for="tipoSubclasificacion">Tipo de Subclasificación *</label>
          <select
            id="tipoSubclasificacion"
            v-model="formulario.tipoSubclasificacion"
            required
          >
            <option value="NINGUNO">Sin subclasificación</option>
            <option value="CULTIVO">Tipo de Cultivo</option>
            <option value="ANIMAL">Tipo de Animal (Vaquería)</option>
          </select>
        </div>

        <!-- Opciones de Cultivo -->
        <div v-if="formulario.tipoSubclasificacion === 'CULTIVO'" class="grupo-formulario">
          <label for="tipoCultivoCategoriaFiltro">Filtro de Categoría de Cultivo</label>
          <select
            id="tipoCultivoCategoriaFiltro"
            v-model="formulario.tipoCultivoCategoriaFiltro"
          >
            <option :value="null">Mostrar todos los cultivos</option>
            <option value="CANNA">Solo Caña</option>
            <option value="VIANDA">Solo Viandas</option>
            <option value="OTRO">Otros cultivos</option>
          </select>
        </div>

        <div v-if="formulario.tipoSubclasificacion === 'CULTIVO'" class="grupo-formulario">
          <label for="tipoCultivoAutoId">Auto-seleccionar Tipo de Cultivo</label>
          <select
            id="tipoCultivoAutoId"
            v-model="formulario.tipoCultivoAutoId"
          >
            <option :value="null">No auto-seleccionar</option>
            <option
              v-for="cultivo in tiposCultivo"
              :key="cultivo.id"
              :value="cultivo.id"
            >
              {{ cultivo.nombre }} ({{ cultivo.codigo }})
            </option>
          </select>
          <small class="help-text">Si se selecciona, el reporte usará automáticamente este cultivo</small>
        </div>

        <div class="grupo-formulario checkbox-grupo">
          <label>
            <input
              type="checkbox"
              v-model="formulario.requiereCampo"
            />
            Requiere Bloque/Campo
          </label>
          <small class="help-text">Marcar si el reporte necesita especificar bloque y campo</small>
        </div>

        <div class="grupo-formulario">
          <label for="orden">Orden</label>
          <input
            id="orden"
            v-model.number="formulario.orden"
            type="number"
            min="0"
            placeholder="Ej: 1"
          />
        </div>

        <div class="grupo-formulario checkbox-grupo">
          <label>
            <input
              type="checkbox"
              v-model="formulario.activo"
            />
            Activo
          </label>
        </div>

        <div class="acciones">
          <button type="submit" :disabled="isLoading" class="btn-guardar">
            {{ isLoading ? 'Guardando...' : 'Guardar Tipo de Reporte' }}
          </button>
          <button type="button" @click="irALista" class="btn-cancelar">Cancelar</button>
        </div>
      </form>

      <div v-if="mensaje.texto" :class="['mensaje', mensaje.tipo]">
        {{ mensaje.texto }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import TipoReporteService from '@/services/TipoReporteService'
import TipoCultivoService from '@/services/TipoCultivoService'
import type { TipoReporteRequest, TipoSubclasificacion, CategoriaTipoCultivoFiltro } from '@/types/TipoReporte'
import type { TipoCultivo } from '@/types/TipoCultivo'

const router = useRouter()

const formulario = ref<TipoReporteRequest>({
  codigo: '',
  nombre: '',
  descripcion: '',
  codigoCentroCosto: '',
  tipoSubclasificacion: 'NINGUNO',
  tipoCultivoCategoriaFiltro: null,
  tipoCultivoAutoId: undefined,
  requiereCampo: false,
  activo: true,
  orden: 0
})

const tiposCultivo = ref<TipoCultivo[]>([])
const isLoading = ref(false)
const mensaje = ref({ texto: '', tipo: 'exito' })

const cargarTiposCultivo = async () => {
  try {
    tiposCultivo.value = await TipoCultivoService.getAll()
  } catch (error) {
    console.error('Error al cargar tipos de cultivo:', error)
  }
}

// Reset cultivo options when subclasificacion changes
watch(() => formulario.value.tipoSubclasificacion, (newVal) => {
  if (newVal !== 'CULTIVO') {
    formulario.value.tipoCultivoCategoriaFiltro = null
    formulario.value.tipoCultivoAutoId = undefined
  }
})

const guardarTipo = async () => {
  if (!formulario.value.codigo || !formulario.value.nombre || !formulario.value.codigoCentroCosto) {
    mensaje.value = { texto: 'Por favor completa los campos requeridos', tipo: 'error' }
    return
  }

  isLoading.value = true
  try {
    await TipoReporteService.create(formulario.value)
    mensaje.value = { texto: 'Tipo de reporte creado exitosamente', tipo: 'exito' }
    setTimeout(() => {
      router.push('/lista-tipo-reportes')
    }, 1500)
  } catch (error) {
    console.error('Error al crear tipo de reporte:', error)
    mensaje.value = { texto: 'Error al crear el tipo de reporte', tipo: 'error' }
  } finally {
    isLoading.value = false
  }
}

const irALista = () => {
  router.push('/lista-tipo-reportes')
}

onMounted(() => {
  cargarTiposCultivo()
})
</script>

<style scoped>
.crear-tipo-reporte {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.formulario-contenedor {
  max-width: 700px;
  margin: 0 auto;
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.formulario-contenedor h2 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 30px;
}

.grupo-formulario {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.grupo-formulario label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.grupo-formulario input,
.grupo-formulario select,
.grupo-formulario textarea {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 1em;
  font-family: inherit;
}

.grupo-formulario input:focus,
.grupo-formulario select:focus,
.grupo-formulario textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.checkbox-grupo {
  flex-direction: row;
  align-items: center;
}

.checkbox-grupo label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 0;
  cursor: pointer;
}

.checkbox-grupo input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.help-text {
  color: #7f8c8d;
  font-size: 0.85em;
  margin-top: 5px;
}

.acciones {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.btn-guardar {
  flex: 1;
  padding: 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #229954;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  flex: 1;
  padding: 12px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}

.mensaje {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
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
</style>
