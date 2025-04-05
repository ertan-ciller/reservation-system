<script setup>
import { ref } from 'vue'
import SeatMap from '../components/SeatMap.vue'
import ReservationDialog from '../components/ReservationDialog.vue'
import { reservationService } from '../services/reservationService'

const selectedSeat = ref(null)
const isDialogOpen = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleSeatSelect = (seat) => {
  selectedSeat.value = seat
  isDialogOpen.value = true
  errorMessage.value = ''
}

const handleDialogClose = () => {
  isDialogOpen.value = false
  selectedSeat.value = null
  errorMessage.value = ''
}

const handleReservation = async (userInfo) => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    const reservationData = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phoneNumber: userInfo.phoneNumber,
      seatId: userInfo.seatId
    }

    const result = await reservationService.createReservation(reservationData)

    if (result.success) {
      isDialogOpen.value = false
      selectedSeat.value = null
      alert('Rezervasyonunuz başarıyla oluşturuldu!')
    } else {
      errorMessage.value = result.error
    }
  } catch (error) {
    errorMessage.value = 'Rezervasyon oluşturulurken bir hata oluştu.'
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
      <SeatMap @seat-select="handleSeatSelect" />
      
      <ReservationDialog
        v-if="isDialogOpen"
        :seat-number="selectedSeat?.seatNumber"
        :row-label="selectedSeat?.rowLabel"
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
</style> 