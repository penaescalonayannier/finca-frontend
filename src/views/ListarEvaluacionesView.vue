<template>
  <div class="contenedor-evaluaciones">
    <!-- Header -->
    <div class="header">
      <div>
        <h1>Evaluaciones del Grupo</h1>
        <p class="subtitulo">{{ grupoNombre }}</p>
      </div>
      <button @click="irAtras" class="btn-volver">← Volver</button>
    </div>

    <!-- Loading -->
    <div v-if="cargando" class="loading">
      <div class="spinner"></div>
      <p>Cargando evaluaciones...</p>
    </div>

    <!-- Tabla de evaluaciones -->
    <div v-else-if="evaluaciones.length > 0" class="tabla-contenedor">
      <table class="tabla">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Mes</th>
            <th>Año</th>
            <th>Trabajadores</th>
            <th>Calificación Promedio</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="evaluacion in evaluaciones" :key="evaluacion.id">
            <td>{{ formatFecha(evaluacion.fecha) }}</td>
            <td>{{ evaluacion.mes }}</td>
            <td>{{ evaluacion.year }}</td>
            <td class="cantidad-trabajadores">{{ evaluacion.trabajadores?.length || 0 }}</td>
            <td class="calificacion-promedio">{{ calcularPromedio(evaluacion.trabajadores) }}</td>
            <td><span :class="['estado', `estado-${(evaluacion.estado || 'BORRADOR').toLowerCase()}`]">{{ etiquetaEstado(evaluacion.estado) }}</span></td>
            <td class="acciones">
              <button @click="abrirModalEvaluaciones(evaluacion)" class="btn-ver" title="Ver trabajadores">👁️</button>
              <button @click="descargarPDF(evaluacion)" class="btn-pdf" title="Descargar PDF">📄</button>
              <button v-if="evaluacion.estado === 'BORRADOR'" @click="cambiarEstadoLote(evaluacion, 'ENVIADA')" class="btn-enviar" title="Enviar a revisión">Enviar</button>
              <button v-if="evaluacion.estado === 'ENVIADA'" @click="cambiarEstadoLote(evaluacion, 'CERRADA')" class="btn-cerrar-ciclo" title="Cerrar e inmovilizar">Cerrar</button>
              <button v-if="evaluacion.estado !== 'CERRADA'" @click="eliminarEvaluacion(evaluacion)" class="btn-eliminar" title="Eliminar">🗑️</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin datos -->
    <div v-else class="sin-datos">
      <p>No hay evaluaciones registradas para este grupo</p>
    </div>

    <!-- Modal de visualización de evaluaciones -->
    <VisualizarEvaluacionesModal
      ref="modalEvaluaciones"
      :evaluacion="evaluacionSeleccionada"
      @close="cerrarModalEvaluaciones"
    />

    <!-- Toast de notificaciones -->
    <NotificationToast ref="toast" />

    <!-- Modal de confirmación -->
    <ConfirmDialog ref="confirmDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import EvaluacionService from '@/services/EvaluacionService'
import EvaluacionPDFService from '@/services/EvaluacionPDFService'
import VisualizarEvaluacionesModal from '@/components/VisualizarEvaluacionesModal.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Evaluacion } from '@/types/Evaluacion'

const router = useRouter()
const route = useRoute()

const grupoId = route.params.grupoId as string
const grupoNombre = route.params.grupoNombre as string

const evaluaciones = ref<Evaluacion[]>([])
const cargando = ref(false)
const modalEvaluaciones = ref<InstanceType<typeof VisualizarEvaluacionesModal>>()
const evaluacionSeleccionada = ref<Evaluacion | undefined>()
const toast = ref<InstanceType<typeof NotificationToast>>()
const confirmDialog = ref<InstanceType<typeof ConfirmDialog>>()

