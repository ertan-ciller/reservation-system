<script setup>
import { computed } from 'vue'
import Alert from './Alert.vue'
import { alertService } from '../services/alertService'

const alerts = computed(() => alertService.getAlerts())

const handleClose = (id) => {
  alertService.remove(id)
}
</script>

<template>
  <div class="alert-container">
    <Alert
      v-for="alert in alerts"
      :key="alert.id"
      :message="alert.message"
      :type="alert.type"
      :duration="alert.duration"
      @close="handleClose(alert.id)"
    />
  </div>
</template>

<style scoped>
.alert-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.alert-container :deep(.alert-overlay) {
  pointer-events: auto;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 480px) {
  .alert-container {
    padding: 0;
  }
}
</style> 