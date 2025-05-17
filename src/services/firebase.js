import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyAGHmMkfb5JqFTkr90zYW_UpH4gBr0SkTY",
  authDomain: "reservation-system-de85c.firebaseapp.com",
  projectId: "reservation-system-de85c",
  storageBucket: "reservation-system-de85c.appspot.com",
  messagingSenderId: "218327963213",
  appId: "1:218327963213:web:b27b69bc000660f158ae04"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore ve Auth instance'larını oluştur
const db = getFirestore(app);
const auth = getAuth(app);

// Offline persistence'ı etkinleştir
const initializeOfflinePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db, {
      synchronizeTabs: true
    });
    console.log('Offline persistence başarıyla etkinleştirildi');
  } catch (err) {
    if (err.code == 'failed-precondition') {
      // Birden fazla sekme açık
      console.warn('Offline persistence etkinleştirilemedi: Birden fazla sekme açık');
    } else if (err.code == 'unimplemented') {
      // Tarayıcı desteklemiyor
      console.warn('Offline persistence desteklenmiyor');
    }
  }
};

// Initialize offline persistence
initializeOfflinePersistence();

// Bağlantı durumunu kontrol et
let isOnline = true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Online duruma geçildi');
    isOnline = true;
  });
  
  window.addEventListener('offline', () => {
    console.log('Offline duruma geçildi');
    isOnline = false;
  });
}

// Bağlantı durumunu kontrol et ve konsola yaz
console.log('Firebase bağlantısı başlatıldı');
console.log('Firestore veritabanı:', db ? 'Bağlandı' : 'Bağlanamadı');
console.log('Online durumu:', isOnline ? 'Bağlı' : 'Bağlı değil');

export { db, auth, isOnline }; 