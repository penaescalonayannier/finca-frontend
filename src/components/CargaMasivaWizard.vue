<!-- src/components/CargaMasivaWizard.vue -->

<template>
  <div class="carga-masiva-wizard">
    <div class="wizard-header">
      <h3>⚡ Asistente de Carga Masiva de Reportes</h3>
      <p class="paso-actual">Paso {{ pasoActual }} de 4</p>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: (pasoActual / 4) * 100 + '%' }"></div>
    </div>

    <form @submit.prevent="siguiente">
      <!-- PASO 1: Información del Reporte -->
      <div v-if="pasoActual === 1" class="paso-content">
        <h4>Información del Reporte</h4>

        <div class="form-row">
          <div class="form-group form-group-half">
            <label for="codigo">Código *</label>
            <input
              id="codigo"
              v-model="form.codigo"
              type="text"
              required
              placeholder="Ej: REP-2026-06"
            />
          </div>

          <div class="form-group form-group-half">
            <label for="fecha">Fecha</label>
            <input
              id="fecha"
              v-model="form.fecha"
              type="date"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group form-group-half">
            <label for="bloque">Bloque *</label>
            <input
              id="bloque"
              v-model="form.bloque"
              type="text"
              required
              placeholder="Ej: B-001"
            />
          </div>

          <div class="form-group form-group-half">
            <label for="campo">Campo *</label>
            <input
              id="campo"
              v-model="form.campo"
              type="text"
              required
              placeholder="Ej: Campo A"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group form-group-half">
            <label for="area">Área *</label>
            <input
              id="area"
              v-model="form.area"
              type="text"
              required
              placeholder="Ej: Área 1"
            />
          </div>

          <div class="form-group form-group-half">
            <label for="norma">Norma *</label>
            <input
              id="norma"
              v-model="form.norma"
              type="text"
              required
              placeholder="Ej: N-001"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group form-group-half">
            <label for="year">Año *</label>
            <input
              id="year"
              v-model="form.year"
              type="text"
              required
              placeholder="Ej: 2026"
            />
          </div>

          <div class="form-group form-group-half">
            <label for="mes">Mes *</label>
            <select id="mes" v-model="form.mes" required class="form-select">
              <option value="">Seleccione un mes</option>
              <option value="Enero">Enero</option>
              <option value="Febrero">Febrero</option>
              <option value="Marzo">Marzo</option>
              <option value="Abril">Abril</option>
              <option value="Mayo">Mayo</option>
              <option value="Junio">Junio</option>
              <option value="Julio">Julio</option>
              <option value="Agosto">Agosto</option>
              <option value="Septiembre">Septiembre</option>
              <option value="Octubre">Octubre</option>
              <option value="Noviembre">Noviembre</option>
              <option value="Diciembre">Diciembre</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="trabajadorResponsable">Trabajador Responsable *</label>
            <select id="trabajadorResponsable" v-model="form.trabajadorResponsableId" required class="form-select">
              <option value="">Seleccione un trabajador</option>
              <option
                v-for="t in trabajadoresOrdenados"
                :key="t.id"
                :value="t.id"
              >
                {{ t.nombre }} - {{ t.ruc }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- PASO 2: Seleccionar Grupo y Trabajadores -->
      <div v-if="pasoActual === 2" class="paso-content">
        <h4>Seleccionar Trabajadores</h4>

        <div v-if="grupos.length === 0" class="no-data">
          <p>No hay grupos disponibles.</p>
        </div>

        <div v-else>
          <!-- Tabs de Grupos -->
          <div class="grupos-tabs">
            <button
              v-for="grupo in grupos"
              :key="grupo.id"
              type="button"
              :class="['grupo-tab', { activo: grupoSeleccionado === grupo.id }]"
              @click.prevent="grupoSeleccionado = grupo.id"
            >
              {{ grupo.nombre }}
            </button>
          </div>

          <!-- Acciones por grupo -->
          <div v-if="grupoSeleccionado" class="grupo-actions">
            <button type="button" @click.prevent="seleccionarTodosDelGrupo" class="btn-select-all">
              ✓ Todos del Grupo
            </button>
            <button type="button" @click.prevent="deseleccionarTodosDelGrupo" class="btn-select-none">
              ✕ Ninguno del Grupo
            </button>
          </div>

          <!-- Trabajadores del grupo seleccionado -->
          <div v-if="trabajadoresDelGrupo.length === 0" class="no-data">
            <p>Este grupo no tiene trabajadores asignados.</p>
          </div>

          <div v-else class="trabajadores-grid">
            <label v-for="t in trabajadoresDelGrupo" :key="t.id" class="trabajador-checkbox">
              <input
                type="checkbox"
                :value="t.id"
                :checked="trabajadoresSeleccionados.has(t.id)"
                @change="toggleTrabajador(t.id)"
              />
              <span>{{ t.nombre }}</span>
            </label>
          </div>

          <!-- Resumen de selección -->
          <div v-if="trabajadoresSeleccionados.size > 0" class="selection-summary">
            <p>
              <strong>Seleccionados:</strong> {{ trabajadoresSeleccionados.size }} trabajador(es)
            </p>
          </div>
        </div>
      </div>

      <!-- PASO 3: Seleccionar Días -->
      <div v-if="pasoActual === 3" class="paso-content">
        <h4>Seleccionar Días del Mes</h4>

        <div class="dias-actions">
          <button type="button" @click.prevent="seleccionarTodosDias" class="btn-select-all">
            ✓ Todos los Días
          </button>
          <button type="button" @click.prevent="deseleccionarTodosDias" class="btn-select-none">
            ✕ Ningún Día
          </button>
        </div>

        <div v-if="diasDelMes.length === 0" class="no-data">
          <p>Por favor, seleccione primero un mes y un año válidos en el paso anterior.</p>
        </div>

        <div v-else class="dias-grid">
          <label v-for="dia in diasDelMes" :key="dia" class="dia-checkbox">
            <input
              type="checkbox"
              :checked="diasSeleccionados.has(dia)"
              @change="toggleDia(dia)"
            />
            <span>{{ dia }}</span>
          </label>
        </div>
      </div>

      <!-- PASO 4: Revisión y Confirmación -->
      <div v-if="pasoActual === 4" class="paso-content">
        <h4>Revisión y Confirmación</h4>

        <div class="resumen-final">
          <div class="resumen-item">
            <strong>Información del Reporte:</strong>
            <p>{{ form.codigo }} | {{ form.bloque }} | {{ form.campo }}</p>
            <p>{{ form.mes }} {{ form.year }}</p>
          </div>

          <div class="resumen-item">
            <strong>Trabajadores Seleccionados:</strong>
            <p>{{ trabajadoresSeleccionados.size }} trabajador(es)</p>
          </div>

          <div class="resumen-item">
            <strong>Días Seleccionados:</strong>
            <p>{{ diasSeleccionados.size }} día(s)</p>
          </div>

          <div class="resumen-item">
            <strong>Horas por Defecto:</strong>
            <input
              v-model="horasPorDefecto"
              type="text"
              placeholder="Ej: 8"
              class="form-input"
            />
          </div>

          <div class="resumen-total">
            <p>
              <strong>Total de Registros a Crear:</strong>
              <span class="numero">{{ diasSeleccionados.size * trabajadoresSeleccionados.size }}</span>
              ({{ diasSeleccionados.size }} días × {{ trabajadoresSeleccionados.size }} trabajadores)
            </p>
          </div>
        </div>
      </div>

      <!-- Botones de Navegación -->
      <div class="wizard-actions">
        <button
          type="button"
          @click="anterior"
          class="btn-anterior"
          :disabled="pasoActual === 1"
        >
          ← Anterior
        </button>

        <button
          type="button"
          v-if="pasoActual < 4"
          @click="siguiente"
          class="btn-siguiente"
        >
          Siguiente →
        </button>

        <button
          type="submit"
          v-if="pasoActual === 4"
          @click="crear"
          class="btn-crear"
          :disabled="isCreando"
        >
          {{ isCreando ? 'Creando...' : '✨ Crear Carga Masiva' }}
        </button>

        <button
          type="button"
          @click="cancelar"
          class="btn-cancelar"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ReporteService from '@/services/ReporteService'
import DiaTrabajoService from '@/services/DiaTrabajoService'
import TrabajadorService from '@/services/TrabajadorService'
import GrupoService from '@/services/GrupoService'
import type { Grupo, TrabajadorGrupo } from '@/types/Grupo'
import type { Trabajador } from '@/types/Trabajador'
import type { ReporteRequest } from '@/types/Reporte'
import type { TrabajadorDia } from '@/types/DiaTrabajo'

const emit = defineEmits<{
  created: []
  cancel: []
}>()

// Estado del wizard
const pasoActual = ref(1)
const isCreando = ref(false)
const trabajadores = ref<Trabajador[]>([])
const grupos = ref<Grupo[]>([])
const grupoSeleccionado = ref<string>('')

// Estado de selecciones
const diasSeleccionados = ref<Set<number>>(new Set())
const trabajadoresSeleccionados = ref<Set<string>>(new Set())
const horasPorDefecto = ref<string>('8')

// Formulario
const form = ref<ReporteRequest>({
  codigo: '',
  bloque: '',
  campo: '',
  area: '',
  norma: '',
  fecha: '',
  year: '',
  mes: '',
  trabajadorResponsableId: undefined,
  dias: []
})

// Trabajadores ordenados alfabéticamente
const trabajadoresOrdenados = computed(() => {
  return [...trabajadores.value].sort((a, b) => {
    return a.nombre.localeCompare(b.nombre)
  })
})

// Obtener trabajadores del grupo seleccionado
const trabajadoresDelGrupo = computed(() => {
  if (!grupoSeleccionado.value) return []
  const grupo = grupos.value.find(g => g.id === grupoSeleccionado.value)
  if (!grupo || !grupo.trabajadores) return []
  return grupo.trabajadores.sort((a, b) => a.nombre.localeCompare(b.nombre))
})

// Obtener número de días en el mes seleccionado
const obtenerDiasDelMes = (): number => {
  const mesIndex = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                     .indexOf(form.value.mes)

  if (mesIndex === -1 || !form.value.year) return 0

  const year = parseInt(form.value.year)
  return new Date(year, mesIndex + 1, 0).getDate()
}

// Obtener lista de días disponibles del mes
const diasDelMes = computed(() => {
  const cantidad = obtenerDiasDelMes()
  return Array.from({ length: cantidad }, (_, i) => i + 1)
})

// Toggle selección de día
const toggleDia = (dia: number) => {
  if (diasSeleccionados.value.has(dia)) {
    diasSeleccionados.value.delete(dia)
  } else {
    diasSeleccionados.value.add(dia)
  }
}

// Seleccionar todos los días del mes
const seleccionarTodosDias = () => {
  diasDelMes.value.forEach(d => diasSeleccionados.value.add(d))
}

// Deseleccionar todos los días
const deseleccionarTodosDias = () => {
  diasSeleccionados.value.clear()
}

// Toggle selección de trabajador
const toggleTrabajador = (trabajadorId: string) => {
  if (trabajadoresSeleccionados.value.has(trabajadorId)) {
    trabajadoresSeleccionados.value.delete(trabajadorId)
  } else {
    trabajadoresSeleccionados.value.add(trabajadorId)
  }
}

// Seleccionar todos los trabajadores del grupo actual
const seleccionarTodosDelGrupo = () => {
  trabajadoresDelGrupo.value.forEach(t => {
    trabajadoresSeleccionados.value.add(t.id)
  })
}

// Deseleccionar todos los trabajadores del grupo actual
const deseleccionarTodosDelGrupo = () => {
  trabajadoresDelGrupo.value.forEach(t => {
    trabajadoresSeleccionados.value.delete(t.id)
  })
}

// Navegar entre pasos
const validarPaso = (): boolean => {
  if (pasoActual.value === 1) {
    if (!form.value.codigo.trim()) {
      alert('El código es obligatorio')
      return false
    }
    if (!form.value.bloque.trim()) {
      alert('El bloque es obligatorio')
      return false
    }
    if (!form.value.campo.trim()) {
      alert('El campo es obligatorio')
      return false
    }
    if (!form.value.area.trim()) {
      alert('El área es obligatoria')
      return false
    }
    if (!form.value.norma.trim()) {
      alert('La norma es obligatoria')
      return false
    }
    if (!form.value.year.trim()) {
      alert('El año es obligatorio')
      return false
    }
    if (!form.value.mes) {
      alert('El mes es obligatorio')
      return false
    }
    if (!form.value.trabajadorResponsableId) {
      alert('El trabajador responsable es obligatorio')
      return false
    }
  } else if (pasoActual.value === 2) {
    if (trabajadoresSeleccionados.value.size === 0) {
      alert('Por favor, seleccione al menos un trabajador')
      return false
    }
  } else if (pasoActual.value === 3) {
    if (diasSeleccionados.value.size === 0) {
      alert('Por favor, seleccione al menos un día')
      return false
    }
  }
  return true
}

const siguiente = () => {
  if (validarPaso() && pasoActual.value < 4) {
    pasoActual.value++
  }
}

const anterior = () => {
  if (pasoActual.value > 1) {
    pasoActual.value--
  }
}

// Crear la carga masiva
const crear = async () => {
  if (!horasPorDefecto.value.trim()) {
    alert('Por favor, ingrese las horas por defecto')
    return
  }

  isCreando.value = true
  try {
    // Crear el reporte
    const reporteResponse = await ReporteService.crearReporte(form.value)
    const reporteId = reporteResponse.data.id

    if (reporteId) {
      // Crear días y trabajadores
      const diasOrdenados = Array.from(diasSeleccionados.value).sort((a, b) => a - b)
      const mesIndex = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                         .indexOf(form.value.mes)

      for (const diaNum of diasOrdenados) {
        const fechaStr = `${form.value.year}-${String(mesIndex + 1).padStart(2, '0')}-${String(diaNum).padStart(2, '0')}`

        const diaResponse = await DiaTrabajoService.agregarDia(reporteId, {
          fecha: fechaStr
        })
        const diaId = diaResponse.data.id

        for (const trabajadorId of trabajadoresSeleccionados.value) {
          await DiaTrabajoService.agregarTrabajadorADia(diaId, {
            trabajadorId,
            horas: horasPorDefecto.value,
            norma: ''
          })
        }
      }

      alert(`✅ Carga masiva creada exitosamente!\n${diasOrdenados.length} días × ${trabajadoresSeleccionados.value.size} trabajadores = ${diasOrdenados.length * trabajadoresSeleccionados.value.size} registros`)
      emit('created')
    }
  } catch (error) {
    console.error('Error al crear carga masiva:', error)
    alert('Error al crear la carga masiva')
  } finally {
    isCreando.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

// Cargar datos
const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({ size: 999 })
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  }
}

const cargarGrupos = async () => {
  try {
    const response = await GrupoService.getAll()
    grupos.value = response.data.data || []
    if (grupos.value.length > 0) {
      grupoSeleccionado.value = grupos.value[0].id
    }
  } catch (error) {
    console.error('Error al cargar grupos:', error)
    grupos.value = []
  }
}

onMounted(async () => {
  await cargarTrabajadores()
  await cargarGrupos()
})
</script>

<style scoped>
.carga-masiva-wizard {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  margin: 0 auto;
}

.wizard-header {
  text-align: center;
  margin-bottom: 20px;
}

.wizard-header h3 {
  margin: 0 0 5px;
  color: #2c3e50;
  font-size: 1.3em;
}

.paso-actual {
  margin: 0;
  color: #7f8c8d;
  font-size: 0.9em;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #ecf0f1;
  border-radius: 2px;
  margin-bottom: 25px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.3s ease;
}

.paso-content {
  margin-bottom: 20px;
}

.paso-content h4 {
  margin: 0 0 15px;
  color: #2c3e50;
  font-size: 1.1em;
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
}

.form-group-half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
  font-size: 0.9em;
}

