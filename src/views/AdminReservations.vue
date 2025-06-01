<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../services/firebase'
import { reservationService } from '../services/reservationService'

const router = useRouter()
const reservations = ref([])
const searchQuery = ref('')
const isLoading = ref(true)
const error = ref('')

// Koltuk kategorisini belirle
const getSeatCategory = (row, seatNumber) => {
  // A, B, C sıraları tamamen 2. kategori
  if (['A', 'B', 'C'].includes(row)) {
    return 2
  }
  
  // Y sırası için özel kontrol (Y2-Y40 arası 2. kategori)
  if (row === 'Y') {
    const seatNum = parseInt(seatNumber)
    return (seatNum >= 2 && seatNum <= 40) ? 2 : 1
  }

  // Z sırası için özel kontrol (Z2-Z26 arası 2. kategori)
  if (row === 'Z') {
    const seatNum = parseInt(seatNumber)
    return (seatNum >= 2 && seatNum <= 26) ? 2 : 1
  }

  // V sırası için özel kontrol (V1-V8 arası tek ve çift sayılar 2. kategori)
  if (row === 'V') {
    const seatNum = parseInt(seatNumber)
    const secondCategorySeats = [1, 2, 3, 4, 5, 6, 7, 8]
    return secondCategorySeats.includes(seatNum) ? 2 : 1
  }
  if (row === 'U') {
    const seatNum = parseInt(seatNumber)
    const secondCategorySeats = [1, 2, 3, 4, 5, 6, 7, 8]
    return secondCategorySeats.includes(seatNum) ? 2 : 1
  }
  if (row === 'T') {
    const seatNum = parseInt(seatNumber)
    const secondCategorySeats = [1, 2, 3, 4, 5, 6]
    return secondCategorySeats.includes(seatNum) ? 2 : 1
  }
  
  // Diğer tüm koltuklar 1. kategori
  return 1
}

// Koltuk fiyatını hesapla
const calculateSeatPrice = (category) => {
  return category === 1 ? 300 : 150 // 1. kategori 300TL, 2. kategori 150TL
}

// Toplam tutarı hesapla
const calculateTotalAmount = (seats) => {
  return seats.reduce((total, seat) => {
    const category = getSeatCategory(seat.row, seat.id)
    return total + calculateSeatPrice(category)
  }, 0)
}

// Auth kontrolü
onMounted(() => {
  const auth = getAuth()
  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (!user) {
      router.push('/admin')
    }
  })

  // Rezervasyonları dinle
  const q = query(
    collection(db, 'reservations'),
    orderBy('createdAt', 'desc')
  )

  const unsubscribeReservations = onSnapshot(q, (snapshot) => {
    reservations.value = snapshot.docs.map(doc => {
      const data = doc.data()
      // Her koltuğa kategori bilgisi ekle
      const seatsWithCategories = data.seatIds.map(seat => ({
        ...seat,
        category: getSeatCategory(seat.row, seat.id)
      }))
      
      return {
        id: doc.id,
        ...data,
        seatIds: seatsWithCategories,
        totalAmount: calculateTotalAmount(data.seatIds),
        createdAt: data.createdAt?.toDate(),
        expirationTime: data.expirationTime?.toDate()
      }
    })
    isLoading.value = false
  }, (err) => {
    console.error('Rezervasyon dinleme hatası:', err)
    error.value = 'Rezervasyonlar yüklenirken bir hata oluştu.'
    isLoading.value = false
  })

  // Component unmount olduğunda listener'ları kaldır
  return () => {
    unsubscribeAuth()
    unsubscribeReservations()
  }
})

// Çıkış yap
const handleLogout = async () => {
  try {
    await getAuth().signOut()
    router.push('/admin')
  } catch (e) {
    console.error('Çıkış hatası:', e)
  }
}

// Rezervasyon onayla
const handleApprove = async (reservationId) => {
  try {
    await reservationService.approveReservation(reservationId)
  } catch (e) {
    console.error('Onaylama hatası:', e)
  }
}

// Rezervasyon reddet
const handleReject = async (reservationId) => {
  try {
    await reservationService.cancelReservation(reservationId)
  } catch (e) {
    console.error('Reddetme hatası:', e)
  }
}

