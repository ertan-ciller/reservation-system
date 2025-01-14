import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, getDoc, orderBy, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

// İşlem kilidi için değişken
let isProcessing = false;

export const reservationService = {
  // Yeni rezervasyon oluşturma
  async createReservation(reservationData) {
    // Eğer işlem devam ediyorsa yeni istek alma
    if (isProcessing) {
      return {
        success: false,
        error: 'Lütfen bekleyin, önceki işlem devam ediyor.'
      };
    }

    try {
      isProcessing = true; // İşlemi kilitle

      // Veri kontrolü
      if (!reservationData || !reservationData.seatId || !reservationData.phoneNumber) {
        throw new Error('Geçersiz rezervasyon verisi');
      }

      // Telefon numarasını formatla (başındaki 0'ı kaldır)
      const formattedPhone = reservationData.phoneNumber.replace(/^0+/, '');

      // Tek bir sorgu ile hem koltuk müsaitliğini hem de kullanıcı rezervasyonlarını kontrol et
      const seatFullId = `${reservationData.seatId.row}-${reservationData.seatId.numericId}`;
      
      const reservationsQuery = query(
        collection(db, 'reservations'),
        where('status', 'in', ['pending', 'approved'])
      );
      
      const querySnapshot = await getDocs(reservationsQuery);
      const reservations = querySnapshot.docs.map(doc => doc.data());
      
      // Koltuk müsaitliğini kontrol et
      const isSeatTaken = reservations.some(res => res.seatFullId === seatFullId);
      if (isSeatTaken) {
        throw new Error('Seçilen koltuk başkası tarafından rezerve edilmiş.');
      }

      // Kullanıcının rezervasyon sayısını kontrol et
      const userReservationCount = reservations.filter(res => res.phoneNumber === formattedPhone).length;
      if (userReservationCount >= 5) {
        throw new Error('Bir kullanıcı en fazla 5 koltuk rezerve edebilir.');
      }

      // 3 saatlik süre için son kullanma tarihi
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 3);

      // Rezervasyon verilerini hazırla
      const reservation = {
        firstName: reservationData.firstName,
        lastName: reservationData.lastName,
        phoneNumber: formattedPhone,
        seatId: reservationData.seatId.id,
        seatRow: reservationData.seatId.row,
        seatNumber: reservationData.seatId.numericId,
        seatFullId,
        status: 'pending',
        createdAt: Timestamp.now(),
        expirationTime: Timestamp.fromDate(expirationTime)
      };

      // Rezervasyonu kaydet
      const docRef = await addDoc(collection(db, 'reservations'), reservation);
      
      // Süresi dolmuş rezervasyonları arka planda temizle
      this.cleanExpiredReservations().catch(console.error);

      // Başarılı sonucu döndür
      return { 
        success: true, 
        data: { 
          id: docRef.id,
          ...reservation
        } 
      };
    } catch (error) {
      console.error('Rezervasyon hatası:', error);
      return { 
        success: false, 
        error: error.message || 'Rezervasyon oluşturulurken bir hata oluştu.'
      };
    } finally {
      isProcessing = false; // İşlem kilidini kaldır
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