<script setup>
import { ref } from 'vue'

const props = defineProps({
  seatNumber: {
    type: [Number, String],
    required: true
  },
  rowLabel: {
    type: String,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  firstName: '',
  lastName: '',
  phone: ''
})

const errors = ref({
  firstName: '',
  lastName: '',
  phone: ''
})

const validatePhone = (phone) => {
  const phoneRegex = /^(05\d{9})$/
  return phoneRegex.test(phone)
}

const handleSubmit = async () => {
  // Reset errors
  errors.value = {
    firstName: '',
    lastName: '',
    phone: ''
  }

  let hasError = false

  if (!formData.value.firstName.trim()) {
    errors.value.firstName = 'İsim alanı zorunludur'
    hasError = true
  }

  if (!formData.value.lastName.trim()) {
    errors.value.lastName = 'Soyisim alanı zorunludur'
    hasError = true
  }

  if (!validatePhone(formData.value.phone)) {
    errors.value.phone = 'Geçerli bir telefon numarası giriniz (05XXXXXXXXX)'
    hasError = true
  }

  if (!hasError) {
    const seatId = String(props.seatNumber); // String'e çevir
    const reservationData = {
      firstName: formData.value.firstName.trim(),
      lastName: formData.value.lastName.trim(),
      phoneNumber: formData.value.phone,
      seatId: {
        id: seatId,
        row: props.rowLabel,
        numericId: parseInt(seatId)
      }
    }

    try {
      await emit('submit', reservationData)
      formData.value = { firstName: '', lastName: '', phone: '' }
    } catch (error) {
      console.error('Rezervasyon hatası:', error)
    }
  }
}
</script>

<template>
  <div class="dialog-overlay" @click="emit('close')">
    <div class="dialog" @click.stop>
      <div class="dialog-header">
        <div class="seat-info">
          <h2>{{ rowLabel }}-{{ seatNumber }} için Rezervasyon</h2>
        </div>
        <button class="close-button" @click="emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleSubmit" class="reservation-form">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">İsim</label>
            <input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              required
              placeholder="Örn: Ahmet"
              :class="{ 'error-input': errors.firstName }"
            >
            <span class="error-message" v-if="errors.firstName">{{ errors.firstName }}</span>
          </div>

          <div class="form-group">
            <label for="lastName">Soyisim</label>
            <input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              required
              placeholder="Örn: Yılmaz"
              :class="{ 'error-input': errors.lastName }"
            >
            <span class="error-message" v-if="errors.lastName">{{ errors.lastName }}</span>
          </div>
        </div>

        <div class="form-group">
          <label for="phone">Telefon Numarası</label>
          <div class="phone-input-wrapper">
            <span class="phone-prefix">+90</span>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              required
              placeholder="05XX XXX XX XX"
              maxlength="11"
              :class="{ 'error-input': errors.phone }"
            >
          </div>
          <span class="error-message" v-if="errors.phone">{{ errors.phone }}</span>
        </div>

        <div class="button-group">
          <button type="button" class="cancel" @click="emit('close')" :disabled="isLoading">
            <span>İptal</span>
          </button>
          <button type="submit" class="submit" :disabled="isLoading">
            <span>{{ isLoading ? 'Rezervasyon Yapılıyor...' : 'Rezervasyon Yap' }}</span>
            <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            <div v-else class="spinner"></div>
          </button>
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.dialog {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.seat-info {
  display: flex;
  align-items: center;
}

.seat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

h2 {
  margin: 0;
  color: #111827;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.reservation-label {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.close-button {
  background: none;
  border: none;
  color: #6b7280;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-button:hover {
  background: #f3f4f6;
  color: #111827;
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #1a1a1a;
  background: #ffffff;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: #ffffff;
}

input:not(:placeholder-shown) {
  background: #ffffff;
  border-color: #9ca3af;
  color: #1a1a1a;
}

.phone-input-wrapper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.phone-input-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.phone-input-wrapper input {
  border: none;
  background: transparent;
  padding: 0.75rem 1rem;
}

.phone-input-wrapper input:not(:placeholder-shown) {
  background: transparent;
  border-color: transparent;
}

.phone-prefix {
  padding: 0.75rem 0.5rem 0.75rem 1rem;
  color: #374151;
  font-weight: 500;
  border-right: 2px solid #e5e7eb;
  background: #f9fafb;
}

input::placeholder {
  color: #9ca3af;
  opacity: 0.8;
}

.error-input, 
.error-input .phone-input-wrapper {
  border-color: #ef4444;
  background: #ffffff;
}

.error-input:focus,
.error-input .phone-input-wrapper:focus-within {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.button-group {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  margin-top: 0.5rem;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.cancel {
  background: #f3f4f6;
  color: #374151;
}

.cancel:hover {
  background: #e5e7eb;
}

.submit {
  background: #2563eb;
  color: white;
}

.submit:hover {
  background: #1d4ed8;
}

.submit svg {
  transition: transform 0.2s;
}

.submit:hover svg {
  transform: translateX(2px);
}

@media (max-width: 480px) {
  .dialog {
    margin: 0;
    border-radius: 12px;
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .button-group {
    grid-template-columns: 1fr;
  }
}

.error-alert {
  background-color: #fee2e2;
  border: 1px solid #ef4444;
  color: #991b1b;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 