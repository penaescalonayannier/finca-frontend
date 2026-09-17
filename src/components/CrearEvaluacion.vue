<!-- src/components/CrearEvaluacion.vue -->
<template>
  <div v-if="props.grupo" class="modal-overlay" @click="cerrar">
    <div class="modal evaluacion-modal" @click.stop>
      <div class="evaluacion-header">
        <h2>Evaluación de Desempeño Mensual</h2>
        <p class="grupo-info">Grupo: <strong>{{ props.grupo.nombre }}</strong></p>
        <button @click="cerrar" class="btn-cerrar">✕</button>
      </div>

      <div class="evaluacion-content">
        <!-- Campos de fecha -->
        <div class="fecha-section">
          <div class="form-group">
            <label>Fecha:</label>
            <input v-model="evaluacion.fecha" type="date" class="input-fecha">
          </div>
          <div class="form-group">
            <label>Mes:</label>
            <input v-model="evaluacion.mes" type="text" placeholder="Ej: Enero, Febrero" class="input-mes">
          </div>
          <div class="form-group">
            <label>Constancia textual del jefe:</label>
            <input v-model="evaluacion.firmaJefe" type="text" placeholder="Nombre, firma o iniciales" class="input-firma-jefe">
          </div>
        </div>

        <div class="ciclo-section">
          <p><strong>Criterios vigentes:</strong>
            <span v-if="criterios.length"> {{ criterios.map(c => c.nombre).join(' · ') }}</span>
            <span v-else> No hay criterios configurados.</span>
          </p>
          <label for="evidencia">Evidencia / fundamentación del período</label>
          <textarea id="evidencia" v-model="evaluacion.evidencia" rows="3"
            placeholder="Hechos, resultados y evidencia que sustentan la evaluación"></textarea>
          <details class="gestionar-criterios">
            <summary>Gestionar criterios de evaluación</summary>
            <div class="nuevo-criterio">
              <input v-model="nuevoCriterio.nombre" placeholder="Nuevo criterio">
              <input v-model="nuevoCriterio.descripcion" placeholder="Descripción breve">
              <button type="button" @click="agregarCriterio">Agregar</button>
            </div>
            <ul v-if="criterios.length">
              <li v-for="criterio in criterios" :key="criterio.id">
                {{ criterio.nombre }}
                <button v-if="criterio.id" type="button" @click="desactivarCriterio(criterio.id)">Desactivar</button>
              </li>
            </ul>
          </details>
        </div>

        <!-- Tabla de evaluación -->
        <div class="tabla-evaluacion-contenedor">
          <table class="tabla-evaluacion">
            <thead>
              <tr>
                <th>No</th>
                <th>Nombre y Apellidos</th>
                <th colspan="3" class="evaluacion-header-group">Evaluación</th>
                <th>Observaciones</th>
                <th>Firma</th>
              </tr>
              <tr class="subheader">
                <th></th>
                <th></th>
                <th class="evaluacion-col">Superior</th>
                <th class="evaluacion-col">Acuado</th>
                <th class="evaluacion-col">Deficiente</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(trabajador, index) in props.grupo.trabajadores" :key="trabajador.id">
                <td class="numero">{{ index + 1 }}</td>
                <td class="nombre">{{ trabajador.nombre }}</td>
                <td class="evaluacion-col">
                  <input
                    type="radio"
                    :name="`eval-${trabajador.id}`"
                    value="superior"
                    v-model="evaluaciones[trabajador.id]"
                    class="radio-eval"
                  >
                </td>
                <td class="evaluacion-col">
                  <input
                    type="radio"
                    :name="`eval-${trabajador.id}`"
                    value="acuado"
                    v-model="evaluaciones[trabajador.id]"
                    class="radio-eval"
                  >
                </td>
                <td class="evaluacion-col">
                  <input
                    type="radio"
                    :name="`eval-${trabajador.id}`"
                    value="deficiente"
                    v-model="evaluaciones[trabajador.id]"
                    class="radio-eval"
                  >
                </td>
                <td class="observaciones">
                  <input
                    type="text"
                    v-model="observaciones[trabajador.id]"
                    placeholder="Observaciones..."
                    class="input-observaciones"
                  >
                </td>
                <td class="firma">
                  <input
                    type="text"
                    v-model="firmas[trabajador.id]"
                    placeholder="Constancia"
                    class="input-firma"
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Jefe del área -->
        <div class="jefe-firma-section">
          <div class="jefe-info">
            <p><strong>Jefe de Área:</strong> {{ props.grupo.jefe?.nombre || 'Sin asignar' }}</p>
          </div>
        </div>
      </div>

      <div class="modal-acciones">
        <button @click="descargarPDFPreview" class="btn-pdf-preview" :disabled="cargando">📄 Descargar PDF</button>
        <button @click="guardarEvaluacion" class="btn-guardar" :disabled="cargando">
          {{ cargando ? '⏳ Guardando...' : '💾 Guardar Evaluación' }}
        </button>
        <button @click="cerrar" class="btn-cancelar" :disabled="cargando">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- Toast de notificaciones -->
  <NotificationToast ref="toast" />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import EvaluacionPDFService from '@/services/EvaluacionPDFService'
