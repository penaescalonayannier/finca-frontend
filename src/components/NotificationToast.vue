<template>
  <transition-group name="toast-transition" tag="div" class="notification-container">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      :class="['notification', `notification-${notification.type}`]"
    >
      <div class="notification-content">
        <span class="notification-icon">{{ getIcon(notification.type) }}</span>
        <div class="notification-text">
          <p class="notification-title">{{ notification.title }}</p>
          <p v-if="notification.message" class="notification-message">{{ notification.message }}</p>
        </div>
      </div>
      <button @click="removeNotification(notification.id)" class="notification-close">✕</button>
    </div>
  </transition-group>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const notifications = ref<Notification[]>([])
let notificationId = 0

const getIcon = (type: string): string => {
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }
  return icons[type] || '•'
}

const addNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message?: string,
  duration = 4000
) => {
  const id = notificationId++
  const notification: Notification = { id, type, title, message, duration }

  notifications.value.push(notification)

  if (duration > 0) {
    setTimeout(() => removeNotification(id), duration)
  }
}

const removeNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const success = (title: string, message?: string) => addNotification('success', title, message)
const error = (title: string, message?: string) => addNotification('error', title, message)
const warning = (title: string, message?: string) => addNotification('warning', title, message)
const info = (title: string, message?: string) => addNotification('info', title, message)

defineExpose({ addNotification, success, error, warning, info, removeNotification })
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.notification {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  backdrop-filter: blur(10px);
  min-width: 300px;
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

.toast-transition-leave-active {
  transition: all 0.3s ease-out;
}

.toast-transition-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

.notification-success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-left: 4px solid #28a745;
  color: #155724;
}

.notification-error {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border-left: 4px solid #dc3545;
  color: #721c24;
}

.notification-warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
  border-left: 4px solid #ffc107;
  color: #856404;
}

.notification-info {
  background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
  border-left: 4px solid #17a2b8;
  color: #0c5460;
}

.notification-content {
  display: flex;
  gap: 12px;
  flex: 1;
}

.notification-icon {
  font-weight: bold;
  font-size: 1.2em;
  flex-shrink: 0;
}

.notification-text {
  flex: 1;
}

.notification-title {
  margin: 0;
  font-weight: 600;
  font-size: 0.95em;
}

.notification-message {
  margin: 4px 0 0 0;
  font-size: 0.85em;
  opacity: 0.9;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  opacity: 0.7;
  margin-left: 12px;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  opacity: 1;
}
</style>
