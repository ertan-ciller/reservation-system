<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import SeatMap from '../components/SeatMap.vue'
import ReservationDialog from '../components/ReservationDialog.vue'
import { reservationService } from '../services/reservationService'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import DateSelector from '../components/DateSelector.vue'
import { toastService } from '../services/toastService'

const selectedDate = ref('')
const selectedSeats = ref([])
const isDialogOpen = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showSelectedSeats = ref(true)
const seatMapContainerRef = ref(null)

const totalPrice = computed(() => {
  return selectedSeats.value.reduce((total, seat) => {
    // Koltuk kategorisine göre fiyat belirleme
    let price = 500 // Varsayılan fiyat (2. Kategori)
    if (seat.category === '1') {
      price = 600
    } else if (seat.category === 'P') {
      price = 700
    }
    return total + price
  }, 0)
})

const handleSeatSelect = (seat) => {
  if (selectedSeats.value.length >= 10 && !selectedSeats.value.some(s => s.seatFullId === seat.seatFullId)) {
    toastService.warning('En fazla 10 koltuk seçebilirsiniz!')
    return
  }
  const existingIndex = selectedSeats.value.findIndex(s => s.seatFullId === seat.seatFullId)
  
  if (existingIndex === -1) {
    selectedSeats.value.push(seat)
    showSelectedSeats.value = true
  } else {
    selectedSeats.value.splice(existingIndex, 1)
  }
}

const removeSeat = (seat) => {
  const index = selectedSeats.value.findIndex(s => s.seatFullId === seat.seatFullId)
  if (index !== -1) {
    selectedSeats.value.splice(index, 1)
  }
}

const handleReservationClick = () => {
  if (selectedSeats.value.length === 0) {
    toastService.warning('Lütfen en az bir koltuk seçiniz!')
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
      seatIds: seatIds,
      showDate: selectedDate.value,
      status: 'pending'
    }

    const result = await reservationService.createReservation(reservationData)
    
    if (result.success) {
      isDialogOpen.value = false
      selectedSeats.value = []
      toastService.success('Rezervasyonlarınız başarıyla oluşturuldu!')
    } else {
      errorMessage.value = result.error || 'Bazı rezervasyonlar oluşturulamadı.'
      toastService.error(result.error || 'Bazı rezervasyonlar oluşturulamadı.')
    }
  } catch (error) {
    errorMessage.value = error.message || 'Rezervasyon oluşturulurken bir hata oluştu.'
    toastService.error(error.message || 'Rezervasyon oluşturulurken bir hata oluştu.')
    console.error('Rezervasyon hatası:', error)
  } finally {
    isLoading.value = false
  }
}

const closePrices = () => {
  selectedSeats.value = []
  showSelectedSeats.value = false
}

const toggleSelectedSeats = () => {
  showSelectedSeats.value = !showSelectedSeats.value
}

const centerSeatMapScroll = () => {
  nextTick(() => {
    const container = seatMapContainerRef.value
    if (container) {
      container.scrollLeft = (container.scrollWidth - container.offsetWidth) / 2
    }
  })
}

onMounted(() => {
  centerSeatMapScroll()
})

watch(selectedDate, () => {
  centerSeatMapScroll()
})
</script>

