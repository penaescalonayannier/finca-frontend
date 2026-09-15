<!-- src/components/CrearReporte.vue -->

<template>
  <div class="crear-reporte">
    <h3>{{ isEditing ? 'Editar Reporte' : 'Nuevo Reporte' }}</h3>

    <form @submit.prevent="guardar">
      <!-- Tipo de Reporte -->
      <div class="form-row">
        <div class="form-group">
          <label for="tipoReporte">Tipo de Reporte *</label>
          <select
            id="tipoReporte"
            v-model="form.tipoReporteId"
            required
            class="form-select"
            @change="onTipoReporteChange"
          >
            <option value="">Seleccione un tipo de reporte</option>
            <option
              v-for="tr in tiposReporte"
              :key="tr.id"
              :value="tr.id"
            >
              {{ tr.nombre }}
            </option>
          </select>
          <small v-if="tipoReporteSeleccionado" class="hint">
            Centro de costo: {{ tipoReporteSeleccionado.codigoCentroCosto }}
          </small>
        </div>
      </div>

      <!-- Tipo de Cultivo (solo si el TipoReporte lo requiere) -->
      <div v-if="mostrarTipoCultivo" class="form-row">
        <div class="form-group">
          <label for="tipoCultivo">Tipo de Cultivo *</label>
          <select
            id="tipoCultivo"
            v-model="form.tipoCultivoId"
            :required="mostrarTipoCultivo"
            class="form-select"
            @change="onTipoCultivoChange"
            :disabled="!!tipoReporteSeleccionado?.tipoCultivoAutoId"
          >
            <option value="">Seleccione un tipo de cultivo</option>
            <option
              v-for="tc in tiposCultivoFiltrados"
              :key="tc.id"
              :value="tc.id"
            >
              {{ tc.nombre }}
            </option>
          </select>
          <small v-if="tipoReporteSeleccionado?.tipoCultivoAutoId" class="hint hint-auto">
            Auto-seleccionado por el tipo de reporte
          </small>
          <small v-else-if="tipoCultivoSeleccionado && !tipoCultivoSeleccionado.requiereCampo" class="hint">
            Este cultivo NO requiere seleccionar Bloque y Campo
          </small>
        </div>
      </div>

      <!-- Tipo de Animal (solo si el TipoReporte es VAQUERIA) -->
      <div v-if="mostrarTipoAnimal" class="form-row">
        <div class="form-group">
          <label for="tipoAnimal">Tipo de Animal *</label>
          <select
            id="tipoAnimal"
            v-model="form.tipoAnimalId"
            :required="mostrarTipoAnimal"
            class="form-select"
          >
            <option :value="undefined">Seleccione un tipo de animal</option>
            <option
              v-for="ta in tiposAnimal"
              :key="ta.id"
              :value="ta.id"
            >
              {{ ta.nombre }}
            </option>
          </select>
        </div>
      </div>

      <!-- Información básica del reporte -->
      <div class="form-row">
        <div class="form-group form-group-half">
          <label for="codigo">Código (auto-generado)</label>
          <input
            id="codigo"
            :value="codigoPreview"
            type="text"
            disabled
            class="input-disabled input-codigo"
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
          <label for="year">Año *</label>
          <input
            id="year"
            v-model="form.year"
            type="text"
            required
            disabled
            class="input-disabled"
          />
        </div>
      </div>

      <!-- Bloque y Campo: solo visibles si el tipo de cultivo lo requiere -->
      <div v-if="requiereCampo" class="form-row">
        <div class="form-group form-group-half">
          <label for="bloque">Bloque *</label>
          <input
            id="bloque"
            v-model="form.bloque"
            type="text"
            :required="requiereCampo"
            placeholder="Ej: B-001"
          />
        </div>

        <div class="form-group form-group-half">
          <label for="campo">Campo *</label>
          <input
            id="campo"
            v-model="form.campo"
            type="text"
            :required="requiereCampo"
            placeholder="Ej: Campo A"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group form-group-half">
          <label for="area">Área {{ requiereCampo ? '*' : '' }}</label>
          <input
            id="area"
            v-model="form.area"
            type="text"
            :required="requiereCampo"
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

      <!-- Trabajador Responsable -->
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

      <!-- Mensaje informativo -->
      <div v-if="!isEditing" class="edicion-mensaje">
        <div class="info-box">
          <span class="info-icon">ℹ️</span>
          <p>
            Para agregar días y trabajadores, primero cree el reporte y luego use la vista de <strong>Detalle del Reporte</strong>.
          </p>
        </div>
      </div>

      <!-- Mensaje cuando se edita -->
      <div v-if="isEditing" class="edicion-mensaje">
        <div class="info-box">
          <span class="info-icon">ℹ️</span>
          <p>
            <strong>Modo Edición:</strong> Para agregar o modificar días y trabajadores,
            utilice la vista de <strong>Detalle del Reporte</strong>.
          </p>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-guardar" :disabled="isGuardando">
          {{ isGuardando ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
        </button>
        <button type="button" class="btn-cancelar" @click="cancelar">Cancelar</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ReporteService from '@/services/ReporteService'
import DiaTrabajoService from '@/services/DiaTrabajoService'
import TrabajadorService from '@/services/TrabajadorService'
import TipoCultivoService from '@/services/TipoCultivoService'
import TipoReporteService from '@/services/TipoReporteService'
import TipoAnimalService from '@/services/TipoAnimalService'
import type { Reporte, ReporteRequest } from '@/types/Reporte'
import type { DiaTrabajo, TrabajadorDia } from '@/types/DiaTrabajo'
import type { Trabajador } from '@/types/Trabajador'
import type { TipoCultivo, CategoriaTipoCultivo } from '@/types/TipoCultivo'
import type { TipoReporte } from '@/types/TipoReporte'
import type { TipoAnimal } from '@/types/TipoAnimal'
import type { AxiosError } from 'axios'

const props = defineProps<{
  reporte?: Reporte | null
}>()

const emit = defineEmits<{
  created: []
  updated: []
  cancel: []
}>()

const isEditing = computed(() => !!props.reporte?.id)
const isGuardando = ref(false)
const trabajadores = ref<Trabajador[]>([])
const diasOriginales = ref<DiaTrabajo[]>([])
const tiposCultivo = ref<TipoCultivo[]>([])
const tiposReporte = ref<TipoReporte[]>([])
const tiposAnimal = ref<TipoAnimal[]>([])

// Tipo de reporte seleccionado
const tipoReporteSeleccionado = computed(() => {
  if (!form.value.tipoReporteId) return null
  return tiposReporte.value.find(tr => tr.id === form.value.tipoReporteId) || null
})

// Tipos de cultivo filtrados según el TipoReporte seleccionado
const tiposCultivoFiltrados = computed(() => {
  const tipoReporte = tipoReporteSeleccionado.value
  if (!tipoReporte || tipoReporte.tipoSubclasificacion !== 'CULTIVO') {
    return tiposCultivo.value
  }

  // Si hay un filtro de categoría, aplicarlo
  if (tipoReporte.tipoCultivoCategoriaFiltro) {
    return tiposCultivo.value.filter(tc => tc.categoria === tipoReporte.tipoCultivoCategoriaFiltro)
  }

  return tiposCultivo.value
})

// Mostrar dropdown de tipo de cultivo
const mostrarTipoCultivo = computed(() => {
  const tipoReporte = tipoReporteSeleccionado.value
  return tipoReporte?.tipoSubclasificacion === 'CULTIVO'
})

// Mostrar dropdown de tipo de animal
const mostrarTipoAnimal = computed(() => {
  const tipoReporte = tipoReporteSeleccionado.value
  return tipoReporte?.tipoSubclasificacion === 'ANIMAL'
})

// Tipo de cultivo seleccionado
const tipoCultivoSeleccionado = computed(() => {
  if (!form.value.tipoCultivoId) return null
  return tiposCultivo.value.find(tc => tc.id === form.value.tipoCultivoId) || null
})

// Si el tipo de reporte requiere bloque/campo
const requiereCampo = computed(() => {
  // Prioridad: TipoReporte.requiereCampo > TipoCultivo.requiereCampo
  const tipoReporte = tipoReporteSeleccionado.value
  if (tipoReporte) {
    return tipoReporte.requiereCampo
  }
  return tipoCultivoSeleccionado.value?.requiereCampo ?? true
})

// Cuando cambia el tipo de reporte
const onTipoReporteChange = () => {
  const tipoReporte = tipoReporteSeleccionado.value

  // Reset subclasificaciones
  form.value.tipoCultivoId = ''
  form.value.tipoAnimalId = undefined

  if (tipoReporte) {
    // Auto-seleccionar tipo de cultivo si está configurado
    if (tipoReporte.tipoCultivoAutoId) {
      form.value.tipoCultivoId = tipoReporte.tipoCultivoAutoId
    }
  }

  // Limpiar campos si no se requieren
  if (!requiereCampo.value) {
    form.value.bloque = ''
    form.value.campo = ''
    form.value.area = ''
  }
}

// Cuando cambia el tipo de cultivo, limpiar campos si no se requieren
const onTipoCultivoChange = () => {
  if (!requiereCampo.value) {
    form.value.bloque = ''
    form.value.campo = ''
    form.value.area = ''
  }
}

// Trabajadores ordenados alfabéticamente
const trabajadoresOrdenados = computed(() => {
  return [...trabajadores.value].sort((a, b) => {
    return a.nombre.localeCompare(b.nombre)
  })
})

// Código que se generará (cargado del backend)
const codigoPreview = ref<string>('Cargando...')

// Cargar el próximo código disponible
const cargarProximoCodigo = async () => {
  if (form.value.year && form.value.mes) {
    try {
      const codigo = await ReporteService.getNextCodigo(form.value.year, form.value.mes)
      codigoPreview.value = codigo
    } catch (error) {
      console.error('Error al cargar código:', error)
      codigoPreview.value = 'Error al cargar'
    }
  }
}

// Definir el tipo para los días con búsqueda
interface DiaConBusqueda extends DiaTrabajo {
  busqueda: string
}

const today = new Date()
const currentYear = today.getFullYear().toString()
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const currentMonth = meses[today.getMonth()]
const currentDate = today.toISOString().split('T')[0]

const form = ref<ReporteRequest & { dias: DiaConBusqueda[], tipoReporteId?: string, tipoAnimalId?: string }>({
  tipoReporteId: '',
  tipoCultivoId: '',
  tipoAnimalId: undefined,
  codigo: '',
  bloque: '',
  campo: '',
  area: '',
  norma: '',
  fecha: currentDate,
  year: currentYear,
  mes: currentMonth,
  trabajadorResponsableId: undefined,
  dias: []
})

const cargarTiposReporte = async () => {
  try {
    tiposReporte.value = await TipoReporteService.getAll()
  } catch (error) {
    console.error('Error al cargar tipos de reporte:', error)
  }
}

const cargarTiposCultivo = async () => {
  try {
    tiposCultivo.value = await TipoCultivoService.getAll()
  } catch (error) {
    console.error('Error al cargar tipos de cultivo:', error)
  }
}

const cargarTiposAnimal = async () => {
  try {
    tiposAnimal.value = await TipoAnimalService.getAll()
  } catch (error) {
    console.error('Error al cargar tipos de animal:', error)
  }
}

const cargarTrabajadores = async () => {
  try {
    const response = await TrabajadorService.buscarTrabajadores({ size: 999 })
    trabajadores.value = response.data.data || []
  } catch (error) {
    console.error('Error al cargar trabajadores:', error)
  }
}

const cargarDiasDelReporte = async (reporteId: string) => {
  try {
    const response = await DiaTrabajoService.obtenerDiasPorReporte(reporteId)
    const items = response.data.items || []
    diasOriginales.value = items.map((dia: any) => ({
      id: dia.id,
      fecha: dia.fecha,
      trabajadores: dia.trabajadores || []
    }))
    console.log('📅 Días originales del reporte:', diasOriginales.value.length)
  } catch (error) {
    console.error('Error al cargar días del reporte:', error)
    diasOriginales.value = []
  }
}

const cargarDatos = async () => {
  if (props.reporte) {
    let reporteCompleto = props.reporte

    // Si estamos editando y el trabajadorResponsableId es null/undefined,
    // obtener los datos completos del backend
    if (isEditing.value && props.reporte.id && !props.reporte.trabajadorResponsableId) {
      try {
        const response = await ReporteService.obtenerReportePorId(props.reporte.id)
        reporteCompleto = response.data
      } catch (error) {
        console.error('Error al obtener datos completos del reporte:', error)
        // Continuar con los datos que tenemos
      }
    }

    form.value = {
      tipoReporteId: reporteCompleto.tipoReporteId || '',
      tipoCultivoId: reporteCompleto.tipoCultivoId || '',
      tipoAnimalId: reporteCompleto.tipoAnimalId || undefined,
      codigo: reporteCompleto.codigo || '',
      bloque: reporteCompleto.bloque || '',
      campo: reporteCompleto.campo || '',
      area: reporteCompleto.area || '',
      norma: reporteCompleto.norma || '',
      fecha: reporteCompleto.fecha || '',
      year: reporteCompleto.year || '',
      mes: reporteCompleto.mes || '',
      trabajadorResponsableId: reporteCompleto.trabajadorResponsableId || '',
      dias: []
    }

    if (isEditing.value && props.reporte.id) {
      await cargarDiasDelReporte(props.reporte.id)
    }
  }
}

const agregarDia = () => {
  form.value.dias.push({
    fecha: '',
    trabajadores: [],
    busqueda: ''
  })
}

const eliminarDia = (index: number) => {
  form.value.dias.splice(index, 1)
}

const agregarTrabajadorADia = (diaIndex: number) => {
  const dia = form.value.dias[diaIndex]
  if (!dia.trabajadores) {
    dia.trabajadores = []
  }
  dia.trabajadores.push({
    trabajadorId: '',
    horas: '',
    norma: ''
  })
}

const eliminarTrabajador = (diaIndex: number, trabajadorIndex: number) => {
  const dia = form.value.dias[diaIndex]
  if (dia.trabajadores) {
    dia.trabajadores.splice(trabajadorIndex, 1)
  }
}

// ==================== BUSCADOR POR DÍA ====================
const obtenerTrabajadoresFiltrados = (diaIndex: number) => {
  const dia = form.value.dias[diaIndex]
  if (!dia.trabajadores || dia.trabajadores.length === 0) {
    return []
  }
  
  const termino = (dia.busqueda || '').toLowerCase().trim()
  
  if (!termino) {
    return dia.trabajadores
  }
  
  return dia.trabajadores.filter(t => {
    // Buscar en la lista de trabajadores disponibles
    const trabajador = trabajadores.value.find(w => w.id === t.trabajadorId)
    if (!trabajador) return false
    
    const nombre = trabajador.nombre?.toLowerCase() || ''
    const ruc = trabajador.ruc?.toLowerCase() || ''
    const cuenta = trabajador.cuenta?.toLowerCase() || ''
    const cargo = trabajador.cargo?.toLowerCase() || ''
    
    return nombre.includes(termino) || 
           ruc.includes(termino) || 
           cuenta.includes(termino) ||
           cargo.includes(termino)
  })
}

const filtrarTrabajadoresPorDia = (diaIndex: number) => {
  // Solo forzar la reactividad
  const dia = form.value.dias[diaIndex]
  if (dia) {
    // El filtro se hace en obtenerTrabajadoresFiltrados
    // Este método solo existe para el evento @input
  }
}


const guardar = async () => {
  // Validaciones básicas del reporte
  if (!form.value.tipoReporteId) {
    alert('El tipo de reporte es obligatorio')
    return
  }

  // Validar según el tipo de subclasificación
  if (mostrarTipoCultivo.value && !form.value.tipoCultivoId) {
    alert('El tipo de cultivo es obligatorio para este tipo de reporte')
    return
  }

  if (mostrarTipoAnimal.value && !form.value.tipoAnimalId) {
    alert('El tipo de animal es obligatorio para este tipo de reporte')
    return
  }

  // Validar bloque/campo solo si el tipo de cultivo lo requiere
  if (requiereCampo.value) {
    if (!form.value.bloque.trim()) {
      alert('El bloque es obligatorio para este tipo de cultivo')
      return
    }
    if (!form.value.campo.trim()) {
      alert('El campo es obligatorio para este tipo de cultivo')
      return
    }
    if (!form.value.area.trim()) {
      alert('El área es obligatoria para este tipo de cultivo')
      return
    }
  }

  if (!form.value.norma.trim()) {
    alert('La norma es obligatoria')
    return
  }
  if (!form.value.year.trim()) {
    alert('El año es obligatorio')
    return
  }
  if (!form.value.mes) {
    alert('El mes es obligatorio')
    return
  }
  if (!form.value.trabajadorResponsableId || form.value.trabajadorResponsableId === '') {
    alert('El trabajador responsable es obligatorio')
    return
  }

  if (!isEditing.value) {
    for (let i = 0; i < form.value.dias.length; i++) {
      const dia = form.value.dias[i]
      if (!dia.fecha) {
        alert(`La fecha del día ${i + 1} es obligatoria`)
        return
      }
      if (dia.trabajadores) {
        for (let j = 0; j < dia.trabajadores.length; j++) {
          const trabajador = dia.trabajadores[j]
          if (!trabajador.trabajadorId) {
            alert(`Seleccione un trabajador para el día ${i + 1}`)
            return
          }
          if (!trabajador.horas.trim()) {
            alert(`Ingrese las horas para el trabajador ${j + 1} del día ${i + 1}`)
            return
          }
        }
      }
    }
  }

  isGuardando.value = true
  try {
    if (isEditing.value && props.reporte?.id) {
      await ReporteService.actualizarReporte(props.reporte.id, form.value)
      emit('updated')
    } else {
      const response = await ReporteService.crearReporte(form.value)
      const reporteId = response.data.id

      if (reporteId) {
        for (const dia of form.value.dias) {
          const diaResponse = await DiaTrabajoService.agregarDia(reporteId, {
            fecha: dia.fecha
          })
          const diaId = diaResponse.data.id

          if (dia.trabajadores) {
            for (const trabajador of dia.trabajadores) {
              await DiaTrabajoService.agregarTrabajadorADia(diaId, {
                trabajadorId: trabajador.trabajadorId,
                horas: trabajador.horas,
                norma: trabajador.norma || ''
              })
            }
          }
        }
      }
      
      emit('created')
    }
  } catch (error) {
    console.error('Error al guardar:', error)
    const err = error as AxiosError<{ message: string }>
    const message = err.response?.data?.message || 'Error al guardar el reporte'
    alert(message)
  } finally {
    isGuardando.value = false
  }
}

const cancelar = () => {
  emit('cancel')
}

watch(() => props.reporte, async () => {
  if (props.reporte) {
    await cargarDatos()
  }
}, { immediate: true })

// Recargar código cuando cambie el mes
watch(() => form.value.mes, () => {
  if (!isEditing.value) {
    cargarProximoCodigo()
  }
})

onMounted(async () => {
  await cargarTiposReporte()
  await cargarTiposCultivo()
  await cargarTiposAnimal()
  await cargarTrabajadores()
  await cargarDatos()
  // Cargar el próximo código si es creación
  if (!isEditing.value) {
    await cargarProximoCodigo()
  }
})
</script>

<style scoped>
.crear-reporte {
  padding: 10px;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
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
}

.form-group input,
.form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.input-disabled {
  background-color: #e9ecef;
  color: #495057;
  cursor: not-allowed;
}

.input-codigo {
  font-family: monospace;
  font-weight: 600;
  letter-spacing: 1px;
}

/* Días Section */
.dias-section {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 5px;
}

.dias-section::-webkit-scrollbar {
  width: 6px;
}

.dias-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.dias-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.dias-section::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-header h4 {
  margin: 0;
  color: #2c3e50;
}

.btn-agregar-dia {
  padding: 8px 16px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-agregar-dia:hover {
  background-color: #219a52;
}

.dia-card {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.dia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dia-header h5 {
  margin: 0;
  color: #2c3e50;
}

.dia-actions {
  display: flex;
  gap: 5px;
}

.btn-eliminar-dia {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0 5px;
}

.btn-eliminar-dia:hover {
  color: #c0392b;
}

.dia-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trabajadores-section {
  margin-top: 10px;
}

.trabajadores-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.trabajadores-header label {
  font-weight: 500;
  color: #555;
}

.btn-agregar-trabajador {
  padding: 4px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85em;
}

.btn-agregar-trabajador:hover {
  background-color: #2980b9;
}

/* Buscador */
.search-wrapper {
  margin-bottom: 10px;
}

.search-input {
  padding: 8px 12px;
  font-size: 0.9em;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.trabajador-row {
  margin-bottom: 8px;
}

.trabajador-fields {
  display: flex;
  gap: 10px;
  align-items: center;
}

.trabajador-fields .form-group {
  margin-bottom: 0;
  flex: 1;
}

.btn-eliminar-trabajador {
  background: none;
  border: none;
  color: #e74c3c;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0 5px;
}

.btn-eliminar-trabajador:hover {
  color: #c0392b;
}

.no-dias {
  text-align: center;
  padding: 20px;
  color: #888;
}

/* Mensaje de edición */
.edicion-mensaje {
  margin: 20px 0;
}

.info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 15px 20px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
}

.info-icon {
  font-size: 1.5em;
  flex-shrink: 0;
}

.info-box p {
  margin: 0;
  color: #1565c0;
  font-size: 0.95em;
  line-height: 1.5;
}

.info-box p strong {
  color: #0d47a1;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.btn-guardar {
  background-color: #27ae60;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #219a52;
}

.btn-guardar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-cancelar {
  background-color: #95a5a6;
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}

/* Hint text for tipo cultivo */
.hint {
  display: block;
  margin-top: 5px;
  font-size: 0.85em;
  color: #6c757d;
  font-style: italic;
}

.hint-auto {
  color: #27ae60;
  font-weight: 500;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .form-group-half {
    flex: none;
  }

  .trabajador-fields {
    flex-direction: column;
    align-items: stretch;
  }

  .trabajador-fields .form-group {
    width: 100%;
  }

  .btn-eliminar-trabajador {
    align-self: flex-end;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .trabajadores-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .info-box {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-guardar,
  .btn-cancelar {
    width: 100%;
  }
}
</style>