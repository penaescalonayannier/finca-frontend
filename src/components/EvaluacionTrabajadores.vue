<!-- src/components/EvaluacionTrabajadores.vue -->
<template>
  <div class="evaluacion-trabajadores">
    <h2>📋 Evaluación de Trabajadores</h2>

    <!-- Filtros -->
    <div class="filtros">
      <div class="filtro-grupo">
        <label for="year">Año</label>
        <select id="year" v-model="yearSeleccionado" class="filtro-select">
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>

      <div class="filtro-grupo">
        <label for="mes">Mes</label>
        <select id="mes" v-model="mesSeleccionado" class="filtro-select">
          <option v-for="mes in meses" :key="mes" :value="mes">
            {{ mes }}
          </option>
        </select>
      </div>

      <button @click="cargarConsolidado" class="btn-cargar" :disabled="isLoading">
        {{ isLoading ? 'Cargando...' : '🔄 Cargar Consolidado' }}
      </button>

      <button
        @click="exportarPdf"
        class="btn-exportar"
        :disabled="gruposEvaluaciones.length === 0 || isExportando"
      >
        {{ isExportando ? 'Generando PDF...' : '📄 Exportar PDF' }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Cargando consolidado y grupos...</p>
    </div>

    <!-- Contenido -->
    <div v-else-if="gruposEvaluaciones.length > 0" class="contenido">
      <div v-for="grupo in gruposEvaluaciones" :key="grupo.grupoId" class="grupo-card">
        <div class="grupo-header">
          <h3>👥 {{ grupo.nombreGrupo }}</h3>
          <span class="jefe-badge">Jefe: {{ grupo.nombreJefe }}</span>
          <span class="trabajadores-badge">{{ grupo.trabajadores.length }} trabajador(es)</span>
        </div>

        <div class="trabajadores-list">
          <div v-for="trab in grupo.trabajadores" :key="trab.id" class="trabajador-card">
            <div class="trabajador-info">
              <div class="info-principal">
                <strong>{{ trab.nombre }}</strong>
                <span class="subtext">RUC: {{ trab.ruc }}</span>
                <span class="subtext">Cargo: {{ trab.cargo || 'Sin cargo' }}</span>
                <span class="subtext">Horas: {{ trab.totalHoras }}</span>
              </div>
            </div>

            <div class="formulario-evaluacion">
              <div class="input-group">
                <label for="calificacion">Calificación (1-5)</label>
                <div class="calificacion-selector">
                  <button
                    v-for="cal in [1, 2, 3, 4, 5]"
                    :key="cal"
                    @click="trab.evaluacion = { ...trab.evaluacion, calificacion: cal } as any"
                    :class="['cal-btn', { active: trab.evaluacion?.calificacion === cal }]"
                  >
                    {{ cal }}
                  </button>
                </div>
              </div>

              <div class="input-group">
                <label for="comentarios">Comentarios</label>
                <textarea
                  :value="trab.evaluacion?.comentarios || ''"
                  @input="(e: Event) => {
                    const target = e.target as HTMLTextAreaElement
                    if (trab.evaluacion) {
                      trab.evaluacion.comentarios = target.value
                    }
                  }"
                  placeholder="Ingrese observaciones y recomendaciones..."
                  rows="3"
                  maxlength="500"
                  class="textarea-evaluacion"
                ></textarea>
                <small>{{ (trab.evaluacion?.comentarios || '').length }}/500</small>
              </div>
            </div>
          </div>
        </div>

        <div class="grupo-acciones">
          <button @click="guardarGrupo(grupo)" class="btn-guardar-grupo" :disabled="!grupoTieneDatos(grupo)">
            ✓ Guardar Evaluaciones
          </button>
        </div>
      </div>
    </div>

    <!-- Sin datos -->
    <div v-else class="sin-datos">
      <span class="empty-icon">📋</span>
      <p>Seleccione un mes y año para cargar el consolidado de trabajadores</p>
    </div>

    <!-- Mensaje de éxito -->
    <transition name="fade">
      <div v-if="mensaje.texto" :class="['mensaje', mensaje.tipo]">
        {{ mensaje.texto }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ReporteConsolidadoService from '@/services/ReporteConsolidadoService'
import GrupoService from '@/services/GrupoService'
import EvaluacionService from '@/services/EvaluacionService'
import type { ReporteConsolidado } from '@/types/ReporteConsolidado'
import type { Grupo } from '@/types/Grupo'
import type { GrupoEvaluaciones, TrabajadorEvaluacion } from '@/types/Evaluacion'

// Estado
const isLoading = ref(false)
const isExportando = ref(false)
const yearSeleccionado = ref(new Date().getFullYear().toString())
const mesSeleccionado = ref('')
const gruposEvaluaciones = ref<GrupoEvaluaciones[]>([])
const mensaje = ref({ texto: '', tipo: 'exito' })

// Meses
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Años (5 atrás, 1 adelante)
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearsList = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    yearsList.push(i.toString())
  }
  return yearsList
})

