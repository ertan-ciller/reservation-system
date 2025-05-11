<script setup>
import { computed } from 'vue'
import Toast from './Toast.vue'
import { toastService } from '../services/toastService'

const toasts = computed(() => toastService.getToasts())

const handleClose = (id) => {
  toastService.remove(id)
}
</script>

<template>
  <div class="toast-container">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="handleClose(toast.id)"
    />
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: 0;
  right: 0;
  padding: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

@media (max-width: 480px) {
  .toast-container {
    left: 0;
    right: 0;
    padding: 10px;
  }
}
</style> 