// Tek bir koltuğu onayla
const handleApproveSeat = async (reservationId, seatId) => {
  try {
    await reservationService.approveSingleSeat(reservationId, seatId)
  } catch (e) {
    console.error('Koltuk onaylama hatası:', e)
  }
}

// Tek bir koltuğu reddet
const handleRejectSeat = async (reservationId, seatId) => {
  try {
    await reservationService.rejectSingleSeat(reservationId, seatId)
  } catch (e) {
    console.error('Koltuk reddetme hatası:', e)
  }
}

// Koltuk durumunu kontrol et
const getSeatStatus = (reservation, seatId) => {
  if (!reservation.seatStatuses) return 'pending'
  return reservation.seatStatuses[seatId] || 'pending'
}

// Koltuk durum sınıfını al
const getSeatStatusClass = (status) => {
  switch (status) {
    case 'approved':
      return 'seat-approved'
    case 'rejected':
      return 'seat-rejected'
    default:
      return 'seat-pending'
  }
}

// Filtrelenmiş rezervasyonlar
const filteredReservations = computed(() => {
  if (!searchQuery.value) return reservations.value

  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return reservations.value

  const searchTerms = query.split(' ').filter(term => term.length > 0)

  return reservations.value.filter(res => {
    const fullName = `${res.firstName} ${res.lastName}`.toLowerCase()
    const phone = (res.phoneNumber || '').toLowerCase()
    
    // Her bir arama terimi için kontrol
    return searchTerms.every(term => {
      // İsim kontrolü
      if (fullName.includes(term)) return true
      
      // Telefon kontrolü
      if (phone.includes(term)) return true
      
      //Gösterim tarihi kontrolü
      if (res.showDate && res.showDate.includes(term)) return true


      // Koltuk numarası kontrolü
      if (res.seatIds && Array.isArray(res.seatIds)) {
        return res.seatIds.some(seat => {
          if (typeof seat === 'object' && seat.row && seat.id) {
            const seatNumber = `${seat.row}-${seat.id}`.toLowerCase()
            return seatNumber.includes(term)
          }
          return false
        })
      }
      
      return false
    })
  })
})

// Tarih formatla fonksiyonunu güncelle
const formatDate = (date, type = 'full') => {
  if (!date) return ''
  
  const options = type === 'full' ? {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  } : {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Date(date).toLocaleString('tr-TR', options)
}

// Para formatla fonksiyonu
const formatCurrency = (amount) => {
  if (!amount) return '0,00 ₺'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount)
}

// Bekleyen koltukları kontrol et
const hasPendingSeats = (reservation) => {
  // Önce genel rezervasyon durumunu kontrol et
  const status = calculateReservationStatus(reservation);
  if (status === 'approved' || status === 'rejected') return false;
  
  // Eğer seatStatuses yoksa ve status approved/rejected değilse, pending olarak kabul et
  if (!reservation.seatStatuses) return true;
  
  // Her bir koltuğun durumunu kontrol et
  return reservation.seatIds.some(seat => {
    const fullSeatId = `${seat.row}-${seat.id}`;
    return !reservation.seatStatuses[fullSeatId] || reservation.seatStatuses[fullSeatId] === 'pending';
  });
}

// Rezervasyon durumunu hesapla
const calculateReservationStatus = (reservation) => {
  if (!reservation.seatStatuses) return reservation.status;

  const statuses = reservation.seatIds.map(seat => {
    const fullSeatId = `${seat.row}-${seat.id}`;
    return reservation.seatStatuses[fullSeatId];
  });

  if (statuses.every(status => status === 'approved')) return 'approved';
  if (statuses.every(status => status === 'rejected')) return 'rejected';
  if (statuses.some(status => !status || status === 'pending')) return 'pending';
  
  // Karışık durum (bazı koltuklar onaylanmış, bazıları reddedilmiş)
  return 'mixed';
}

// Durum metni
const getStatusText = (status) => {
  switch (status) {
    case 'approved':
      return 'ONAYLANDI';
    case 'rejected':
      return 'REDDEDİLDİ';
    case 'mixed':
      return 'KISMEN ONAYLANDI';
    default:
      return 'BEKLİYOR';
  }
}

// Durum etiketi rengi
const getStatusClass = (status) => {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'mixed':
      return 'mixed';
    default:
      return 'pending';
  }
}

