<template>
  <transition name="modal-fade">
    <div v-if="mostrar" class="modal-overlay" @click="rechazar">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <span :class="['modal-icon', `icon-${tipo}`]">{{ getIcon(tipo) }}</span>
          <h3 class="modal-title">{{ titulo }}</h3>
        </div>

        <div class="modal-body">
          <p>{{ mensaje }}</p>
          <div v-if="detalles" class="modal-detalles">
            {{ detalles }}
          </div>
        </div>

        <div class="modal-footer">
          <button @click="rechazar" class="btn-cancel">
            {{ textoBotonCancelar }}
          </button>
          <button @click="confirmar" :class="['btn-confirm', `btn-${tipo}`]">
            {{ textoBotonConfirmar }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type TipoConfirmacion = 'warning' | 'danger' | 'info'

const mostrar = ref(false)
const tipo = ref<TipoConfirmacion>('warning')
const titulo = ref('')
const mensaje = ref('')
const detalles = ref('')
const textoBotonConfirmar = ref('Confirmar')
const textoBotonCancelar = ref('Cancelar')

let resolvePromise: ((value: boolean) => void) | null = null

const getIcon = (t: string): string => {
  const icons: Record<string, string> = {
    warning: '⚠',
    danger: '⛔',
    info: 'ℹ'
  }
  return icons[t] || '❓'
}

const mostrarConfirmacion = (
  tituloMsg: string,
  mensajeMsg: string,
  opcionesPersonalizadas?: {
    tipo?: TipoConfirmacion
    detalles?: string
    textoConfirmar?: string
    textoCancelar?: string
  }
): Promise<boolean> => {
  titulo.value = tituloMsg
  mensaje.value = mensajeMsg
  tipo.value = opcionesPersonalizadas?.tipo || 'warning'
  detalles.value = opcionesPersonalizadas?.detalles || ''
  textoBotonConfirmar.value = opcionesPersonalizadas?.textoConfirmar || 'Confirmar'
  textoBotonCancelar.value = opcionesPersonalizadas?.textoCancelar || 'Cancelar'

  mostrar.value = true

  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const confirmar = () => {
  mostrar.value = false
  if (resolvePromise) {
    resolvePromise(true)
    resolvePromise = null
  }
}

const rechazar = () => {
  mostrar.value = false
  if (resolvePromise) {
    resolvePromise(false)
    resolvePromise = null
  }
}

defineExpose({ mostrarConfirmacion })
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
  z-index: 2000;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-icon {
  font-size: 1.5em;
  flex-shrink: 0;
}

.icon-warning {
  color: #f39c12;
}

.icon-danger {
  color: #e74c3c;
}

.icon-info {
  color: #3498db;
}

.modal-title {
  margin: 0;
  font-size: 1.1em;
  color: #2c3e50;
  font-weight: 600;
}

.modal-body {
  padding: 20px;
  color: #555;
  line-height: 1.6;
}

.modal-body p {
  margin: 0 0 10px 0;
}

.modal-detalles {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-left: 3px solid #3498db;
  border-radius: 4px;
  font-size: 0.9em;
  color: #34495e;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #ecf0f1;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95em;
}

.btn-cancel {
  background: #ecf0f1;
  color: #2c3e50;
}

.btn-cancel:hover {
  background: #bdc3c7;
}

.btn-confirm {
  color: white;
}

.btn-confirm.btn-warning {
  background: #f39c12;
}

.btn-confirm.btn-warning:hover {
  background: #e67e22;
}

.btn-confirm.btn-danger {
  background: #e74c3c;
}

.btn-confirm.btn-danger:hover {
  background: #c0392b;
}

.btn-confirm.btn-info {
  background: #3498db;
}

.btn-confirm.btn-info:hover {
  background: #2980b9;
}
</style>
