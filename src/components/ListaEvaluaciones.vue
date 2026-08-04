<template>
  <div v-if="props.grupoId" class="modal-overlay" @click="cerrar">
    <div class="modal evaluaciones-modal" @click.stop>
      <div class="evaluaciones-header">
        <h2>Evaluaciones Registradas</h2>
        <p class="grupo-info">Grupo: <strong>{{ props.grupoNombre }}</strong></p>
        <button @click="cerrar" class="btn-cerrar">✕</button>
      </div>

      <div class="evaluaciones-content">
        <div v-if="cargando" class="loading-spinner">
          <div class="spinner"></div>
          <p>Cargando evaluaciones...</p>
        </div>

        <div v-else-if="evaluaciones.length > 0" class="tabla-evaluaciones-contenedor">
          <table class="tabla-evaluaciones">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Mes</th>
                <th>Evaluaciones</th>
                <th>Firma Jefe</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="evaluacion in evaluaciones" :key="evaluacion.id">
                <td>{{ formatFecha(evaluacion.fecha) }}</td>
                <td>{{ evaluacion.mes }}</td>
                <td>
                  <div class="evaluaciones-count">
                    {{ evaluacion.trabajadores?.length || 0 }} trabajadores
                  </div>
                </td>
                <td>
                  <span v-if="evaluacion.firmaJefe" class="firma-jefe">{{ evaluacion.firmaJefe }}</span>
                  <span v-else class="sin-firma">-</span>
                </td>
                <td class="acciones">
                  <button @click="descargarPDF(evaluacion)" class="btn-pdf" title="Descargar PDF">📄</button>
                  <button @click="eliminarEvaluacion(evaluacion.id)" class="btn-eliminar" title="Eliminar">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="sin-evaluaciones">
          <p>No hay evaluaciones registradas para este grupo</p>
        </div>
      </div>

      <div class="modal-acciones">
        <button @click="cerrar" class="btn-cancelar">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import EvaluacionService from '@/services/EvaluacionService'
import EvaluacionPDFService from '@/services/EvaluacionPDFService'
import type { Evaluacion } from '@/types/Evaluacion'

interface Props {
  grupoId: string | null
  grupoNombre?: string
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const evaluaciones = ref<Evaluacion[]>([])
const cargando = ref(false)

const cargarEvaluaciones = async () => {
  if (!props.grupoId) return

  cargando.value = true
  try {
    // eslint-disable-next-line no-console
    console.log('Cargando evaluaciones para grupoId:', props.grupoId)
    const response = await EvaluacionService.getByGrupo(props.grupoId)
    // eslint-disable-next-line no-console
    console.log('Respuesta completa:', response)
    procesarRespuesta(response)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al cargar evaluaciones:', error)
    evaluaciones.value = []
  } finally {
    cargando.value = false
  }
}

const procesarRespuesta = (response: any) => {
  try {
    // eslint-disable-next-line no-console
    console.log('=== RESPUESTA DEL BACKEND ===')
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(response, null, 2))

    // response.data contiene el array directo de evaluaciones
    const evaluacionesArray = response?.data?.data as any[]

    // eslint-disable-next-line no-console
    console.log('Array de evaluaciones recibido:', evaluacionesArray)

    if (!evaluacionesArray || !Array.isArray(evaluacionesArray)) {
      // eslint-disable-next-line no-console
      console.log('No es un array o está vacío')
      evaluaciones.value = []
      return
    }

    // eslint-disable-next-line no-console
    console.log(`Total evaluaciones: ${evaluacionesArray.length}`)

    // Agrupar evaluaciones por lote (mes, year, jefeId)
    const gruposEval: Record<string, any[]> = {}

    for (const e of evaluacionesArray) {
      const clave = `${e?.mes || 'N/A'}-${e?.year || 'N/A'}-${e?.jefeId || 'N/A'}`
      if (!gruposEval[clave]) {
        gruposEval[clave] = []
      }
      gruposEval[clave].push(e)
    }

    // eslint-disable-next-line no-console
    console.log(`Grupos agrupados: ${Object.keys(gruposEval).length}`)

    const resultado = Object.values(gruposEval).map((items) => {
      const item0 = items[0] || {}
      return {
        id: item0.id || '',
        fecha: item0.fechaEvaluacion || '',
        mes: item0.mes || '',
        year: item0.year || 0,
        trabajadores: items,
        firmaJefe: item0.jefeId || '',
        grupoId: item0.grupoId || ''
      }
    })

    // eslint-disable-next-line no-console
    console.log('Resultado final:', resultado)
    evaluaciones.value = resultado
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error procesando:', error)
    evaluaciones.value = []
  }
}

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-ES')
}

const descargarPDF = (evaluacion: Evaluacion) => {
  try {
    EvaluacionPDFService.generatePDF(evaluacion)
  } catch (error) {
    console.error('Error al generar PDF:', error)
    alert('Error al generar el PDF')
  }
}

const eliminarEvaluacion = async (id: string) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta evaluación?')) return

  try {
    await EvaluacionService.delete(id)
    await cargarEvaluaciones()
  } catch (error) {
    console.error('Error al eliminar evaluación:', error)
    alert('Error al eliminar la evaluación')
  }
}

const cerrar = () => {
  emit('close')
}

onMounted(() => {
  cargarEvaluaciones()
})
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
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.evaluaciones-modal {
  display: flex;
  flex-direction: column;
}

.evaluaciones-header {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  padding: 20px;
  border-radius: 8px 8px 0 0;
  position: relative;
}

.evaluaciones-header h2 {
  margin: 0 0 10px 0;
  font-size: 1.5em;
}

.grupo-info {
  margin: 0;
  font-size: 0.95em;
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
}

.evaluaciones-content {
  padding: 25px;
  flex: 1;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #ecf0f1;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tabla-evaluaciones-contenedor {
  overflow-x: auto;
  border: 1px solid #ecf0f1;
  border-radius: 6px;
}

.tabla-evaluaciones {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.tabla-evaluaciones thead {
  background-color: #34495e;
  color: white;
}

.tabla-evaluaciones th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.tabla-evaluaciones td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla-evaluaciones tbody tr:hover {
  background-color: #f8f9fa;
}

.evaluaciones-count {
  color: #2c3e50;
  font-weight: 500;
}

.firma-jefe {
  font-weight: 600;
  color: #2c3e50;
}

.sin-firma {
  color: #95a5a6;
}

.acciones {
  display: flex;
  gap: 8px;
}

.btn-pdf,
.btn-eliminar {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1em;
  padding: 5px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-pdf:hover {
  background-color: #e8f4f8;
}

.btn-eliminar:hover {
  background-color: #ffe8e8;
}

.sin-evaluaciones {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 6px;
  color: #7f8c8d;
}

.modal-acciones {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px 25px;
  border-top: 1px solid #ecf0f1;
}

.btn-cancelar {
  padding: 10px 20px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancelar:hover {
  background-color: #7f8c8d;
}
</style>