// Koltuk bilgilerini formatla
const formatSeatIds = (seatIds) => {
  if (!Array.isArray(seatIds)) return '';
  return seatIds.map(seat => `${seat.row}-${seat.id}`).join(', ');
}
</script>

<template>
  <div class="admin-reservations">
    <header class="header">
      <h1>Rezervasyon Yönetimi</h1>
      <button @click="handleLogout" class="logout-button">
        <span class="icon">🚪</span>
        Çıkış Yap
      </button>
    </header>

    <div class="search-bar">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="İsim, telefon veya koltuk numarası ile ara..."
        />
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="loading-spinner"></div>
      Rezervasyonlar yükleniyor...
    </div>

    <div v-else-if="error" class="error">
      ❌ {{ error }}
    </div>

    <div v-else-if="filteredReservations.length === 0" class="no-results">
      🔍 Rezervasyon bulunamadı.
    </div>

    <div v-else class="reservations-list">
      <!-- Desktop View -->
      <div class="table-responsive desktop-view">
        <table>
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Ad Soyad</th>
              <th>Telefon</th>
              <th>Koltuklar</th>
              <th>Gösterim Tarihi</th>
              <th>Durum</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reservation in filteredReservations" :key="reservation.id">
              <td>{{ formatDate(reservation.createdAt, 'full') }}</td>
              <td class="name-cell">{{ reservation.firstName }} {{ reservation.lastName }}</td>
              <td>{{ reservation.phoneNumber }}</td>
              <td class="seat-cell">
                <div class="seat-management">
                  <div v-for="seat in reservation.seatIds" :key="seat.id" 
                       class="seat-item" 
                       :class="getSeatStatusClass(getSeatStatus(reservation, `${seat.row}-${seat.id}`))">
                    <span class="seat-number">
                      {{ seat.row }}-{{ seat.id }}
                      <span class="seat-category">({{ getSeatCategory(seat.row, seat.id) }}. Kategori)</span>
                    </span>
                    <div class="seat-actions" v-if="getSeatStatus(reservation, `${seat.row}-${seat.id}`) === 'pending'">
                      <button 
                        @click="handleApproveSeat(reservation.id, `${seat.row}-${seat.id}`)"
                        class="seat-action approve"
                        title="Koltuğu Onayla">
                        ✓
                      </button>
                      <button 
                        @click="handleRejectSeat(reservation.id, `${seat.row}-${seat.id}`)"
                        class="seat-action reject"
                        title="Koltuğu Reddet">
                        ✕
                      </button>
                    </div>
                    <span v-else class="seat-status">
                      {{ getSeatStatus(reservation, `${seat.row}-${seat.id}`) === 'approved' ? '✓' : '✕' }}
                    </span>
                  </div>
                </div>
                <div class="total-amount">
                  Toplam Tutar: {{ reservation.totalAmount.toLocaleString('tr-TR') }},00₺
                </div>
              </td>
              <td class="show-date">{{ formatDate(reservation.showDate, 'show') }}</td>
              <td>
                <span :class="['status', getStatusClass(calculateReservationStatus(reservation))]">
                  {{ getStatusText(calculateReservationStatus(reservation)) }}
                </span>
              </td>
              <td class="actions">
                <div class="action-buttons" v-if="hasPendingSeats(reservation)">
                  <button
                    @click="handleApprove(reservation.id)"
                    class="action-btn approve"
                  >
                    Tümünü Onayla
                  </button>
                  <button
                    @click="handleReject(reservation.id)"
                    class="action-btn reject"
                  >
                    Tümünü Reddet
                  </button>
                </div>
                <div v-else class="status-text">
                  <span :class="calculateReservationStatus(reservation) === 'approved' ? 'approved-text' : 'rejected-text'">
                    {{ getStatusText(calculateReservationStatus(reservation)) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile View -->
      <div class="mobile-view">
        <div v-for="reservation in filteredReservations" :key="reservation.id" class="reservation-card">
          <div class="card-header">
            <div class="card-title">
              <h3>{{ reservation.firstName }} {{ reservation.lastName }}</h3>
              <span :class="['status-badge', getStatusClass(calculateReservationStatus(reservation))]">
                {{ getStatusText(calculateReservationStatus(reservation)) }}
              </span>
            </div>
            <div class="card-subtitle">
              <span class="date">📅 {{ formatDate(reservation.showDate, 'show') }}</span>
              <span class="phone">📞 {{ reservation.phoneNumber }}</span>
              <span class="amount">💰 {{ reservation.totalAmount.toLocaleString('tr-TR') }},00₺</span>
            </div>
          </div>
          
          <div class="card-seats">
            <h4>Koltuklar</h4>
            <div class="seat-management">
              <div v-for="seat in reservation.seatIds" :key="seat.id" 
                   class="seat-item" 
                   :class="getSeatStatusClass(getSeatStatus(reservation, `${seat.row}-${seat.id}`))">
                <span class="seat-number">
                  {{ seat.row }}-{{ seat.id }}
                  <span class="seat-category">({{ getSeatCategory(seat.row, seat.id) }}. Kategori)</span>
                </span>
                <div class="seat-actions" v-if="getSeatStatus(reservation, `${seat.row}-${seat.id}`) === 'pending'">
                  <button 
                    @click="handleApproveSeat(reservation.id, `${seat.row}-${seat.id}`)"
                    class="seat-action approve"
                    title="Koltuğu Onayla">
                    ✓
                  </button>
                  <button 
                    @click="handleRejectSeat(reservation.id, `${seat.row}-${seat.id}`)"
                    class="seat-action reject"
                    title="Koltuğu Reddet">
                    ✕
                  </button>
                </div>
                <span v-else class="seat-status">
                  {{ getSeatStatus(reservation, `${seat.row}-${seat.id}`) === 'approved' ? '✓' : '✕' }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-actions" v-if="hasPendingSeats(reservation)">
            <button
              @click="handleApprove(reservation.id)"
              class="action-btn approve"
            >
              Tümünü Onayla
            </button>
            <button
              @click="handleReject(reservation.id)"
              class="action-btn reject"
            >
              Tümünü Reddet
            </button>
          </div>
          <div v-else class="card-status">
            <span :class="calculateReservationStatus(reservation) === 'approved' ? 'approved-text' : 'rejected-text'">
              {{ getStatusText(calculateReservationStatus(reservation)) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-reservations {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #2c3e50;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: #fff;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.logout-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 1rem;
}

.logout-button:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

.search-bar {
  margin-bottom: 1.5rem;
}

.search-wrapper {
  position: relative;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.search-bar input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.search-bar input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Mobile View Styles */
.mobile-view {
  display: none;
}

.reservation-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.card-header {
  margin-bottom: 1rem;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.card-title h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.card-subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.9rem;
  color: #64748b;
}

.card-seats {
  margin-bottom: 1rem;
}

.card-seats h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #64748b;
}

.status-badge {
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .desktop-view {
    display: none;
  }

  .mobile-view {
    display: block;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .logout-button {
    width: 100%;
    justify-content: center;
  }

  .search-bar input {
    font-size: 0.95rem;
    padding: 0.875rem 1rem 0.875rem 2.75rem;
  }

  .card-actions .action-btn {
    width: 100%;
    height: 44px;
    font-size: 0.95rem;
  }

  .seat-management {
    gap: 0.5rem;
  }

  .seat-item {
    flex: 1;
    min-width: calc(50% - 0.25rem);
    justify-content: space-between;
  }

  .seat-action {
    width: 28px;
    height: 28px;
  }
}

/* Keep existing styles for desktop view and common elements */
.table-responsive {
  overflow-x: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  color: #2c3e50;
}

th, td {
  padding: 0.2rem;
  text-align: center;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* Kolon genişlikleri */
th:nth-child(1) { width: 12%; } /* Tarih */
th:nth-child(2) { width: 15%; } /* Ad Soyad */
th:nth-child(3) { width: 10%; } /* Telefon */
th:nth-child(4) { width: 20%; } /* Koltuklar */
th:nth-child(5) { width: 12%; } /* Gösterim Tarihi */
th:nth-child(6) { width: 11%; } /* Durum */
th:nth-child(7) { width: 20%; } /* İşlemler */

.actions {
  width: 20%;
  padding: 0.2rem;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  align-items: center;
  min-height: 40px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  color: #fff;
  min-width: 130px;
  height: 36px;
}

.action-btn.approve {
  background-color: #22c55e;
}

.action-btn.approve:hover {
  background-color: #16a34a;
}

.action-btn.reject {
  background-color: #ef4444;
}

.action-btn.reject:hover {
  background-color: #dc2626;
}

.status-text {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-height: 40px;
}

.approved-text, .rejected-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  min-width: 140px;
  height: 36px;
}

.approved-text {
  color: #166534;
  background-color: #dcfce7;
}

.rejected-text {
  color: #dc2626;
  background-color: #fee2e2;
}

@media (max-width: 1200px) {
  .action-btn {
    min-width: 110px;
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }

  .approved-text, .rejected-text {
    min-width: 120px;
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
}

@media (max-width: 992px) {
  th:nth-child(1) { width: 15%; }
  th:nth-child(2) { width: 15%; }
  th:nth-child(3) { width: 12%; }
  th:nth-child(4) { width: 18%; }
  th:nth-child(5) { width: 12%; }
  th:nth-child(6) { width: 10%; }
  th:nth-child(7) { width: 18%; }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .action-btn {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .table-responsive {
    margin: 0 -1rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table {
    min-width: 900px;
  }

  th, td {
    padding: 0.75rem 0.5rem;
  }
}

.name-cell {
  font-weight: 500;
}

.seat-cell {
  font-family: monospace;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.show-date {
  font-weight: 500;
  color: #1e40af;
  text-align: right;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  white-space: nowrap;
  min-width: fit-content;
  text-align: center;
}

.status.rejected {
  background: #fee2e2;
  color: #dc2626;
}

.status.approved {
  background: #dcfce7;
  color: #166534;
}

.status.pending {
  background: #fef3c7;
  color: #92400e;
}

.status.mixed {
  background: #fef9c3;
  color: #854d0e;
}

.mixed-text {
  color: #854d0e;
  background-color: #fef9c3;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 3rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: #64748b;
  font-size: 1.1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error {
  color: #dc2626;
  background: #fee2e2;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .admin-reservations {
    padding: 1rem;
  }

  .header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  h1 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .header {
    margin: -1rem -1rem 1rem -1rem;
    border-radius: 0;
  }

  .search-bar input {
    font-size: 0.9rem;
    padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  }

  .search-icon {
    left: 0.75rem;
  }

  th {
    display: none;
  }

  td {
    display: grid;
    grid-template-columns: 1fr;
    padding: 0.5rem 0.75rem;
    text-align: right;
  }

  td::before {
    content: attr(data-label);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  tr {
    display: block;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
  }

  .actions {
    justify-content: flex-end;
  }
}

.seat-management {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.seat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.seat-number {
  font-weight: 500;
}

.seat-actions {
  display: flex;
  gap: 0.25rem;
}

.seat-action {
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.75rem;
  color: white;
  transition: all 0.2s ease;
}

.seat-action.approve {
  background-color: #22c55e;
}

.seat-action.approve:hover {
  background-color: #16a34a;
}

.seat-action.reject {
  background-color: #ef4444;
}

.seat-action.reject:hover {
  background-color: #dc2626;
}

.seat-status {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.seat-approved {
  background-color: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}

.seat-rejected {
  background-color: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}

.seat-pending {
  background-color: #fef3c7;
  border-color: #92400e;
  color: #92400e;
}

.seat-category {
  font-size: 0.75rem;
  color: #64748b;
  margin-left: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

/* 2. Kategori (Mavi) */
.seat-category:has(+ span:contains('2')) {
  background-color: rgba(33, 150, 243, 0.1);
  color: #1976d2;
}

/* 1. Kategori (Yeşil) */
.seat-category:has(+ span:contains('1')) {
  background-color: rgba(76, 175, 80, 0.1);
  color: #2e7d32;
}

.total-amount {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e2e8f0;
  font-weight: 600;
  color: #1e40af;
  font-size: 0.95rem;
  text-align: center;
}

.amount {
  color: #1e40af;
  font-weight: 600;
  background-color: #eff6ff;
  padding: 4px 8px;
  border-radius: 6px;
}

@media (max-width: 768px) {
  .seat-category {
    display: block;
    margin: 4px 0 0 0;
  }

  .total-amount {
    text-align: right;
    padding: 0.75rem 0;
    border-top: 1px dashed #e2e8f0;
    margin-top: 0.75rem;
  }

  .card-subtitle .amount {
    display: block;
    width: 100%;
    margin-top: 0.5rem;
    text-align: center;
  }
}
</style> 