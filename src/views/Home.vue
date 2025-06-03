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
const isPointerDown = ref(false)
const startPosition = ref({ x: 0, y: 0 })
const scrollPosition = ref({ x: 0, y: 0 })

const totalPrice = computed(() => {
  return selectedSeats.value.reduce((total, seat) => {
    // Koltuk kategorisine göre fiyat belirleme
    let price = 150 // 2. Kategori fiyatı
    if (seat.category === '1') {
      price = 300 // 1. Kategori fiyatı
    }
    return total + price
  }, 0)
})

const handleSeatSelect = async (seat) => {
  if (!selectedDate.value) {
    toastService.warning('Lütfen önce bir tarih seçiniz!');
    return;
  }

  if (selectedSeats.value.length >= 10 && !selectedSeats.value.some(s => s.seatFullId === seat.seatFullId)) {
    toastService.warning('En fazla 10 koltuk seçebilirsiniz!');
    return;
  }

  try {
    // Koltuğun müsaitlik durumunu kontrol et
    const isAvailable = await reservationService.checkSeatAvailability(
      {
        id: seat.seatNumber,
        row: seat.rowLabel,
        numericId: parseInt(seat.seatNumber)
      },
      selectedDate.value
    );

    if (!isAvailable) {
      toastService.error('Bu koltuk müsait değil!');
      return;
    }

    const existingIndex = selectedSeats.value.findIndex(s => s.seatFullId === seat.seatFullId);
    
    if (existingIndex === -1) {
      selectedSeats.value.push(seat);
      showSelectedSeats.value = true;
    } else {
      selectedSeats.value.splice(existingIndex, 1);
    }
  } catch (error) {
    console.error('Koltuk seçimi hatası:', error);
    toastService.error('Koltuk seçimi sırasında bir hata oluştu');
  }
}

const removeSeat = (seat) => {
  const index = selectedSeats.value.findIndex(s => s.seatFullId === seat.seatFullId)
  if (index !== -1) {
    selectedSeats.value.splice(index, 1)
  }
}

const handleReservationClick = async () => {
  if (selectedSeats.value.length === 0) {
    toastService.warning('Lütfen en az bir koltuk seçiniz!')
    return
  }
  const isActiveSession = await reservationService.checkActiveSession(selectedSeats.value.map(seat => seat.seatFullId),selectedDate.value)
  console.log("Seçilen Tarih ",selectedDate);

  if(isActiveSession.length>0){
    toastService.error('Bu koltuklar zaten başka bir kullanıcı tarafından seçildiği için seçilemez! '+isActiveSession.map(seat => seat).join(', '));
    return;
  }else{
    const sessionResult = await reservationService.createSession(selectedSeats.value.map(seat => seat.seatFullId),selectedDate.value)
    if(sessionResult.success){
      isDialogOpen.value = true
    }else{
      toastService.error(sessionResult.error)
    }
  }

  isDialogOpen.value = true
  errorMessage.value = ''
}

const handleDialogClose = () => {
  reservationService.clearSession(selectedSeats.value.map(seat => seat.seatFullId),selectedDate.value)
  isDialogOpen.value = false
  errorMessage.value = ''
}

