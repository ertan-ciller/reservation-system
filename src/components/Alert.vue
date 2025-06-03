<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['close'])
const isVisible = ref(true)
let timeoutId = null

onMounted(() => {
  timeoutId = setTimeout(() => {
    isVisible.value = false
    setTimeout(() => emit('close'), 300) // Wait for fade out animation
  }, props.duration)
})

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
})

const getIcon = () => {
  switch (props.type) {
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    case 'info':
      return 'ℹ️'
    default:
      return '✅'
  }
}
</script>

<template>
  <Transition name="alert">
    <div v-if="isVisible" class="alert-overlay">
      <div :class="['alert', `alert-${type}`]">
        <span class="alert-icon">{{ getIcon() }}</span>
        <span class="alert-message">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
}

.alert {
  padding: 20px 32px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 300px;
  max-width: 500px;
}

.alert-success {
  border-left: 4px solid #22c55e;
}

.alert-error {
  border-left: 4px solid #ef4444;
}

.alert-warning {
  border-left: 4px solid #f59e0b;
}

.alert-info {
  border-left: 4px solid #3b82f6;
}

.alert-icon {
  font-size: 24px;
}

.alert-message {
  font-size: 16px;
  color: #1f2937;
  font-weight: 500;
}

.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.alert-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style> 