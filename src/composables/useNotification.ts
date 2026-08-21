// src/composables/useNotification.ts
import { ref, readonly } from 'vue'

export interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const notifications = ref<Notification[]>([])
let notificationId = 0

const addNotification = (notification: Omit<Notification, 'id'>) => {
  const id = ++notificationId
  const duration = notification.duration ?? 4000

  notifications.value.push({
    ...notification,
    id
  })

  if (duration > 0) {
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }

  return id
}

const removeNotification = (id: number) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

const success = (title: string, message?: string) => {
  return addNotification({ type: 'success', title, message })
}

const error = (title: string, message?: string) => {
  return addNotification({ type: 'error', title, message, duration: 6000 })
}

const warning = (title: string, message?: string) => {
  return addNotification({ type: 'warning', title, message })
}

const info = (title: string, message?: string) => {
  return addNotification({ type: 'info', title, message })
}

const clearAll = () => {
  notifications.value = []
}

export function useNotification() {
  return {
    notifications: readonly(notifications),
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    clearAll
  }
}

// Singleton para uso global
export const notify = {
  success,
  error,
  warning,
  info,
  clearAll
}
