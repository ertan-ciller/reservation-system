<script setup>
import { ref, computed } from 'vue'
import { toastService } from '../services/toastService'

const props = defineProps({
  selectedSeats: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  reservedSeats: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'submit'])

const totalPrice = computed(() => {
  return props.selectedSeats.reduce((total, seat) => {
    // Koltuk kategorisine göre fiyat belirleme
    let price = 150 // 2. Kategori fiyatı
    if (seat.category === '1') {
      price = 300 // 1. Kategori fiyatı
    }
    return total + price
  }, 0)
})

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

const successMessage = ref('')

const validatePhone = (phone) => {
  const phoneRegex = /^(5\d{9})$/
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
    errors.value.phone = 'Geçerli bir telefon numarası giriniz (5XXXXXXXXX)'
    hasError = true
  }

  if (!hasError) {
    const reservationData = {
      firstName: formData.value.firstName.trim(),
      lastName: formData.value.lastName.trim(),
      phoneNumber: formData.value.phone,
      seatIds: props.selectedSeats.map(seat => ({
        id: seat.seatNumber,
        row: seat.rowLabel,
        numericId: parseInt(seat.seatNumber)
      }))
    }

    try {
      await emit('submit', reservationData)
      formData.value = { firstName: '', lastName: '', phone: '' }
      toastService.success('Rezervasyonunuz başarıyla oluşturuldu!')
      // Rezerve edilen koltukları güncelle
      props.reservedSeats.push(...reservationData.seatIds)
      emit('close')
    } catch (error) {
      console.error('Rezervasyon hatası:', error)
      toastService.error('Rezervasyon oluşturulurken bir hata oluştu.')
    }
  }
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog">
      <div class="dialog-header">
        <h2>Rezervasyon</h2>
        <button class="close-button" @click="emit('close')">&times;</button>
      </div>

      <div class="selected-seats-info">
        <h3>Seçilen Koltuklar:</h3>
        <ul class="selected-seats-list">
          <li v-for="seat in selectedSeats" 
              :key="seat.seatFullId"
              :class="{ 'reserved': reservedSeats.some(reserved => 
                reserved.id === seat.seatNumber && reserved.row === seat.rowLabel
              )}">
            {{ seat.rowLabel }} - {{ seat.seatNumber }}
          </li>
        </ul>
        <p class="total-price">
          Toplam Tutar: <span class="price">{{ totalPrice }}₺</span>
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="reservation-form">
        <div class="form-group">
          <label for="firstName">Ad</label>
          <input
            id="firstName"
            v-model="formData.firstName"
            type="text"
            :class="{ 'error': errors.firstName }"
          />
          <span class="error-message" v-if="errors.firstName">{{ errors.firstName }}</span>
        </div>

        <div class="form-group">
          <label for="lastName">Soyad</label>
          <input
            id="lastName"
            v-model="formData.lastName"
            type="text"
            :class="{ 'error': errors.lastName }"
          />
          <span class="error-message" v-if="errors.lastName">{{ errors.lastName }}</span>
        </div>

        <div class="form-group">
          <label for="phone">Telefon (5XXXXXXXXX)</label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            maxlength="10"
            :class="{ 'error': errors.phone }"
          />
          <span class="error-message" v-if="errors.phone">{{ errors.phone }}</span>
        </div>

        <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
        <div class="success-message" v-if="successMessage">{{ successMessage }}</div>

        <button type="submit" class="submit-button" :disabled="isLoading">
          {{ isLoading ? 'İşleniyor...' : 'Rezervasyon Yap' }}
        </button>
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
}

.selected-seats-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.selected-seats-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #2c3e50;
}

.selected-seats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0;
  margin: 0 0 1rem 0;
  list-style: none;
}

.selected-seats-list li {
  background-color: #edf2f7;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #2d3748;
  font-weight: 500;
}

.selected-seats-list li.reserved {
  background-color: #3182ce;
  color: white;
}

.total-price {
  margin: 0;
  font-weight: 600;
  color: #2c3e50;
}

.price {
  color: #3182ce;
}

.reservation-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  color: #666;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: #f0f4f8;
  color: #2d3748;
}

.form-group input:focus {
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
  outline: none;
}

.form-group input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
}

.success-message {
  color: #28a745;
  font-size: 0.9rem;
  padding: 0.5rem;
  margin-bottom: 1rem;
  background-color: #d4edda;
  border-radius: 4px;
  text-align: center;
}

.submit-button {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #2c5282;
}

.submit-button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .dialog {
    padding: 1rem;
  }
  
  .dialog-header h2 {
    font-size: 1.25rem;
  }
  
  .form-group input {
    padding: 0.5rem;
  }
}
</style> 