.form-group input,
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95em;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* Grupos Tabs */
.grupos-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  -webkit-overflow-scrolling: touch;
}

.grupo-tab {
  padding: 8px 14px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  color: #666;
  white-space: nowrap;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.grupo-tab:hover {
  border-color: #3498db;
  color: #3498db;
  background: #ecf0f1;
}

.grupo-tab.activo {
  border-color: #3498db;
  background: #3498db;
  color: white;
  font-weight: 600;
}

/* Acciones */
.grupo-actions,
.dias-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.btn-select-all,
.btn-select-none {
  padding: 8px 14px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.btn-select-all:hover {
  background: #27ae60;
  color: white;
  border-color: #27ae60;
}

.btn-select-none:hover {
  background: #95a5a6;
  color: white;
  border-color: #95a5a6;
}

/* Grids */
.trabajadores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 5px;
}

.trabajadores-grid::-webkit-scrollbar {
  width: 6px;
}

.trabajadores-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.trabajadores-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.dias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.dia-checkbox,
.trabajador-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.dia-checkbox:hover,
.trabajador-checkbox:hover {
  border-color: #3498db;
  background: #ecf0f1;
}

.dia-checkbox input[type="checkbox"],
.trabajador-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #3498db;
}

.dia-checkbox input[type="checkbox"]:checked + span,
.trabajador-checkbox input[type="checkbox"]:checked + span {
  color: #3498db;
  font-weight: 600;
}

