import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, getDoc, orderBy, writeBatch, runTransaction, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// İşlem kilidi için değişken
let isProcessing = false;

export const reservationService = {
  // Yeni rezervasyon oluşturma
  async createReservation(reservationData) {
    try {
      // Veri kontrolü
      if (!reservationData || !reservationData.seatIds || !reservationData.phoneNumber) {
        throw new Error('Geçersiz rezervasyon verisi');
      }

      // Telefon numarasını formatla (başındaki 0'ı kaldır)
      const formattedPhone = reservationData.phoneNumber.replace(/^0+/, '');
      
      // Batch işlemi başlat
      const batch = writeBatch(db);
      const results = [];
      
      // Kullanıcının mevcut rezervasyon sayısını kontrol et
      const userReservationsQuery = query(
        collection(db, 'reservations'),
        where('phoneNumber', '==', formattedPhone),
        where('status', 'in', ['pending', 'approved'])
      );
      
      const userReservationsSnapshot = await getDocs(userReservationsQuery);
      const currentReservationCount = userReservationsSnapshot.size;
      
      // Kullanıcının toplam rezervasyon sayısını kontrol et
      if (currentReservationCount + reservationData.seatIds.length > 10) {
        throw new Error('Bir kullanıcı en fazla 10 koltuk rezerve edebilir.');
      }
      
      // Her koltuk ID'sini ayrı ayrı işle
      for (const seatFullId of reservationData.seatIds) {
        try {
          // Koltuk bilgilerini ayrıştır - örnek format: 'A-12'
          const seatParts = seatFullId.split('-');
          if (seatParts.length !== 2) {
            throw new Error(`Geçersiz koltuk formatı: ${seatFullId}`);
          }
          
          const seatRow = seatParts[0];
          const seatNumber = parseInt(seatParts[1], 10);
          
          // Koltuk müsaitliğini kontrol et
          const reservedSeatsQuery = query(
            collection(db, 'reservations'),
            where('seatFullId', '==', seatFullId),
            where('status', 'in', ['pending', 'approved'])
          );
          
          const reservedSeatsSnapshot = await getDocs(reservedSeatsQuery);
          
          if (!reservedSeatsSnapshot.empty) {
            throw new Error(`Koltuk ${seatFullId} başkası tarafından rezerve edilmiş.`);
          }
          
          // 3 saatlik süre için son kullanma tarihi
          const expirationTime = new Date();
          expirationTime.setHours(expirationTime.getHours() + 3);
          
          // Rezervasyon verilerini hazırla
          const reservation = {
            firstName: reservationData.firstName,
            lastName: reservationData.lastName,
            phoneNumber: formattedPhone,
            seatRow: seatRow,
            seatNumber: seatNumber,
            seatFullId: seatFullId,
            status: 'pending',
            createdAt: Timestamp.now(),
            expirationTime: Timestamp.fromDate(expirationTime)
          };
          
          // Yeni bir döküman referansı oluştur
          const newReservationRef = doc(collection(db, 'reservations'));
          
          // Batch'e ekle
          batch.set(newReservationRef, reservation);
          
          results.push({
            id: newReservationRef.id,
            seatFullId: seatFullId
          });
        } catch (error) {
          console.error(`Koltuk ${seatFullId} için hata:`, error);
          throw error;
        }
      }
      
      // Batch işlemini commit et
      await batch.commit();
      
      // Süresi dolmuş rezervasyonları arka planda temizle
      this.cleanExpiredReservations().catch(console.error);
      
      return { 
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Rezervasyon hatası:', error);
      return { 
        success: false, 
        error: error.message || 'Rezervasyon oluşturulurken bir hata oluştu.'
      };
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

  // Rezervasyonu onayla (Admin)
  async approveReservation(reservationId) {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'approved',
        updatedAt: Timestamp.now()
      });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: 'Rezervasyon onaylanırken bir hata oluştu.'
      };
    }
  },

  // Rezervasyonu iptal et
  async cancelReservation(reservationId) {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      await deleteDoc(reservationRef);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: 'Rezervasyon iptal edilirken bir hata oluştu.'
      };
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