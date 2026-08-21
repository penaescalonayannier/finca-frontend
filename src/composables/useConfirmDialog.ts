import { ref, readonly } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  icon?: string
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

const state = ref<ConfirmState>({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  type: 'warning',
  resolve: null
})

export function useConfirmDialog() {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      state.value = {
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        type: options.type || 'warning',
        resolve
      }
    })
  }

  const handleConfirm = () => {
    if (state.value.resolve) {
      state.value.resolve(true)
    }
    state.value.isOpen = false
  }

  const handleCancel = () => {
    if (state.value.resolve) {
      state.value.resolve(false)
    }
    state.value.isOpen = false
  }

  return {
    state: readonly(state),
    confirm,
    handleConfirm,
    handleCancel
  }
}

// Singleton helpers for easy access
const { confirm, handleConfirm, handleCancel, state: confirmState } = useConfirmDialog()

export const confirmDialog = {
  show: confirm,

  delete: (itemName: string, extraMessage?: string) => {
    return confirm({
      title: 'Confirmar Eliminación',
      message: extraMessage
        ? `¿Eliminar <strong>${itemName}</strong>?<br><br><small>${extraMessage}</small>`
        : `¿Estás seguro de eliminar <strong>${itemName}</strong>?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    })
  },

  action: (title: string, message: string) => {
    return confirm({
      title,
      message,
      type: 'warning'
    })
  }
}

export { confirmState, handleConfirm, handleCancel }
