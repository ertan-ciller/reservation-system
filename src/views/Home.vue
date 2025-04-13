<script setup>
import { ref } from 'vue'
import SeatMap from '../components/SeatMap.vue'
import ReservationDialog from '../components/ReservationDialog.vue'
import { reservationService } from '../services/reservationService'

const selectedSeats = ref([])
const isDialogOpen = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleSeatSelect = (seat) => {
  if (selectedSeats.value.length >= 10 && !selectedSeats.value.some(s => s.seatFullId === seat.seatFullId)) {
    alert('En fazla 10 koltuk seçebilirsiniz!')
    return
  }
  const seatIndex = selectedSeats.value.findIndex(s => s.seatFullId === seat.seatFullId)
  
  if (seatIndex === -1) {
    selectedSeats.value.push(seat)
  } else {
    selectedSeats.value.splice(seatIndex, 1)
  }
}

const handleReservationClick = () => {
  if (selectedSeats.value.length === 0) {
    alert('Lütfen en az bir koltuk seçiniz!')
    return
  }
  isDialogOpen.value = true
  errorMessage.value = ''
}

const handleDialogClose = () => {
  isDialogOpen.value = false
  errorMessage.value = ''
}

const handleReservation = async (userInfo) => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const seatIds = selectedSeats.value.map(seat => {
      return `${seat.rowLabel}-${seat.seatNumber}`
    })

    const reservationData = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phoneNumber: userInfo.phoneNumber,
      seatIds: seatIds
    }

    const result = await reservationService.createReservation(reservationData)
    
    if (result.success) {
      isDialogOpen.value = false
      selectedSeats.value = []
      alert('Rezervasyonlarınız başarıyla oluşturuldu!')
    } else {
      errorMessage.value = result.error || 'Bazı rezervasyonlar oluşturulamadı.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Rezervasyon oluşturulurken bir hata oluştu.'
    console.error('Rezervasyon hatası:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="home">
    <header>
      <h1></h1>
    </header>
    <div class="stage-label">SAHNE</div>
    
    <main>
      <SeatMap @seat-select="handleSeatSelect" :selected-seats="selectedSeats" />
      
      <div class="selected-seats-container" v-if="selectedSeats.length > 0">
        <div class="selected-seats-info">
          <div class="selected-seats-header">
            <span class="seat-icon">🎟️</span>
            <h3>Seçilen Koltuklar</h3>
          </div>
          <div class="selected-seats-list">
            <div v-for="seat in selectedSeats" :key="seat.seatFullId" class="seat-item">
              <span class="seat-label">{{ seat.rowLabel }}-{{ seat.seatNumber }}</span>
            </div>
          </div>
          <div class="total-price">
            <span>Toplam Tutar:</span>
            <span class="price">{{ selectedSeats.length * 100 }}₺</span>
          </div>
          <button class="reserve-button" @click="handleReservationClick">
            <span class="button-icon">🎫</span>
            <span>Rezervasyon Yap</span>
          </button>
        </div>
      </div>
      
      <ReservationDialog
        v-if="isDialogOpen"
        :selected-seats="selectedSeats"
        :is-loading="isLoading"
        :error-message="errorMessage"
        @close="handleDialogClose"
        @submit="handleReservation"
      />
    </main>
  </div>
</template>

<style scoped>
.home {
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

h1 {
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stage-label {
  position: relative;
  width: 60%;
  min-width: 300px;
  height: 40px;
  margin: 0 auto 3rem;
  background: linear-gradient(90deg, #2c5282, #3182ce);
  border-radius: 8px 8px 0 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  z-index: 2;
}

.stage-label::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 10px;
  background: linear-gradient(180deg, rgba(49, 130, 206, 0.2), transparent);
  pointer-events: none;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0;
  overflow-x: hidden;
  position: relative;
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
  }

  h1 {
    font-size: 2rem;
  }

  .stage-label {
    width: 80%;
    min-width: 250px;
    height: 35px;
    font-size: 1rem;
    margin-bottom: 2rem;
  }
}

@media (max-width: 480px) {
  .home {
    padding: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
  }

  .stage-label {
    width: 90%;
    min-width: 200px;
    height: 30px;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }
}

.selected-seats-container {
  position: fixed;
  top: 2rem;
  right: 2rem;
  transform: none;
  width: 300px;
  max-width: 100%;
  z-index: 100;
}

.selected-seats-info {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.selected-seats-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.seat-icon {
  font-size: 1.5rem;
}

.selected-seats-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #2d3748;
  font-weight: 600;
}

.selected-seats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.seat-item {
  background-color: #edf2f7;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #2d3748;
  font-weight: 500;
}

.total-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  color: #2d3748;
  font-weight: 500;
}

.price {
  font-size: 1.2rem;
  color: #3182ce;
  font-weight: 600;
}

.reserve-button {
  width: 100%;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-icon {
  font-size: 1.2rem;
}

.reserve-button:hover {
  background-color: #2c5282;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(49, 130, 206, 0.2);
}

@media (max-width: 768px) {
  .selected-seats-container {
    top: 1rem;
    right: 1rem;
    width: 280px;
  }
}

@media (max-width: 480px) {
  .selected-seats-container {
    top: 0.5rem;
    right: 0.5rem;
    width: 250px;
  }
}
</style> 