const cargarEvaluaciones = async () => {
  cargando.value = true
  try {
    const response = await EvaluacionService.getByGrupo(grupoId)

    const evaluacionesArray = response?.data?.data as any[]
    const grupoNombreBackend = response?.data?.grupoNombre
    const jefeNombreBackend = response?.data?.jefeNombre

    if (!evaluacionesArray || !Array.isArray(evaluacionesArray)) {
      evaluaciones.value = []
      return
    }

    // Agrupar evaluaciones por lote (mes + year + jefeId + fecha)
    const gruposEval: Record<string, any[]> = {}

    for (const e of evaluacionesArray) {
      // Usar mes-year-jefeId-fecha como clave para agrupar evaluaciones del mismo lote
      const clave = `${e?.mes || 'N/A'}|${e?.year || 'N/A'}|${e?.jefeId || 'N/A'}|${e?.fechaEvaluacion?.split('T')[0] || 'N/A'}`
      if (!gruposEval[clave]) {
        gruposEval[clave] = []
      }
      gruposEval[clave].push(e)
    }

    const resultado = Object.values(gruposEval).map((items) => {
      const item0 = items[0] || {}

      // Transformar trabajadores para que tengan los campos esperados por el PDF
      const trabajadoresTransformados = items.map((evaluation: any) => ({
        id: evaluation.id,
        trabajadorId: evaluation.trabajadorId,
        trabajadorNombre: evaluation.trabajadorNombre || 'Sin nombre',
        calificacion: evaluation.calificacion,
        evaluacion: !evaluation.calificacion ? '' : evaluation.calificacion <= 2 ? 'deficiente' : evaluation.calificacion === 3 ? 'acuado' : 'superior',
        firma: evaluation.firma || '',
        constanciaTrabajador: evaluation.constanciaTrabajador || evaluation.firma || '',
        constanciaJefe: evaluation.constanciaJefe || '',
        comentarios: evaluation.comentarios || ''
      }))

      return {
        id: item0.id || '',
        ids: items.map((e: any) => e.id), // Array de todos los IDs del lote
        fecha: item0.fechaEvaluacion || '',
        mes: item0.mes || '',
        year: item0.year || 0,
        trabajadores: trabajadoresTransformados,
        firmaJefe: '', // Dejar en blanco para que se muestre la línea para firmar
        estado: item0.estado || 'BORRADOR',
        constanciaJefe: item0.constanciaJefe || '',
        fechaCierre: item0.fechaCierre,
        grupoId: item0.grupoId || '',
        grupoNombre: grupoNombreBackend || grupoNombre || 'Grupo',
        jefeNombre: jefeNombreBackend || 'Sin asignar'
      }
    })

    evaluaciones.value = resultado
  } catch (error) {
    evaluaciones.value = []
    toast.value?.error('Error al cargar', 'No pudimos cargar las evaluaciones. Por favor, intenta nuevamente.')
  } finally {
    cargando.value = false
  }
}

const formatFecha = (fecha: string) => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-ES')
}

const calcularPromedio = (trabajadores: any[] | undefined) => {
  if (!trabajadores || trabajadores.length === 0) return '-'
  const suma = trabajadores.reduce((acc, t) => acc + (t.calificacion || 0), 0)
  return (suma / trabajadores.length).toFixed(1)
}

const descargarPDF = (evaluacion: Evaluacion) => {
  try {
    EvaluacionPDFService.generatePDF(evaluacion)
    toast.value?.success('PDF descargado', `Evaluación de ${evaluacion.mes} ${evaluacion.year} descargada correctamente`)
  } catch (error) {
    toast.value?.error('Error al generar PDF', 'No pudimos generar el PDF. Por favor, intenta nuevamente.')
  }
}

const etiquetaEstado = (estado?: string) => ({
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', CERRADA: 'Cerrada', ANULADA: 'Anulada'
}[estado || 'BORRADOR'] || estado || 'Borrador')

