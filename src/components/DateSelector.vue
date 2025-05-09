<script setup>
import { ref } from 'vue'

const props = defineProps({
  selectedDate: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:selectedDate'])

const showDates = [
  { date: '2025-06-13', label: '13 Haziran 2025' },
  { date: '2025-06-14', label: '14 Haziran 2025' }
]

const handleDateSelect = (date) => {
  emit('update:selectedDate', date)
}
</script>

<template>
  <div class="date-selector">
    <h3>Gösteri Tarihi Seçin</h3>
    <div class="date-buttons">
      <button
        v-for="showDate in showDates"
        :key="showDate.date"
        :class="{ active: selectedDate === showDate.date }"
        @click="handleDateSelect(showDate.date)"
      >
        {{ showDate.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-selector {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.date-selector h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #333;
}

.date-buttons {
  display: flex;
  gap: 1rem;
}

.date-buttons button {
  flex: 1;
  padding: 0.8rem;
  border: 2px solid #F7B036;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.date-buttons button:hover {
  background: #F7B036;
  color: white;
}

.date-buttons button.active {
  background: #F7B036;
  color: white;
}
</style> 