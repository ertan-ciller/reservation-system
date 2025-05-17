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
    reservations.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      expirationTime: doc.data().expirationTime?.toDate()
    }))
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

// Filtrelenmiş rezervasyonlar
const filteredReservations = computed(() => {
  if (!searchQuery.value) return reservations.value

  const query = searchQuery.value.toLowerCase()
  const searchTerms = query.split(' ')

  return reservations.value.filter(res => {
    const fullName = `${res.firstName} ${res.lastName}`.toLowerCase()
    
    // Tam eşleşme kontrolü
    if (fullName === query) return true
    
    // Her bir kelime için ayrı kontrol
    const matchesAllTerms = searchTerms.every(term => 
      fullName.includes(term) ||
      res.phoneNumber?.includes(term) ||
      // Koltuk numaralarında arama
      res.seatIds?.some(seatId => seatId.toLowerCase().includes(term))
    )
    
    return matchesAllTerms
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

// Durum etiketi rengi
const getStatusClass = (status) => {
  switch (status) {
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    default:
      return 'pending'
  }
}

// Durum metni
const getStatusText = (status) => {
  switch (status) {
    case 'approved':
      return 'ONAYLANDI'
    case 'rejected':
      return 'REDDEDİLDİ'
    default:
      return 'Bekliyor'
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
      <div class="table-responsive">
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
                <div class="seat-list">
                  {{ formatSeatIds(reservation.seatIds) }}
                </div>
              </td>
              <td class="show-date">{{ formatDate(reservation.showDate, 'show') }}</td>
              <td>
                <span :class="['status', getStatusClass(reservation.status)]">
                  {{ getStatusText(reservation.status) }}
                </span>
              </td>
              <td class="actions">
                <div class="action-buttons" v-if="reservation.status === 'pending'">
                  <button
                    @click="handleApprove(reservation.id)"
                    class="action-btn approve"
                  >
                    Onayla
                  </button>
                  <button
                    @click="handleReject(reservation.id)"
                    class="action-btn reject"
                  >
                    Reddet
                  </button>
                </div>
                <div v-else>
                  <span class="approved-text">
                    {{ reservation.status === 'approved' ? 'İşlem Tamamlandı' : 'Rezervasyon Reddedildi' }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-reservations {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  color: #2c3e50;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: #fff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  margin: 0;
  font-size: 1.8rem;
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
}

.logout-button:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

.search-bar {
  margin-bottom: 2rem;
}

.search-wrapper {
  position: relative;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  table-layout: fixed;
}

th, td {
  padding: 1.25rem 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

th:nth-child(1) {
  width: 15%;
}

th:nth-child(2) {
  width: 15%;
}

th:nth-child(3) {
  width: 12%;
}

th:nth-child(4) {
  width: 18%;
}

th:nth-child(5) {
  width: 15%;
}

th:nth-child(6) {
  width: 10%;
}

th:nth-child(7) {
  width: 15%;
}

th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

tr:last-child td {
  border-bottom: none;
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

.actions {
  width: 100%;
  min-height: 38px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  min-height: 38px;
  width: 100%;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  color: #fff;
}

.approve {
  background-color: #22c55e;
}

.approve:hover {
  background-color: #16a34a;
}

.reject {
  background-color: #ef4444;
}

.reject:hover {
  background-color: #dc2626;
}

.approved-text {
  display: inline-block;
  color: #166534;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 4px 8px;
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

@media (max-width: 768px) {
  .table-responsive {
    margin: 0 -1rem;
    border-radius: 0;
  }

  table {
    font-size: 0.9rem;
  }

  th, td {
    padding: 0.75rem;
  }

  .action-buttons {
    flex-direction: row;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1;
    padding: 6px 12px;
    font-size: 0.875rem;
  }

  .status {
    padding: 3px 8px;
    font-size: 0.7rem;
  }

  .seat-list {
    flex-direction: column;
    gap: 2px;
  }
  
  .seat-tag {
    display: inline-block;
    margin: 1px 0;
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

.seat-list {
  display: inline;
  color: #1e40af;
  font-weight: 500;
}

.seat-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}
</style> 