const cargarConsolidado = async () => {
  if (!yearSeleccionado.value || !mesSeleccionado.value) {
    mensaje.value = { texto: 'Seleccione un año y un mes', tipo: 'error' }
    return
  }

  isLoading.value = true
  gruposEvaluaciones.value = []

  try {
    // Obtener consolidado
    const consolidadoResponse = await ReporteConsolidadoService.obtenerReporteConsolidado(
      yearSeleccionado.value,
      mesSeleccionado.value
    )
    const consolidado: ReporteConsolidado = consolidadoResponse.data

    // Obtener grupos y trabajadores
    const gruposResponse = await GrupoService.getAll()
    const grupos: Grupo[] = gruposResponse.data.content || []

    // Mapear consolidado a estructura de evaluación
    const trabajadoresMap = new Map<string, TrabajadorEvaluacion>()

    for (const trabajador of consolidado.trabajadores) {
      trabajadoresMap.set(trabajador.trabajadorId, {
        id: trabajador.trabajadorId,
        nombre: trabajador.nombre,
        ruc: trabajador.ruc,
        cargo: trabajador.cargo || 'Sin cargo',
        cuenta: trabajador.cuenta,
        totalHoras: trabajador.totalHoras,
        grupoId: '',
        jefe: { id: '', nombre: '' },
        evaluacion: {
          id: '',
          trabajadorId: trabajador.trabajadorId,
          jefeId: '',
          mes: mesSeleccionado.value,
          year: parseInt(yearSeleccionado.value),
          calificacion: 0,
          comentarios: ''
        }
      })
    }

    // Agrupar por grupo/jefe
    const gruposMap = new Map<string, GrupoEvaluaciones>()

    for (const grupo of grupos) {
      const trabajadoresDelGrupo = consolidado.trabajadores
        .filter(t => {
          // Aquí deberías tener la relación entre trabajador y grupo
          // Por ahora mostraremos todos en un grupo
          return trabajadoresMap.has(t.trabajadorId)
        })
        .map(t => {
          const trab = trabajadoresMap.get(t.trabajadorId)!
          trab.grupoId = grupo.id
          trab.jefe = { id: grupo.jefeId, nombre: grupo.nombre }
          if (trab.evaluacion) {
            trab.evaluacion.jefeId = grupo.jefeId
          }
          return trab
        })

      if (trabajadoresDelGrupo.length > 0) {
        gruposMap.set(grupo.id, {
          grupoId: grupo.id,
          nombreGrupo: grupo.nombre,
          jefeId: grupo.jefeId,
          nombreJefe: grupo.nombre,
          trabajadores: trabajadoresDelGrupo
        })
      }
    }

    gruposEvaluaciones.value = Array.from(gruposMap.values())
    mensaje.value = { texto: `Se cargaron ${consolidado.trabajadores.length} trabajadores`, tipo: 'exito' }
  } catch (error) {
    console.error('Error al cargar consolidado:', error)
    mensaje.value = { texto: 'Error al cargar consolidado', tipo: 'error' }
  } finally {
    isLoading.value = false
  }
}

const grupoTieneDatos = (grupo: GrupoEvaluaciones): boolean => {
  return grupo.trabajadores.some(t => t.evaluacion?.calificacion && t.evaluacion?.calificacion > 0)
}

const guardarGrupo = async (grupo: GrupoEvaluaciones) => {
  try {
    for (const trabajador of grupo.trabajadores) {
      if (trabajador.evaluacion?.calificacion && trabajador.evaluacion?.calificacion > 0) {
        await EvaluacionService.create({
          trabajadorId: trabajador.id,
          jefeId: grupo.jefeId,
          mes: mesSeleccionado.value,
          year: parseInt(yearSeleccionado.value),
          calificacion: trabajador.evaluacion.calificacion,
          comentarios: trabajador.evaluacion.comentarios || ''
        })
      }
    }
    mensaje.value = { texto: 'Evaluaciones guardadas exitosamente', tipo: 'exito' }
  } catch (error) {
    console.error('Error al guardar evaluaciones:', error)
    mensaje.value = { texto: 'Error al guardar evaluaciones', tipo: 'error' }
  }
}

const exportarPdf = () => {
  if (gruposEvaluaciones.value.length === 0) return

  isExportando.value = true

  try {
    const html = generarHtmlPdf()
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (doc) {
      doc.write(html)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.print()
        setTimeout(() => {
          document.body.removeChild(iframe)
          isExportando.value = false
        }, 100)
      }, 100)
    }
  } catch (error) {
    console.error('Error al exportar PDF:', error)
    mensaje.value = { texto: 'Error al exportar PDF', tipo: 'error' }
    isExportando.value = false
  }
}

