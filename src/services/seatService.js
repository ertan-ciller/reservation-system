import { collection, doc, getDoc, setDoc, runTransaction, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export const seatService = {
  // Koltuğun durumunu kontrol et ve kilitle
  async lockSeat(seatId, showDate) {
    const seatRef = doc(db, 'seats', `${showDate}_${seatId}`);
    
    try {
      const result = await runTransaction(db, async (transaction) => {
        const seatDoc = await transaction.get(seatRef);
        
        if (!seatDoc.exists()) {
          // Koltuk daha önce oluşturulmamışsa oluştur
          transaction.set(seatRef, {
            status: 'pending',
            lockedAt: new Date(),
            showDate: showDate
          });
          return { success: true };
        }

        const seatData = seatDoc.data();
        
        // Koltuk müsait değilse hata döndür
        if (seatData.status === 'pending' || seatData.status === 'approved') {
          return { 
            success: false, 
            error: 'Bu koltuk zaten rezerve edilmiş' 
          };
        }

        // Koltuğu kilitle
        transaction.update(seatRef, {
          status: 'pending',
          lockedAt: new Date()
        });

        return { success: true };
      });

      return result;
    } catch (error) {
      console.error('Koltuk kilitleme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Koltuğun kilidini kaldır
  async unlockSeat(seatId, showDate) {
    const seatRef = doc(db, 'seats', `${showDate}_${seatId}`);
    
    try {
      await setDoc(seatRef, {
        status: 'available',
        lockedAt: null
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Koltuk kilidi kaldırma hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Koltuğu rezerve et
  async reserveSeat(seatId, showDate) {
    const seatRef = doc(db, 'seats', `${showDate}_${seatId}`);
    
    try {
      await setDoc(seatRef, {
        status: 'pending',
        showDate: showDate,
        reservedAt: new Date()
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Koltuk rezerve etme hatası:', error);
      return { success: false, error: error.message };
    }
  },

  // Süresi dolmuş kilitleri kontrol et ve kaldır
  // async checkAndRemoveExpiredLocks() {
  //   try {
  //     const now = new Date();
  //     const expirationTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 dakika öncesi
      
  //     const expiredSeats = await getDocs(query(
  //       collection(db, 'seats'),
  //       where('status', '==', 'pending'),
  //       where('lockedAt', '<', expirationTime)
  //     ));
      
  //     if (!expiredSeats.empty) {
  //       const batch = writeBatch(db);
  //       expiredSeats.forEach(doc => {
  //         batch.update(doc.ref, { 
  //           status: 'available',
  //           updatedAt: new Date()
  //         });
  //       });
        
  //       await batch.commit();
  //       //console.log(`${expiredSeats.size} adet süresi dolmuş kilit kaldırıldı`);
  //     }
      
  //     return { success: true };
  //   } catch (error) {
  //     //console.error('Süresi dolmuş kilitleri kaldırma hatası:', error);
  //     return { success: false, error: error.message };
  //   }
  // },

  // Çoklu koltuk kilitleme işlemi
  async lockMultipleSeats(seatIds, showDate) {
    try {
      return await runTransaction(db, async (transaction) => {
        const seatRefs = seatIds.map(seatId => 
          doc(db, 'seats', `${showDate}_${seatId}`)
        );
        
        // Tüm koltukları tek transaction'da kontrol et
        const seatDocs = await Promise.all(
          seatRefs.map(ref => transaction.get(ref))
        );
        
        // Herhangi bir koltuk müsait değilse işlemi iptal et
        for (let i = 0; i < seatDocs.length; i++) {
          const doc = seatDocs[i];
          if (doc.exists()) {
            const seatData = doc.data();
            if (seatData.status === 'pending' || seatData.status === 'approved') {
              throw new Error(`Koltuk ${seatIds[i]} müsait değil`);
            }
          }
        }
        
        // Tüm koltukları tek transaction'da kilitle
        seatRefs.forEach(ref => {
          transaction.set(ref, {
            status: 'pending',
            lockedAt: new Date(),
            showDate: showDate,
            updatedAt: new Date()
          });
        });
        
        return { success: true };
      });
    } catch (error) {
      console.error('Çoklu koltuk kilitleme hatası:', error);
      return { success: false, error: error.message };
    }
  }
}; 