const handleReservation = async (userInfo) => {
  try {
    if (!selectedDate.value) {
      toastService.error('Lütfen bir tarih seçiniz!');
      return;
    }

    isLoading.value = true;
    errorMessage.value = '';

    const seatIds = selectedSeats.value.map(seat => {
      return {
        row: seat.rowLabel,
        numericId: parseInt(seat.seatNumber),
        id: seat.seatNumber
      };
    });

    const reservationData = {
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phoneNumber: userInfo.phoneNumber,
      email: userInfo.email,
      seatIds: seatIds,
      showDate: selectedDate.value,
      status: 'pending'
    };

    const result = await reservationService.createReservation(reservationData);
    reservationService.clearSession(userInfo.seatFullId,selectedDate.value);
    
    if (result.success) {
      isDialogOpen.value = false;
      selectedSeats.value = [];
      toastService.success('Rezervasyonlarınız başarıyla oluşturuldu!');
    } else {
      errorMessage.value = result.error || 'Bazı rezervasyonlar oluşturulamadı.';
      toastService.error(result.error || 'Bazı rezervasyonlar oluşturulamadı.');
    }
  } catch (error) {
    errorMessage.value = error.message || 'Rezervasyon oluşturulurken bir hata oluştu.';
    toastService.error(error.message || 'Rezervasyon oluşturulurken bir hata oluştu.');
    console.error('Rezervasyon hatası:', error);
  } finally {
    isLoading.value = false;
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

const handleMouseDown = (e) => {
  if (e.button !== 0) return // Sadece sol tıklamayı kabul et
  
  const container = seatMapContainerRef.value
  if (!container) return

  isPointerDown.value = true
  container.style.cursor = 'grabbing'
  container.style.userSelect = 'none'

  const startX = e.pageX - container.offsetLeft
  const startY = e.pageY - container.offsetTop
  const scrollLeft = container.scrollLeft
  const scrollTop = window.pageYOffset

  let lastX = startX
  let lastY = startY
  let rafId = null

  const handleMouseMove = (e) => {
    e.preventDefault()
    
    const x = e.pageX - container.offsetLeft
    const y = e.pageY - container.offsetTop
    
    // Hareket mesafesini hesapla
    const dx = x - lastX
    const dy = y - lastY
    
    // Son pozisyonu güncelle
    lastX = x
    lastY = y

    // RAF ile scroll pozisyonunu güncelle
    if (rafId) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      container.scrollLeft -= dx
      window.scrollBy(0, -dy)
    })
  }

  const handleMouseUp = () => {
    isPointerDown.value = false
    container.style.cursor = 'grab'
    container.style.removeProperty('user-select')
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleBeforeUnload = () => {
  reservationService.clearSession(selectedSeats.value.map(seat => seat.seatFullId),selectedDate.value)
}

onMounted(() => {
  centerSeatMapScroll()
  const container = seatMapContainerRef.value
  if (container) {
    container.addEventListener('mousedown', handleMouseDown)
  }

  // Add beforeunload event listener for browser tab closure
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  const container = seatMapContainerRef.value
  if (container) {
    container.removeEventListener('mousedown', handleMouseDown)
  }
  
  // Clear any active sessions when component is destroyed
  reservationService.clearSession(selectedSeats.value.map(seat => seat.seatFullId), selectedDate.value)


  // Remove beforeunload event listener
  //window.removeEventListener('beforeunload', handleBeforeUnload)
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
      <div v-if="selectedDate" class="seat-map-container" ref="seatMapContainerRef" @mousedown.prevent="handleMouseDown">
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
          <div class="seat-status-list">
            <div class="seat-status-title">Koltuk Durumları</div>
            <div class="seat-status-items">
              <div class="seat-status-item">
                <div class="status-indicator status-blue"></div>
                <span>Seçili Koltuklar</span>
              </div>
              <div class="seat-status-item">
                <div class="status-indicator status-orange"></div>
                <span>Onay Bekleyen</span>
              </div>
              <div class="seat-status-item">
                <div class="status-indicator status-green"></div>
                <span>Onaylanmış</span>
              </div>
            </div>
          </div>
          <div class="price-list">
            <div class="price-item">
              <div class="category-indicator">
                <div class="color-box blue-border"></div>
                <div class="price-info">
                  <span>150,00 ₺</span>
                  <span class="category">2. Kategori</span>
                </div>
              </div>
            </div>
            <div class="price-item">
              <div class="category-indicator">
                <div class="color-box green-border"></div>
                <div class="price-info">
                  <span>300,00 ₺</span>
                  <span class="category">1. Kategori</span>
                </div>
              </div>
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
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  padding: 1rem 0;
  margin: 0 auto;
  box-sizing: border-box;
  cursor: grab;
  user-select: none;
  will-change: transform, scroll-position;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  -webkit-perspective: 1000;
  perspective: 1000;
}

.seat-map-container:active {
  cursor: grabbing;
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
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
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
  transform: translateY(calc(100% - 200px));
}

.selected-seats-container.collapsed .selected-seats-section {
  display: none;
}

.selected-seats-container.collapsed .seat-status-list {
  display: none;
}

.selected-seats-container.collapsed .selected-seats-footer {
  display: none;
}

.seat-status-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.seat-status-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.seat-status-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.seat-status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.status-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.status-blue {
  background-color: #2196f3;
}

.status-orange {
  background-color: #F7B036;
}

.status-green {
  background-color: #4caf50;
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

.category-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-box {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: white;
}

.blue-border {
  border: 2px solid #2196f3;
}

.green-border {
  border: 2px solid #4caf50;
}

.price-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.price-item {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  background: #f5f5f5;
}

.price-item span:first-child {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.category {
  font-size: 14px;
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
  -webkit-tap-highlight-color: transparent;
}

.selected-seat-item:active,
.selected-seat-item:focus {
  background: #F7B036;
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

  .selected-seats-container.collapsed {
    transform: translateY(calc(100% - 160px));
  }

  .price-list {
    padding: 8px 16px;
  }

  .selected-seat-item {
    padding: 4px 10px;
    font-size: 13px;
    background: #F7B036;
    -webkit-tap-highlight-color: transparent;
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