import EvaluacionService from '@/services/EvaluacionService'
import NotificationToast from '@/components/NotificationToast.vue'
import type { Grupo } from '@/types/Grupo'
import type { CriterioEvaluacion, Evaluacion, CreateBatchEvaluacionRequest, CreateBatchEvaluacionItem } from '@/types/Evaluacion'

interface Props {
  grupo: Grupo | null
}

interface Emit {
  (e: 'close'): void
  (e: 'save'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const evaluacion = ref({
  fecha: new Date().toISOString().split('T')[0],
  mes: '',
  firmaJefe: '',
  evidencia: ''
})

const evaluaciones = ref<Record<string, string>>({})
const observaciones = ref<Record<string, string>>({})
const firmas = ref<Record<string, string>>({})
const cargando = ref(false)
const toast = ref<InstanceType<typeof NotificationToast>>()
const criterios = ref<CriterioEvaluacion[]>([])
const nuevoCriterio = ref({ nombre: '', descripcion: '' })

const cargarCriterios = async () => {
  try {
    criterios.value = (await EvaluacionService.getCriterios()).data
  } catch {
    criterios.value = []
  }
}

const agregarCriterio = async () => {
  if (!nuevoCriterio.value.nombre.trim()) {
    toast.value?.warning('Falta el criterio', 'Indique el nombre del criterio antes de agregarlo.')
    return
  }
  try {
    await EvaluacionService.guardarCriterio({ ...nuevoCriterio.value, activo: true, orden: criterios.value.length + 1 })
    nuevoCriterio.value = { nombre: '', descripcion: '' }
    await cargarCriterios()
  } catch {
    toast.value?.error('No se pudo guardar', 'No pudimos guardar el criterio de evaluación.')
  }
}

const desactivarCriterio = async (id: string) => {
  try {
    await EvaluacionService.desactivarCriterio(id)
    await cargarCriterios()
  } catch {
    toast.value?.error('No se pudo desactivar', 'El criterio no pudo ser desactivado.')
  }
}

const cerrar = () => {
  emit('close')
}

// Convertir evaluación de texto a número
const convertirEvaluacionANumero = (evaluacion: string): number => {
  switch (evaluacion) {
    case 'superior':
      return 5
    case 'acuado':
      return 3
    case 'deficiente':
      return 1
    default:
      return 0  // Retorna 0 para indicar que no fue evaluado
  }
}

const descargarPDFPreview = () => {
  if (!props.grupo) return

  // Validar que se hayan completado las evaluaciones
  const trabajadoresEvaluados = Object.values(evaluaciones.value).filter(e => e).length

  if (trabajadoresEvaluados === 0) {
    toast.value?.warning('Sin evaluaciones', 'Debes evaluar al menos un trabajador antes de generar el PDF')
    return
  }

  if (!evaluacion.value.mes || evaluacion.value.mes.trim() === '') {
    toast.value?.warning('Falta el mes', 'Por favor, ingresa el mes de la evaluación')
    return
  }

  // Crear objeto Evaluación temporal
  const evaluacionTmp: Evaluacion = {
    id: `preview-${Date.now()}`,
    grupoId: props.grupo.id,
    grupoNombre: props.grupo.nombre,
    fecha: evaluacion.value.fecha,
    mes: evaluacion.value.mes,
    trabajadores: props.grupo.trabajadores?.map(trab => ({
      trabajadorId: trab.id,
      trabajadorNombre: trab.nombre,
      evaluacion: evaluaciones.value[trab.id] || '',
        firma: firmas.value[trab.id],
        constanciaTrabajador: firmas.value[trab.id],
      comentarios: observaciones.value[trab.id] || ''
    })) || [],
    firmaJefe: evaluacion.value.firmaJefe,
    jefeNombre: props.grupo.jefe?.nombre
  }

  try {
    EvaluacionPDFService.generatePDF(evaluacionTmp)
    toast.value?.success('PDF generado', `Vista previa de la evaluación de ${evaluacion.value.mes} ${new Date(evaluacion.value.fecha).getFullYear()}`)
  } catch (error) {
    toast.value?.error('Error al generar PDF', 'No pudimos generar el archivo PDF. Por favor, intenta nuevamente.')
  }
}

const guardarEvaluacion = async () => {
  if (!props.grupo) return

  // Validar que se hayan completado las evaluaciones
  const trabajadoresEvaluados = Object.values(evaluaciones.value).filter(e => e).length

  if (trabajadoresEvaluados === 0) {
    toast.value?.warning('Sin evaluaciones', 'Debes evaluar al menos un trabajador antes de guardar')
    return
  }

  // Validar que se haya ingresado el mes
  if (!evaluacion.value.mes || evaluacion.value.mes.trim() === '') {
    toast.value?.warning('Falta el mes', 'Por favor, ingresa el mes de la evaluación')
    return
  }

  try {
    cargando.value = true

    // Extraer año de la fecha
    const fecha = new Date(evaluacion.value.fecha)
    const year = fecha.getFullYear()

    // Construir array de evaluaciones individuales
    const itemsEvaluacion: CreateBatchEvaluacionItem[] = props.grupo.trabajadores
      ?.filter(trab => evaluaciones.value[trab.id]) // Solo los evaluados
      .map(trab => ({
        trabajadorId: trab.id,
        calificacion: convertirEvaluacionANumero(evaluaciones.value[trab.id]),
        comentarios: observaciones.value[trab.id] || '',
        constanciaTrabajador: firmas.value[trab.id] || ''
      }))
      .filter(item => item.calificacion > 0) // No guardar trabajadores sin evaluación (calificación 0)
      || []

    // Crear request batch
    const request: CreateBatchEvaluacionRequest = {
      mes: evaluacion.value.mes,
      year: year,
      grupoId: props.grupo.id,
      jefeId: props.grupo.jefe?.id || '',
      evaluaciones: itemsEvaluacion,
      evidencia: evaluacion.value.evidencia || '',
      criteriosAplicados: JSON.stringify(criterios.value.map(c => ({ id: c.id, nombre: c.nombre, descripcion: c.descripcion }))),
      constanciaJefe: evaluacion.value.firmaJefe || ''
    }

    // Hacer petición al backend
    const response = await EvaluacionService.createBatch(request)

    toast.value?.success('¡Guardado exitosamente!', `${itemsEvaluacion.length} evaluaciones de ${evaluacion.value.mes} han sido registradas`)
    emit('save')
    cerrar()
  } catch (error: unknown) {
    const errorMsg = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Hubo un problema al guardar. Por favor, intenta nuevamente.'
    toast.value?.error('Error al guardar', errorMsg)
  } finally {
    cargando.value = false
  }
}

onMounted(cargarCriterios)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.evaluacion-modal {
  display: flex;
  flex-direction: column;
}

.evaluacion-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.evaluacion-header h2 {
  margin: 0 0 10px 0;
  font-size: 1.5em;
}

.grupo-info {
  margin: 0;
  font-size: 0.95em;
  opacity: 0.95;
}

.btn-cerrar {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.3s;
}

.btn-cerrar:hover {
  background: rgba(255, 255, 255, 0.3);
}

.evaluacion-content {
  padding: 25px;
}

.fecha-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
}

.ciclo-section {
  margin: 0 0 20px;
  padding: 14px;
  border-left: 4px solid #667eea;
  background: #f8f9fa;
}

.ciclo-section p { margin: 0 0 10px; color: #2c3e50; }
.ciclo-section label { display: block; font-weight: 600; margin-bottom: 6px; }
.ciclo-section textarea { width: 100%; box-sizing: border-box; padding: 9px; border: 1px solid #bdc3c7; border-radius: 4px; resize: vertical; }
.gestionar-criterios { margin-top: 12px; }
.gestionar-criterios summary { cursor: pointer; font-weight: 600; }
.gestionar-criterios ul { padding-left: 20px; margin: 8px 0; }
.gestionar-criterios button { margin-left: 8px; padding: 3px 7px; border: 1px solid #bdc3c7; border-radius: 3px; background: white; cursor: pointer; }
.nuevo-criterio { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; margin: 10px 0; }
.nuevo-criterio input { min-width: 0; padding: 7px; border: 1px solid #bdc3c7; border-radius: 3px; }

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95em;
}

.input-fecha,
.input-mes,
.input-firma,
.input-firma-jefe {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 0.9em;
}

.input-fecha:focus,
.input-mes:focus,
.input-firma:focus,
.input-firma-jefe:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.tabla-evaluacion-contenedor {
  margin-bottom: 30px;
  overflow-x: auto;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
}

.tabla-evaluacion {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.tabla-evaluacion thead {
  background-color: #34495e;
  color: white;
  font-weight: 600;
}

.tabla-evaluacion th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9em;
  border-bottom: 2px solid #34495e;
}

.tabla-evaluacion .subheader {
  background-color: #ecf0f1;
  color: #2c3e50;
  font-weight: 500;
}

.tabla-evaluacion .subheader th {
  padding: 10px;
  border-bottom: 1px solid #bdc3c7;
}

.tabla-evaluacion td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
  text-align: center;
}

.tabla-evaluacion tbody tr:hover {
  background-color: #f8f9fa;
}

.numero {
  font-weight: 600;
  color: #7f8c8d;
  width: 40px;
  text-align: center;
}

.nombre {
  text-align: left;
  font-weight: 500;
  color: #2c3e50;
  min-width: 200px;
}

.evaluacion-col {
  width: 80px;
}

.radio-eval {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.firma {
  min-width: 120px;
}

.input-firma {
  width: 100%;
  max-width: 100px;
  padding: 6px;
  border: 1px solid #bdc3c7;
  border-radius: 3px;
  font-size: 0.85em;
}

.observaciones {
  min-width: 200px;
}

.input-observaciones {
  width: 100%;
  max-width: 200px;
  padding: 6px;
  border: 1px solid #bdc3c7;
  border-radius: 3px;
  font-size: 0.85em;
}

.input-observaciones:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.evaluacion-header-group {
  text-align: center;
  border-bottom: 2px solid #34495e;
}

.jefe-firma-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.jefe-info {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.jefe-info p {
  margin: 0;
  color: #2c3e50;
}

.jefe-info strong {
  color: #667eea;
}

.input-firma-jefe {
  width: 100%;
  max-width: 300px;
}

.modal-acciones {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px 25px;
  border-top: 1px solid #ecf0f1;
}

.btn-pdf-preview {
  padding: 12px 24px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: background-color 0.3s;
}

.btn-pdf-preview:hover {
  background-color: #2980b9;
}

.btn-guardar {
  padding: 12px 24px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: background-color 0.3s;
}

.btn-guardar:hover {
  background-color: #229954;
}

.btn-cancelar {
  padding: 12px 24px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95em;
  transition: background-color 0.3s;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}

.btn-pdf-preview:disabled,
.btn-guardar:disabled,
.btn-cancelar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
