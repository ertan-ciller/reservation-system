<script setup>
import { ref, computed } from 'vue'
import { toastService } from '../services/toastService'

const privacyPolicyText = `
<div class="privacy-policy-content">
  <h3>KİŞİSEL VERİLERİN İŞLENMESİNE İLİŞKİN AYDINLATMA METNİ</h3>
  
  <p>İşbu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla, tarafımızca gerçekleştirilen kişisel veri işleme faaliyetlerine ilişkin olarak sizi bilgilendirmek amacıyla hazırlanmıştır.</p>

  <p>1. Veri Sorumlusu<br>
  Kişisel verileriniz, etkinlik rezervasyon sistemimiz kapsamında, veri sorumlusu olarak tarafımızca işlenmektedir.</p>

  <p>2. İşlenen Kişisel Veriler<br>
  Rezervasyon işlemi sırasında ad, soyad ve telefon numarası bilgileriniz alınmaktadır.</p>

  <p>3. Kişisel Verilerin İşlenme Amacı<br>
  Toplanan kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
  <ul>
    <li>Rezervasyon işlemlerinin gerçekleştirilmesi,</li>
    <li>Rezervasyonun tamamlanmaması durumunda sizinle iletişime geçilmesi.</li>
  </ul>

  <p>4. Kişisel Verilerin Aktarımı<br>
  Kişisel verileriniz, yukarıda belirtilen amaçlar dışında üçüncü kişilerle paylaşılmamaktadır.</p>

  <p>5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi<br>
  Kişisel verileriniz, internet sitemiz üzerinden doğrudan sizden alınmak suretiyle elektronik ortamda toplanmaktadır. KVKK'nın 5/2-c maddesi uyarınca, bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması kaydıyla, veri işlemenin gerekli olması hukuki sebebine dayalı olarak işlenmektedir.</p>

  <p>6. Veri Sahibi Olarak Haklarınız<br>
  KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
  <ul>
    <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
    <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,</li>
    <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
    <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,</li>
    <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
    <li>KVKK'ya uygun olarak silinmesini veya yok edilmesini isteme,</li>
    <li>Düzeltme, silme ve yok edilme işlemlerinin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
    <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
    <li>Kişisel verilerinizin kanuna aykırı olarak işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
  </ul>
  <p>Bu haklarınızı kullanmak için bizimle [email veya iletişim adresi] üzerinden iletişime geçebilirsiniz.</p>
</div>
`

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
      props.reservedSeats.push(...reservationData.seatIds)
      emit('close')
    } catch (error) {
      console.error('Rezervasyon hatası:', error)
      toastService.error('Rezervasyon oluşturulurken bir hata oluştu.')
    }
  }
}

const handlePhoneInput = (event) => {
  // Sadece rakamları al
  const numericValue = event.target.value.replace(/\D/g, '')
  // Maximum 10 karakter olacak şekilde güncelle
  formData.value.phone = numericValue.slice(0, 10)
}

const handleNameInput = (event, field) => {
  // Sadece harfleri ve boşlukları al (Türkçe karakterler dahil)
  const letterValue = event.target.value.replace(/\d/g, '')
  // Birden fazla boşluğu tek boşluğa çevir
  const normalizedValue = letterValue.replace(/\s+/g, ' ')
  formData.value[field] = normalizedValue
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
        <div class="seats-container">
          <div class="seats-list">
            <span v-for="seat in selectedSeats" 
                :key="seat.seatFullId"
                class="seat-tag"
                :class="{ 'reserved': reservedSeats.some(reserved => 
                  reserved.id === seat.seatNumber && reserved.row === seat.rowLabel
                )}">
              {{ seat.rowLabel }} - {{ seat.seatNumber }}
            </span>
          </div>
          <div class="total-price">
            Toplam Tutar: <span class="price">{{ totalPrice }}₺</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="reservation-form">
        <div class="form-fields">
          <div class="form-group">
            <label for="firstName">Ad</label>
            <input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              placeholder="Adınız"
              :class="{ 'error': errors.firstName }"
              @input="(e) => handleNameInput(e, 'firstName')"
              pattern="[A-Za-zğüşıöçĞÜŞİÖÇ\s]*"
            />
            <span class="error-message" v-if="errors.firstName">{{ errors.firstName }}</span>
          </div>

          <div class="form-group">
            <label for="lastName">Soyad</label>
            <input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              placeholder="Soyadınız"
              :class="{ 'error': errors.lastName }"
              @input="(e) => handleNameInput(e, 'lastName')"
              pattern="[A-Za-zğüşıöçĞÜŞİÖÇ\s]*"
            />
            <span class="error-message" v-if="errors.lastName">{{ errors.lastName }}</span>
          </div>

          <div class="form-group">
            <label for="phone">Telefon</label>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              placeholder="5XXXXXXXXX"
              maxlength="10"
              :class="{ 'error': errors.phone }"
              @input="handlePhoneInput"
              pattern="[0-9]*"
              inputmode="numeric"
            />
            <span class="error-message" v-if="errors.phone">{{ errors.phone }}</span>
          </div>
        </div>

        <div class="privacy-policy">
          <div class="policy-content" v-html="privacyPolicyText"></div>
        </div>

        <div class="form-footer">
          <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
          <div class="success-message" v-if="successMessage">{{ successMessage }}</div>
          <button type="submit" class="submit-button" :disabled="isLoading">
            {{ isLoading ? 'İşleniyor...' : 'Rezervasyon Yap' }}
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.dialog {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.dialog-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #4a5568;
  padding: 0.5rem;
  margin: -0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f7fafc;
}