const generarHtmlPdf = (): string => {
  const fecha = new Date().toLocaleDateString('es-ES')

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Evaluación de Trabajadores</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .grupo { page-break-inside: avoid; margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
        .grupo-title { background-color: #f0f0f0; padding: 10px; font-weight: bold; margin-bottom: 15px; }
        .trabajador { margin-bottom: 20px; padding: 10px; border-left: 3px solid #3498db; }
        .trabajador-name { font-weight: bold; color: #333; }
        .trabajador-info { color: #666; font-size: 0.9em; margin: 5px 0; }
        .calificacion { font-weight: bold; font-size: 1.2em; color: #3498db; margin: 5px 0; }
        .comentarios { color: #555; font-size: 0.9em; margin-top: 5px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.85em; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 EVALUACIÓN DE TRABAJADORES</h1>
        <p><strong>Mes:</strong> ${mesSeleccionado.value} | <strong>Año:</strong> ${yearSeleccionado.value}</p>
        <p>Generado: ${fecha}</p>
      </div>
  `

  for (const grupo of gruposEvaluaciones.value) {
    html += `
      <div class="grupo">
        <div class="grupo-title">
          Grupo: ${grupo.nombreGrupo} | Jefe: ${grupo.nombreJefe}
        </div>
    `

    for (const trabajador of grupo.trabajadores) {
      if (trabajador.evaluacion?.calificacion && trabajador.evaluacion?.calificacion > 0) {
        html += `
          <div class="trabajador">
            <div class="trabajador-name">${trabajador.nombre}</div>
            <div class="trabajador-info">RUC: ${trabajador.ruc}</div>
            <div class="trabajador-info">Cargo: ${trabajador.cargo}</div>
            <div class="trabajador-info">Horas: ${trabajador.totalHoras}</div>
            <div class="calificacion">Calificación: ${trabajador.evaluacion.calificacion}/5</div>
            <div class="comentarios"><strong>Observaciones:</strong> ${trabajador.evaluacion.comentarios || 'N/A'}</div>
          </div>
        `
      }
    }

    html += `</div>`
  }

  html += `
    <div class="footer">
      <p>Documento generado automáticamente | Sistema de Gestión de Finca</p>
    </div>
    </body>
    </html>
  `

  return html
}

// Inicializar
onMounted(() => {
  const fecha = new Date()
  const mesActual = meses[fecha.getMonth()]
  mesSeleccionado.value = mesActual
  yearSeleccionado.value = fecha.getFullYear().toString()
})
</script>

<style scoped>
.evaluacion-trabajadores {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 2em;
  font-weight: 700;
}

/* Filtros */
.filtros {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 25px;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filtro-grupo label {
  font-weight: 600;
  color: #555;
  font-size: 0.9em;
}

.filtro-select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  background: #fff;
  transition: all 0.3s ease;
}

.filtro-select:focus {
  outline: none;
  border-color: #3498db;
}

.btn-cargar,
.btn-exportar {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-cargar {
  background-color: #3498db;
  color: white;
}

.btn-cargar:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.btn-exportar {
  background-color: #e74c3c;
  color: white;
}

.btn-exportar:hover:not(:disabled) {
  background-color: #c0392b;
  transform: translateY(-2px);
}

.btn-cargar:disabled,
.btn-exportar:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* Loading */
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Contenido */
.contenido {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.grupo-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.grupo-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.grupo-header h3 {
  margin: 0;
  font-size: 1.2em;
}

.jefe-badge,
.trabajadores-badge {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  white-space: nowrap;
}

.trabajadores-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.trabajador-card {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.trabajador-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-principal strong {
  color: #2c3e50;
  font-size: 1.1em;
}

.subtext {
  color: #888;
  font-size: 0.9em;
}

.formulario-evaluacion {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95em;
}

.calificacion-selector {
  display: flex;
  gap: 8px;
}

.cal-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1em;
  transition: all 0.3s ease;
  color: #666;
}

.cal-btn:hover {
  border-color: #3498db;
  color: #3498db;
}

.cal-btn.active {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.textarea-evaluacion {
  padding: 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.95em;
  resize: vertical;
}

.textarea-evaluacion:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.input-group small {
  color: #888;
  font-size: 0.85em;
}

.grupo-acciones {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.btn-guardar-grupo {
  width: 100%;
  padding: 12px;
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1em;
  transition: all 0.3s ease;
}

.btn-guardar-grupo:hover:not(:disabled) {
  background-color: #229954;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
}

.btn-guardar-grupo:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

/* Sin datos */
.sin-datos {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.empty-icon {
  font-size: 4em;
  display: block;
  margin-bottom: 15px;
}

/* Mensajes */
.mensaje {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  font-weight: 600;
  animation: slideIn 0.3s ease;
  z-index: 1000;
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

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .grupo-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .trabajador-card {
    grid-template-columns: 1fr;
  }

  .filtros {
    flex-direction: column;
  }

  .filtro-grupo,
  .btn-cargar,
  .btn-exportar {
    width: 100%;
  }
}
</style>