<template>
  <div class="home">
    <header>
      <h1></h1>
    </header>
    
    <DateSelector v-model:selectedDate="selectedDate" />
    
    <div v-if="selectedDate" class="stage-label">SAHNE</div>
    
    <main>
      <div v-if="selectedDate" class="seat-map-container" ref="seatMapContainerRef">
        <SeatMap 
          @seat-select="handleSeatSelect" 
          :selected-seats="selectedSeats"
          :show-date="selectedDate" 
        />
      </div>
      
      <div v-else class="select-date-message">
        Lütfen gösteri tarihini seçiniz
      </div>
      
      <div v-if="selectedSeats.length > 0" 
           class="selected-seats-container"
           :class="{ 'collapsed': !showSelectedSeats }">
        <div class="ticket-prices">
          <div class="prices-header">
            <h3>BİLET FİYATLARI</h3>
            <button class="toggle-button" @click="toggleSelectedSeats">
              <svg :class="{ 'rotated': !showSelectedSeats }" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="6,12 10,8 14,12" stroke="#333" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              </svg>
            </button>
          </div>
          <div class="price-list">
            <div class="price-item">
              <span>500,00 ₺</span>
              <span class="category">2. Kategori</span>
            </div>
            <div class="price-item">
              <span>600,00 ₺</span>
              <span class="category">1. Kategori</span>
            </div>
            <div class="price-item">
              <span>700,00 ₺</span>
              <span class="category">Protokol</span>
            </div>
          </div>
        </div>

        <div v-show="showSelectedSeats" class="selected-seats-section">
          <div class="selected-seats-header">
            <h3>Seçtiğiniz Koltuklar ({{ selectedSeats.length }})</h3>
          </div>
          <div class="selected-seats-content">
            <div class="selected-seats-list">
              <div v-for="seat in selectedSeats" :key="seat.seatFullId" class="selected-seat-item">
                {{ seat.rowLabel }}{{ seat.seatNumber }}
                <button class="remove-seat" @click="removeSeat(seat)">×</button>
              </div>
            </div>
            <div class="selected-seats-footer">
              <div class="total-price">
                Toplam Bilet Bedeli: {{ totalPrice.toLocaleString('tr-TR') }},00₺
                <div class="price-note">Hizmet bedeli ve indirimler ödeme ekranında hesaplanacaktır.</div>
              </div>
              <button class="reservation-button" @click="handleReservationClick">
                Şimdi Rezervasyon Yap
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ReservationDialog
        v-if="isDialogOpen"
        :selected-seats="selectedSeats"
        :is-loading="isLoading"
        :error-message="errorMessage"
        :show-date="selectedDate"
        @close="handleDialogClose"
        @submit="handleReservation"
      />
    </main>
  </div>
</template>

<style>
.home {
  width: 100%;
  min-height: 100vh;
  /*padding: 1rem;*/
  position: relative;
  overflow-x: hidden;
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
  position: relative;
  width: 100%;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 2rem;
  transition: transform 0.3s ease, padding-bottom 0.3s ease;
}

.seat-map-container {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  padding: 1rem 0;
  margin: 0 auto;
  box-sizing: border-box;
  scroll-snap-type: x mandatory;
}

:deep(.seat-map) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  min-width: unset;
  max-width: unset;
  transform: scale(0.9);
  transform-origin: center center;
  scroll-snap-align: center;
}

@media (max-width: 1024px) {
  .seat-map-container {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    justify-content: center;
    padding: 0.5rem 0;
  }
  :deep(.seat-map) {
    margin: 0 auto;
    transform: scale(0.7);
  }
}

@media (max-width: 600px) {
  .seat-map-container {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    justify-content: center;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  :deep(.seat-map) {
    width: auto;
    max-width: 100vw;
    margin: 0 auto;
    transform: scale(0.5);
  }
}

.selected-seats-container {
  position: fixed;
  bottom: 0;
  left: 16px;
  right: 16px;
  width: auto;
  background: white;
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: transform 0.3s ease;
}

.selected-seats-container.collapsed {
  transform: translateY(calc(100% - 120px));
}

.prices-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 0;
}

.prices-header h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.toggle-button {
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  color: #666;
  font-size: 20px;
}

.toggle-button svg {
  display: inline-block;
  transition: transform 0.3s ease;
  transform: rotate(180deg);
}

.toggle-button svg.rotated {
  transform: rotate(0deg);
}

.price-list {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 0px solid #eee;
}

.price-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.price-item span:first-child {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.category {
  font-size: 12px;
  color: #666;
}

.selected-seats-section {
  transition: max-height 0.3s ease;
}

.selected-seats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
}

.selected-seat-item {
  background: #F7B036;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-seat {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-seats-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.total-price {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.price-note {
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
}

.reservation-button {
  width: 100%;
  padding: 14px;
  background: #F7B036;
  color: #333;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  cursor: pointer;
}

@media (max-width: 480px) {
  .home {
    padding-bottom: 180px;
  }

  .selected-seats-container {
    max-height: calc(100vh - 60px);
    overflow-y: auto;
  }

  .price-list {
    padding: 8px 16px;
  }

  .selected-seat-item {
    padding: 4px 10px;
    font-size: 13px;
  }
}

@media (min-width: 769px) {
  .selected-seats-container {
    width: 350px;
    right: 1rem;
    left: auto;
    bottom: auto;
    top: 1rem;
    border-radius: 24px;
  }

  .selected-seats-container.collapsed {
    transform: none;
  }
}

@media (max-width: 1200px) {
  .seat-map-container {
    padding-right: 0 !important;
  }
}

.select-date-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #666;
}
</style> 