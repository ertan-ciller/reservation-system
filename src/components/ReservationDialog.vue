<script setup>
import { ref } from 'vue'

const props = defineProps({
  seatNumber: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  name: '',
  email: '',
  phone: ''
})

const handleSubmit = () => {
  emit('submit', { ...formData.value })
  formData.value = { name: '', email: '', phone: '' }
}
</script>

<template>
  <div class="dialog-overlay" @click="emit('close')">
    <div class="dialog" @click.stop>
      <h2>Reserve Seat {{ seatNumber }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="name">Name:</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Enter your name"
          >
        </div>

        <div class="form-group">
          <label for="email">Email:</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="Enter your email"
          >
        </div>

        <div class="form-group">
          <label for="phone">Phone:</label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            required
            placeholder="Enter your phone number"
          >
        </div>

        <div class="button-group">
          <button type="button" class="cancel" @click="emit('close')">Cancel</button>
          <button type="submit" class="submit">Reserve</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel {
  background-color: #e0e0e0;
}

.cancel:hover {
  background-color: #d0d0d0;
}

.submit {
  background-color: #4CAF50;
  color: white;
}

.submit:hover {
  background-color: #45a049;
}
</style> 