import { ref } from 'vue'

const alerts = ref([])

export const alertService = {
  add(message, type = 'success', duration = 3000) {
    const id = Date.now()
    alerts.value.push({ id, message, type, duration })
    return id
  },

  remove(id) {
    const index = alerts.value.findIndex(alert => alert.id === id)
    if (index !== -1) {
      alerts.value.splice(index, 1)
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

  getAlerts() {
    return alerts.value
  }
} 