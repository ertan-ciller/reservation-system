import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyAGHmMkfb5JqFTkr90zYW_UpH4gBr0SkTY",
  authDomain: "reservation-system-de85c.firebaseapp.com",
  databaseURL: "https://reservation-system-de85c-default-rtdb.firebaseio.com",
  projectId: "reservation-system-de85c",
  storageBucket: "reservation-system-de85c.firebasestorage.app",
  messagingSenderId: "218327963213",
  appId: "1:218327963213:web:b27b69bc000660f158ae04",
  measurementId: "G-5ZNHE3FV4H"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore instance'ını oluştur
const db = getFirestore(app);

// Bağlantı durumunu kontrol et
let isOnline = true;

// Offline persistence'ı etkinleştir
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.error('Birden fazla sekme açık olduğu için offline persistence etkinleştirilemedi');
    } else if (err.code === 'unimplemented') {
      console.error('Tarayıcınız offline persistence desteklemiyor');
    }
  });
} catch (error) {
  console.error('Offline persistence hatası:', error);
}

// Online/Offline durumunu dinle
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

export { db, isOnline }; 