const cambiarEstadoLote = async (evaluacion: any, estado: 'ENVIADA' | 'CERRADA') => {
  const descripcion = estado === 'CERRADA'
    ? 'Al cerrar, los registros del lote quedarán inmutables. ¿Desea continuar?'
    : '¿Enviar este lote de evaluación a revisión?'
  const confirmar = await confirmDialog.value?.mostrarConfirmacion('Ciclo de evaluación', descripcion,
    { tipo: estado === 'CERRADA' ? 'warning' : 'info', textoConfirmar: 'Confirmar', textoCancelar: 'Cancelar' })
  if (!confirmar) return
  try {
    for (const trabajador of evaluacion.trabajadores || []) {
      await EvaluacionService.cambiarEstado(trabajador.id, {
        estado,
        constanciaJefe: trabajador.constanciaJefe || evaluacion.constanciaJefe,
        constanciaTrabajador: trabajador.constanciaTrabajador || trabajador.firma || ''
      })
    }
    await cargarEvaluaciones()
    toast.value?.success('Ciclo actualizado', `Lote marcado como ${etiquetaEstado(estado).toLowerCase()}.`)
  } catch (error: any) {
    toast.value?.error('No se pudo actualizar', error?.response?.data?.message || 'Revise las constancias textuales requeridas para cerrar.')
  }
}

const eliminarEvaluacion = async (evaluacion: any) => {
  const confirmResult = await confirmDialog.value?.mostrarConfirmacion(
    'Eliminar Evaluación',
    `¿Estás seguro de que deseas eliminar esta evaluación?`,
    {
      tipo: 'danger',
      detalles: `Período: ${evaluacion.mes} ${evaluacion.year} • Registros: ${evaluacion.trabajadores?.length || 0} trabajadores`,
      textoConfirmar: 'Sí, eliminar',
      textoCancelar: 'Cancelar'
    }
  )

  if (!confirmResult) return

  try {
    // Eliminar todas las evaluaciones del lote
    const ids = evaluacion.ids || [evaluacion.id]
    for (const id of ids) {
      await EvaluacionService.delete(id)
    }
    await cargarEvaluaciones()
    toast.value?.success('Eliminado correctamente', `Evaluación de ${evaluacion.mes} ${evaluacion.year} y sus ${ids.length} registros han sido eliminados`)
  } catch (error) {
    toast.value?.error('Error al eliminar', 'No pudimos eliminar la evaluación. Por favor, intenta nuevamente.')
  }
}

const abrirModalEvaluaciones = (evaluacion: Evaluacion) => {
  evaluacionSeleccionada.value = evaluacion
  modalEvaluaciones.value?.abrirModal(evaluacion)
}

const cerrarModalEvaluaciones = () => {
  evaluacionSeleccionada.value = undefined
}

const irAtras = () => {
  router.back()
}

onMounted(() => {
  cargarEvaluaciones()
})
</script>

<style scoped>
.contenedor-evaluaciones {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.8em;
}

.subtitulo {
  margin: 5px 0 0 0;
  color: #7f8c8d;
  font-size: 0.95em;
}

.btn-volver {
  padding: 10px 20px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-volver:hover {
  background-color: #7f8c8d;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tabla-contenedor {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
}

.tabla thead {
  background-color: #34495e;
  color: white;
}

.tabla th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
}

.tabla td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla tbody tr:hover {
  background-color: #f8f9fa;
}

.cantidad-trabajadores {
  font-weight: 500;
  color: #2c3e50;
}

.calificacion-promedio {
  font-weight: 600;
  color: #27ae60;
}

.acciones {
  display: flex;
  gap: 10px;
}

.btn-pdf,
.btn-eliminar,
.btn-ver,
.btn-enviar,
.btn-cerrar-ciclo {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-enviar { background: #e8f4ff; color: #1d5f91; font-size: .82em; }
.btn-cerrar-ciclo { background: #e9f7ef; color: #1e8449; font-size: .82em; }
.estado { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: .8em; font-weight: 600; }
.estado-borrador { background: #eef1f4; color: #59636d; }
.estado-enviada { background: #e8f4ff; color: #1d5f91; }
.estado-cerrada { background: #e9f7ef; color: #1e8449; }
.estado-anulada { background: #fdecea; color: #a93226; }

.btn-ver:hover {
  background-color: #e3f2fd;
}

.btn-pdf:hover {
  background-color: #e8f4f8;
}

.btn-eliminar:hover {
  background-color: #ffe8e8;
}

.sin-datos {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  color: #7f8c8d;
  font-size: 1.1em;
}
</style>
