<template>
  <div v-if="mostrar" class="modal-overlay" @click="cerrar">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h2>Evaluaciones - {{ evaluacion.mes }} {{ evaluacion.year }}</h2>
        <button @click="cerrar" class="btn-cerrar">✕</button>
      </div>

      <div class="modal-content">
        <div class="info-section">
          <p><strong>Grupo:</strong> {{ evaluacion.grupoNombre }}</p>
          <p><strong>Fecha:</strong> {{ formatFecha(evaluacion.fecha) }}</p>
          <p><strong>Jefe:</strong> {{ evaluacion.jefeNombre }}</p>
        </div>

        <div class="tabla-trabajadores">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nombre y Apellidos</th>
                <th>Evaluación</th>
                <th>Comentarios</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(trabajador, index) in evaluacion.trabajadores" :key="trabajador.id">
                <td class="numero">{{ index + 1 }}</td>
                <td class="nombre">{{ trabajador.trabajadorNombre }}</td>
                <td class="evaluacion">
                  <span :class="[
                    'badge',
                    {
                      'badge-superior': trabajador.evaluacion === 'superior',
                      'badge-acuado': trabajador.evaluacion === 'acuado',
                      'badge-deficiente': trabajador.evaluacion === 'deficiente',
                      'badge-vacio': !trabajador.evaluacion
                    }
                  ]">
                    {{ trabajador.evaluacion ? trabajador.evaluacion.charAt(0).toUpperCase() + trabajador.evaluacion.slice(1) : '-' }}
                  </span>
                </td>
                <td class="comentarios">{{ trabajador.comentarios || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="cerrar" class="btn-cerrar-modal">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Evaluacion } from '@/types/Evaluacion'

interface Props {
  evaluacion?: Evaluacion
}

interface Emit {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const mostrar = ref(false)

const abrirModal = (evaluacion: Evaluacion) => {
  mostrar.value = true
}

const cerrar = () => {
  mostrar.value = false
  emit('close')
}

const formatFecha = (fecha: string): string => {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-ES')
}

defineExpose({ abrirModal })
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 900px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5em;
  color: #2c3e50;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
  color: #7f8c8d;
  transition: color 0.3s;
}

.btn-cerrar:hover {
  color: #e74c3c;
}

.modal-content {
  padding: 20px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info-section p {
  margin: 8px 0;
  color: #2c3e50;
}

.tabla-trabajadores {
  margin-bottom: 20px;
  overflow-x: auto;
}

.tabla-trabajadores table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.tabla-trabajadores thead {
  background-color: #34495e;
  color: white;
}

.tabla-trabajadores th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.tabla-trabajadores td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.tabla-trabajadores tbody tr:hover {
  background-color: #f8f9fa;
}

.numero {
  text-align: center;
  width: 50px;
  font-weight: 500;
}

.nombre {
  font-weight: 500;
  color: #2c3e50;
}

.evaluacion {
  text-align: center;
}

.comentarios {
  color: #7f8c8d;
  font-size: 0.9em;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.85em;
}

.badge-superior {
  background-color: #d4edda;
  color: #155724;
}

.badge-acuado {
  background-color: #fff3cd;
  color: #856404;
}

.badge-deficiente {
  background-color: #f8d7da;
  color: #721c24;
}

.badge-vacio {
  background-color: #e2e3e5;
  color: #383d41;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #ecf0f1;
  text-align: right;
  background: #f8f9fa;
}

.btn-cerrar-modal {
  padding: 10px 20px;
  background-color: #95a5a6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-cerrar-modal:hover {
  background-color: #7f8c8d;
}
</style>
