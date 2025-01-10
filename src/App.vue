<script setup>
import { ref } from 'vue'
import SeatMap from './components/SeatMap.vue'
import ReservationDialog from './components/ReservationDialog.vue'

const selectedSeat = ref(null)
const isDialogOpen = ref(false)

const handleSeatSelect = (seatNumber) => {
  selectedSeat.value = seatNumber
  isDialogOpen.value = true
}

const handleDialogClose = () => {
  isDialogOpen.value = false
  selectedSeat.value = null
}

const handleReservation = (userInfo) => {
  // Here we'll handle the reservation data
  console.log('Reservation made:', { seat: selectedSeat.value, ...userInfo })
  isDialogOpen.value = false
  selectedSeat.value = null
}
</script>

<template>
  <div class="app">
    <header>
      <h1>Gösteri Rezervasyon Sistemi</h1>
    </header>
    
    <main>
      <SeatMap @seat-select="handleSeatSelect" />
      
      <ReservationDialog
        v-if="isDialogOpen"
        :seat-number="selectedSeat"
        @close="handleDialogClose"
        @submit="handleReservation"
      />
    </main>
  </div>
</template>

<style>
.app {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0.5rem;
  overflow: visible;
}

header {
  text-align: center;
  margin-bottom: 1rem;
  padding: 0 1rem;
}

main {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0;
  overflow: visible;
}

@media screen and (max-width: 768px) {
  .app {
    padding: 0.25rem;
  }

  header {
    margin-bottom: 0.5rem;
  }

  h1 {
    font-size: 2rem;
  }
}

@media screen and (max-width: 480px) {
  h1 {
    font-size: 1.5rem;
  }
}
</style>
