<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="state.isOpen" class="confirm-overlay" @click.self="handleCancel">
        <Transition name="confirm-scale">
          <div v-if="state.isOpen" class="confirm-dialog" :class="[`confirm-${state.type}`]">
            <div class="confirm-icon">
              <svg v-if="state.type === 'danger'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <svg v-else-if="state.type === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>

            <h3 class="confirm-title">{{ state.title }}</h3>
            <p class="confirm-message" v-html="state.message"></p>

            <div class="confirm-actions">
              <button
                class="confirm-btn confirm-btn-cancel"
                @click="handleCancel"
              >
                {{ state.cancelText }}
              </button>
              <button
                class="confirm-btn confirm-btn-confirm"
                :class="[`btn-${state.type}`]"
                @click="handleConfirm"
              >
                {{ state.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { confirmState as state, handleConfirm, handleCancel } from '@/composables/useConfirmDialog'
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  padding: 28px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.confirm-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.confirm-icon svg {
  width: 32px;
  height: 32px;
}

.confirm-danger .confirm-icon {
  background: #fde8e8;
  color: #e53e3e;
}

.confirm-warning .confirm-icon {
  background: #fef3c7;
  color: #d97706;
}

.confirm-info .confirm-icon {
  background: #e0f2fe;
  color: #0284c7;
}

.confirm-title {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.confirm-message {
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 0.95rem;
  line-height: 1.5;
}

.confirm-message :deep(strong) {
  color: #374151;
  font-weight: 600;
}

.confirm-message :deep(small) {
  display: block;
  margin-top: 8px;
  font-size: 0.85rem;
  color: #9ca3af;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.confirm-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  min-width: 100px;
}

.confirm-btn-cancel {
  background: #f3f4f6;
  color: #4b5563;
}

.confirm-btn-cancel:hover {
  background: #e5e7eb;
}

.confirm-btn-confirm.btn-danger {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  color: white;
}

.confirm-btn-confirm.btn-danger:hover {
  background: linear-gradient(135deg, #c53030 0%, #9b2c2c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.4);
}

.confirm-btn-confirm.btn-warning {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  color: white;
}

.confirm-btn-confirm.btn-warning:hover {
  background: linear-gradient(135deg, #b45309 0%, #92400e 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.4);
}

.confirm-btn-confirm.btn-info {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: white;
}

.confirm-btn-confirm.btn-info:hover {
  background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
}

/* Animations */
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-scale-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-scale-leave-active {
  transition: all 0.15s ease-in;
}

.confirm-scale-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.confirm-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