.trabajador-checkbox span {
  font-size: 0.9em;
  color: #555;
}

/* Mensajes */
.no-data {
  padding: 20px;
  text-align: center;
  color: #888;
  font-style: italic;
  font-size: 0.95em;
}

.selection-summary {
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
  border-radius: 4px;
  padding: 12px 15px;
  margin-top: 10px;
}

.selection-summary p {
  margin: 0;
  color: #2e7d32;
  font-size: 0.9em;
  font-weight: 500;
}

/* Resumen Final */
.resumen-final {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.resumen-item {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.resumen-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.resumen-item strong {
  color: #2c3e50;
  display: block;
  margin-bottom: 8px;
}

.resumen-item p {
  margin: 0;
  color: #555;
  font-size: 0.95em;
  line-height: 1.5;
}

.resumen-total {
  background: white;
  border: 2px solid #3498db;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  margin-top: 15px;
}

.resumen-total p {
  margin: 0;
  color: #2c3e50;
  font-size: 1em;
}

.numero {
  display: inline-block;
  min-width: 40px;
  background: #3498db;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 1.1em;
  margin: 0 5px;
}

/* Botones de Navegación */
.wizard-actions {
  display: flex;
  gap: 10px;
  justify-content: space-between;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-anterior,
.btn-siguiente,
.btn-crear,
.btn-cancelar {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: all 0.3s ease;
}

.btn-anterior,
.btn-siguiente {
  background: #3498db;
  color: white;
}

.btn-anterior:hover:not(:disabled),
.btn-siguiente:hover {
  background: #2980b9;
}

.btn-anterior:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  color: #999;
}

.btn-crear {
  background: linear-gradient(135deg, #27ae60, #16a34a);
  color: white;
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.2);
}

.btn-crear:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-crear:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.btn-cancelar {
  background: #95a5a6;
  color: white;
}

.btn-cancelar:hover {
  background: #7f8c8d;
}

@media (max-width: 768px) {
  .carga-masiva-wizard {
    padding: 15px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-group-half {
    flex: none;
  }

  .wizard-actions {
    flex-direction: column;
    gap: 8px;
  }

  .btn-anterior,
  .btn-siguiente,
  .btn-crear,
  .btn-cancelar {
    width: 100%;
  }

  .trabajadores-grid {
    grid-template-columns: 1fr;
    max-height: 250px;
  }

  .dias-grid {
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  }
}
</style>
