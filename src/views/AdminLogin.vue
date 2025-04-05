<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    if (!email.value || !password.value) {
      error.value = 'E-posta ve şifre alanları zorunludur.'
      return
    }

    const auth = getAuth()
    await signInWithEmailAndPassword(auth, email.value, password.value)
    // Başarılı girişten sonra yönlendirme
    await router.push({ name: 'admin-reservations' })
  } catch (e) {
    console.error('Giriş hatası:', e)
    
    // Firebase hata kodlarına göre özelleştirilmiş mesajlar
    switch (e.code) {
      case 'auth/invalid-email':
        error.value = 'Geçersiz e-posta adresi.'
        break
      case 'auth/user-not-found':
        error.value = 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.'
        break
      case 'auth/wrong-password':
        error.value = 'Hatalı şifre.'
        break
      case 'auth/too-many-requests':
        error.value = 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.'
        break
      default:
        error.value = 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="admin-login">
    <div class="login-container">
      <h2>Admin Girişi</h2>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">E-posta</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="E-posta adresiniz"
            autocomplete="email"
          />
        </div>
        <div class="form-group">
          <label for="password">Şifre</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="Şifreniz"
            autocomplete="current-password"
          />
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1a1a1a;
  padding: 1rem;
}

.login-container {
  background: #2d2d2d;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #e0e0e0;
  margin-bottom: 2rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-size: 0.9rem;
  color: #e0e0e0;
}

input {
  padding: 0.75rem;
  background: #404040;
  border: 1px solid #666;
  border-radius: 4px;
  font-size: 1rem;
  color: #e0e0e0;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

button {
  padding: 0.75rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

button:disabled {
  background: #666;
  cursor: not-allowed;
  opacity: 0.8;
}

.error-message {
  color: #e74c3c;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(231, 76, 60, 0.2);
}
</style> 