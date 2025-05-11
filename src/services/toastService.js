import { ref } from 'vue'

const toasts = ref([])

export const toastService = {
  add(message, type = 'success', duration = 3000) {
    const id = Date.now()
    toasts.value.push({ id, message, type, duration })
    return id
  },

  remove(id) {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  },

  success(message, duration) {
    return this.add(message, 'success', duration)
  },

  error(message, duration) {
    return this.add(message, 'error', duration)
  },

  warning(message, duration) {
    return this.add(message, 'warning', duration)
  },

  info(message, duration) {
    return this.add(message, 'info', duration)
  },

  getToasts() {
    return toasts.value
  }
} 