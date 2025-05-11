import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, getDoc, orderBy, writeBatch, runTransaction, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// İşlem kilidi için değişken
let isProcessing = false;

export const reservationService = {
  // Yeni rezervasyon oluşturma
  async createReservation(reservationData) {
    try {
      const reservationRef = collection(db, 'reservations');
      const newReservation = {
        ...reservationData,
        status: 'pending',
        createdAt: serverTimestamp(),
        expirationTime: serverTimestamp()
      };
      
      const docRef = await addDoc(reservationRef, newReservation);
      
      // Rezervasyon oluşturulduktan sonra hemen güncelle
      await updateDoc(docRef, {
        id: docRef.id
      });
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Rezervasyon oluşturma hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Kullanıcının mevcut rezervasyonlarını tek seferlik getir
  async getUserReservations(phoneNumber) {
    try {
      const q = query(
        collection(db, 'reservations'),
        where('phoneNumber', '==', phoneNumber),
        where('status', 'in', ['pending', 'approved'])
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Rezervasyonlar kontrol edilirken hata:', error);
      return [];
    }
  },

  // Koltuğun müsaitlik durumunu tek seferlik kontrol et
  async checkSeatAvailability(seatId) {
    try {
      // seatId parametresinin geçerli olup olmadığını kontrol et
      if (!seatId || typeof seatId !== 'object') {
        console.error('Geçersiz koltuk verisi:', seatId);
        return false;
      }

      if (!seatId.id || !seatId.row || !seatId.numericId) {
        console.error('Eksik koltuk bilgisi:', seatId);
        return false;
      }

      const seatFullId = `${seatId.row}-${seatId.numericId}`;

      const q = query(
        collection(db, 'reservations'),
        where('seatFullId', '==', seatFullId),
        where('status', 'in', ['pending', 'approved'])
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Koltuk kontrolü sırasında hata:', error);
      return false;
    }
  },

  // Rezervasyon onayla
  async approveReservation(reservationId) {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'approved',
        approvedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Rezervasyon onaylama hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Rezervasyon reddet
  async cancelReservation(reservationId) {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (!reservationDoc.exists()) {
        throw new Error('Rezervasyon bulunamadı');
      }

      const reservationData = reservationDoc.data();
      
      // Rezervasyonu reddedildi olarak işaretle
      await updateDoc(reservationRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        // Koltukların tekrar seçilebilir olduğunu belirtmek için
        seatStatus: 'available'
      });

      // Koltukların durumunu güncelle
      if (reservationData.seatIds && Array.isArray(reservationData.seatIds)) {
        const batch = writeBatch(db);
        
        // Her bir koltuk için ayrı bir doküman oluştur veya güncelle
        for (const seatId of reservationData.seatIds) {
          const seatRef = doc(db, 'seats', seatId);
          batch.set(seatRef, {
            status: 'available',
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
        
        await batch.commit();
      }

      return { success: true };
    } catch (error) {
      console.error('Rezervasyon reddetme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Süresi dolmuş rezervasyonları temizle
  async cleanExpiredReservations() {
    try {
      const now = Timestamp.now();
      
      // Süresi dolmuş rezervasyonları bul
      const q = query(
        collection(db, 'reservations'),
        where('status', '==', 'pending'),
        where('expirationTime', '<=', now),
        orderBy('expirationTime', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('Temizlenecek süresi dolmuş rezervasyon bulunamadı.');
        return { success: true };
      }

      // Batch işlemi başlat
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Batch işlemini uygula
      await batch.commit();
      console.log(`${querySnapshot.size} adet süresi dolmuş rezervasyon temizlendi.`);
      
      return { success: true };
    } catch (error) {
      if (error.code === 'failed-precondition') {
        console.error('Index oluşturulması gerekiyor. Lütfen Firebase Console\'da gerekli index\'i oluşturun.');
        return {
          success: false,
          error: 'Veritabanı indexi oluşturulması gerekiyor. Lütfen yönetici ile iletişime geçin.'
        };
      }
      
      console.error('Süresi dolmuş rezervasyonlar temizlenirken hata:', error);
      return { 
        success: false, 
        error: 'Süresi dolmuş rezervasyonlar temizlenirken hata oluştu.'
      };
    }
  },

  // Test fonksiyonu
  async testConnection() {
    try {
      const testData = {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '5551234567',
        seatId: 1,
        status: 'pending',
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'reservations'), testData);
      console.log('Test dokümanı oluşturuldu:', docRef.id);
      
      // Test dokümanını sil
      await deleteDoc(docRef);
      console.log('Test dokümanı silindi');
      
      return { success: true, message: 'Firebase bağlantısı başarılı' };
    } catch (error) {
      console.error('Firebase bağlantı testi hatası:', error);
      return { 
        success: false, 
        error: 'Firebase bağlantısı test edilirken bir hata oluştu: ' + error.message 
      };
    }
  }
}; 