.selected-seats-info {
  padding: 1.25rem;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.selected-seats-info h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #2d3748;
}

.seats-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.seats-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.seat-tag {
  background-color: #edf2f7;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #2d3748;
  font-weight: 500;
}

.total-price {
  font-size: 1rem;
  color: #2d3748;
  font-weight: 500;
}

.price {
  color: #3182ce;
  font-weight: 600;
}

.reservation-form {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
  overflow-y: auto;
  max-height: calc(90vh - 200px); /* Dialog height minus header and selected seats */
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: fit-content;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4a5568;
}

.form-group input {
  padding: 0.625rem 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #2d3748;
  background-color: white;
  transition: all 0.2s;
}

.form-group input::placeholder {
  color: #a0aec0;
}

.form-group input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.form-group input.error {
  border-color: #e53e3e;
}

.error-message {
  font-size: 0.75rem;
  color: #e53e3e;
}

.privacy-policy {
  background-color: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
  flex: 1;
  min-height: 250px;
  display: flex;
  flex-direction: column;
}

.policy-content {
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem;
  font-size: 0.813rem;
  line-height: 1.6;
  color: #4a5568;
  text-align: left;
  max-height: 250px;
}

.policy-content::-webkit-scrollbar {
  width: 8px;
}

.policy-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.policy-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.policy-content::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.policy-content :deep(h3) {
  color: #1a202c;
  font-size: 0.938rem;
  font-weight: 600;
  margin: 0 0 1.25rem 0;
  text-align: left;
}

.policy-content :deep(p) {
  margin: 0.875rem 0;
}

.policy-content :deep(ul) {
  list-style: none;
  padding: 0;
  margin: 0.75rem 0;
}

.policy-content :deep(li) {
  padding-left: 1.125rem;
  position: relative;
  margin: 0.375rem 0;
}

.policy-content :deep(li)::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #3182ce;
}

.form-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
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
  .dialog-overlay {
    padding: 0;
  }

  .dialog {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }

  .reservation-form {
    padding: 1rem;
    max-height: calc(100vh - 180px); /* Adjust for mobile header height */
    gap: 1rem;
  }

  .form-fields {
    gap: 0.875rem;
  }

  .privacy-policy {
    margin: 0.75rem 0;
    min-height: 300px;
    max-height: 400px;
  }

  .policy-content {
    font-size: 0.875rem;
    padding: 1.25rem;
    line-height: 1.7;
    max-height: none;
    height: auto;
  }

  .policy-content :deep(h3) {
    font-size: 1rem;
    margin: 0 0 1.25rem 0;
  }

  .policy-content :deep(p) {
    margin: 1rem 0;
  }

  .policy-content :deep(li) {
    padding-left: 1.25rem;
    margin: 0.5rem 0;
  }

  .policy-content :deep(ul) {
    margin: 0.875rem 0;
  }

  .form-footer {
    position: sticky;
    bottom: 0;
    background: white;
    padding-top: 1rem;
    margin-top: 1rem;
    border-top: 1px solid #e2e8f0;
    z-index: 10;
  }
}
</style> 