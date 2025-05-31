import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, Timestamp, getDoc, orderBy, writeBatch, runTransaction, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { seatService } from './seatService';

// İşlem kilidi için değişken
let isProcessing = false;
let lockCheckInterval = null;

export const reservationService = {
  // Periyodik kilit kontrolünü başlat
  startLockCheck() {
    if (!lockCheckInterval) {
      // Her 1 dakikada bir kilitleri kontrol et
      lockCheckInterval = setInterval(async () => {
        await seatService.checkAndRemoveExpiredLocks();
      }, 60 * 1000);
    }
  },

  // Periyodik kilit kontrolünü durdur
  stopLockCheck() {
    if (lockCheckInterval) {
      clearInterval(lockCheckInterval);
      lockCheckInterval = null;
    }
  },

  // Yeni rezervasyon oluşturma
  async createReservation(reservationData) {
    if (isProcessing) {
      return { success: false, error: 'Başka bir işlem devam ediyor' };
    }

    isProcessing = true;

    try {
      // Tüm koltukları tek seferde kilitle
      const seatIds = reservationData.seatIds.map(seatId => `${seatId.row}-${seatId.numericId}`);
      const lockResult = await seatService.lockMultipleSeats(seatIds, reservationData.showDate);
      
      if (!lockResult.success) {
        return { success: false, error: lockResult.error };
      }

      // Rezervasyon dokümanını oluştur
      const reservationRef = collection(db, 'reservations');
      const newReservation = {
        ...reservationData,
        status: 'pending',
        createdAt: serverTimestamp(),
        expirationTime: Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)) // 5 dakika
      };
      
      const docRef = await addDoc(reservationRef, newReservation);
      return { success: true, id: docRef.id };

    } catch (error) {
      console.error('Rezervasyon oluşturma hatası:', error);
      // Hata durumunda koltukları serbest bırak
      for (const seatId of reservationData.seatIds) {
        const seatFullId = `${seatId.row}-${seatId.numericId}`;
        await seatService.unlockSeat(seatFullId, reservationData.showDate);
      }
      return { success: false, error: error.message };
    } finally {
      isProcessing = false;
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
  async checkSeatAvailability(seatId, showDate) {
    try {
      if (!seatId || typeof seatId !== 'object') {
        console.error('Geçersiz koltuk verisi:', seatId);
        return false;
      }

      if (!seatId.id || !seatId.row || !seatId.numericId || !showDate) {
        console.error('Eksik koltuk bilgisi:', seatId);
        return false;
      }

      const seatFullId = `${showDate}_${seatId.row}-${seatId.numericId}`;
      const seatRef = doc(db, 'seats', seatFullId);
      const seatDoc = await getDoc(seatRef);

      if (!seatDoc.exists()) {
        return true; // Koltuk henüz oluşturulmamışsa müsait kabul et
      }

      const seatData = seatDoc.data();
      return seatData.status === 'available' || !seatData.status;
    } catch (error) {
      console.error('Koltuk müsaitlik kontrolü hatası:', error);
      return false;
    }
  },

  // Rezervasyon onayla
  async approveReservation(reservationId) {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (!reservationDoc.exists()) {
        throw new Error('Rezervasyon bulunamadı');
      }

      const reservationData = reservationDoc.data();
      const seatStatuses = {};

      // Her koltuğu güncelle
      for (const seatId of reservationData.seatIds) {
        const seatFullId = `${seatId.row}-${seatId.id}`;
        const seatRef = doc(db, 'seats', `${reservationData.showDate}_${seatFullId}`);
        
        await setDoc(seatRef, {
          status: 'approved',
          showDate: reservationData.showDate,
          reservedAt: serverTimestamp(),
          reservationId: reservationId
        });

        // Koltuk durumunu kaydet
        seatStatuses[seatFullId] = 'approved';
      }

      // Rezervasyonu güncelle
      await updateDoc(reservationRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
        seatStatuses: seatStatuses
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
      const seatStatuses = {};
      
      // Her koltuğu güncelle
      for (const seatId of reservationData.seatIds) {
        const seatFullId = `${seatId.row}-${seatId.id}`;
        const seatRef = doc(db, 'seats', `${reservationData.showDate}_${seatFullId}`);
        
        // Koltuğu sil (available durumuna getir)
        await deleteDoc(seatRef);

        // Koltuk durumunu kaydet
        seatStatuses[seatFullId] = 'rejected';
      }

      // Rezervasyonu güncelle
      await updateDoc(reservationRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        seatStatuses: seatStatuses
      });

      return { success: true };
    } catch (error) {
      console.error('Rezervasyon reddetme hatası:', error);
      return { success: false, error: error.message };
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
  },

  // Tek bir koltuğu onayla
  async approveSingleSeat(reservationId, seatId) {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (!reservationDoc.exists()) {
        throw new Error('Rezervasyon bulunamadı');
      }

      const reservationData = reservationDoc.data();
      
      // Koltuğu güncelle
      const seatRef = doc(db, 'seats', `${reservationData.showDate}_${seatId}`);
      await setDoc(seatRef, {
        status: 'approved',
        showDate: reservationData.showDate,
        reservedAt: serverTimestamp(),
        reservationId: reservationId
      });

      // Rezervasyonun koltuk durumlarını güncelle
      const seatStatuses = reservationData.seatStatuses || {};
      seatStatuses[seatId] = 'approved';

      await updateDoc(reservationRef, {
        seatStatuses: seatStatuses
      });

      // Tüm koltuklar onaylandıysa rezervasyonu onayla
      const allSeatsApproved = reservationData.seatIds.every(seat => {
        const fullSeatId = `${seat.row}-${seat.id}`;
        return seatStatuses[fullSeatId] === 'approved';
      });

      if (allSeatsApproved) {
        await updateDoc(reservationRef, {
          status: 'approved',
          approvedAt: serverTimestamp()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Koltuk onaylama hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Tek bir koltuğu reddet
  async rejectSingleSeat(reservationId, seatId) {
    try {
      const reservationRef = doc(db, 'reservations', reservationId);
      const reservationDoc = await getDoc(reservationRef);
      
      if (!reservationDoc.exists()) {
        throw new Error('Rezervasyon bulunamadı');
      }

      const reservationData = reservationDoc.data();
      
      // Koltuğu sil (available durumuna getir)
      const seatRef = doc(db, 'seats', `${reservationData.showDate}_${seatId}`);
      await deleteDoc(seatRef);

      // Rezervasyonun koltuk durumlarını güncelle
      const seatStatuses = reservationData.seatStatuses || {};
      seatStatuses[seatId] = 'rejected';

      await updateDoc(reservationRef, {
        seatStatuses: seatStatuses
      });

      // Tüm koltuklar reddedildiyse rezervasyonu reddet
      const allSeatsRejected = reservationData.seatIds.every(seat => {
        const fullSeatId = `${seat.row}-${seat.id}`;
        return seatStatuses[fullSeatId] === 'rejected';
      });

      if (allSeatsRejected) {
        await updateDoc(reservationRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Koltuk reddetme hatası:', error);
      return { success: false, error: error.message };
    }
  }
}; 