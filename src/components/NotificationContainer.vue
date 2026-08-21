<!-- src/components/NotificationContainer.vue -->
<template>
  <div class="notification-container">
    <TransitionGroup name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', `notification-${notification.type}`]"
      >
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✓</span>
          <span v-else-if="notification.type === 'error'">✕</span>
          <span v-else-if="notification.type === 'warning'">⚠</span>
          <span v-else>ℹ</span>
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div v-if="notification.message" class="notification-message">
            {{ notification.message }}
          </div>
        </div>
        <button class="notification-close" @click="removeNotification(notification.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '@/composables/useNotification'

const { notifications, removeNotification } = useNotification()
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  width: 100%;
  pointer-events: none;
}

.notification {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  border-left: 4px solid;
}

.notification-success {
  border-left-color: #27ae60;
  background: linear-gradient(135deg, #fff 0%, #e8f5e9 100%);
}

.notification-error {
  border-left-color: #e74c3c;
  background: linear-gradient(135deg, #fff 0%, #ffebee 100%);
}

.notification-warning {
  border-left-color: #f39c12;
  background: linear-gradient(135deg, #fff 0%, #fff8e1 100%);
}

.notification-info {
  border-left-color: #3498db;
  background: linear-gradient(135deg, #fff 0%, #e3f2fd 100%);
}

.notification-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.notification-success .notification-icon {
  background: #27ae60;
  color: white;
}

.notification-error .notification-icon {
  background: #e74c3c;
  color: white;
}

.notification-warning .notification-icon {
  background: #f39c12;
  color: white;
}

.notification-info .notification-icon {
  background: #3498db;
  color: white;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95em;
  line-height: 1.3;
}

.notification-message {
  color: #666;
  font-size: 0.85em;
  margin-top: 4px;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #333;
}

/* Animations */
.notification-enter-active {
  animation: slideIn 0.3s ease-out;
}

.notification-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 480px) {
  .notification-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .notification {
    padding: 12px;
  }
}
</style>
