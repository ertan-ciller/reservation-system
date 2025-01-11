<script setup>
import { ref } from 'vue'

const emit = defineEmits(['seat-select'])

// Define the seating sections
const sections = {
  leftFront: {
    rows: 12,
    seatsPerRow: 12,
    angle: 18,
    startNumber: 2,
    startRow: 'A',
    increment: 2,
    rowLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  },
  leftBack: {
    rows: 11,
    seatsPerRow: 10,
    angle: 18,
    startNumber: 2,
    startRow: 'M',
    increment: 2,
    skipRows: ['Q', 'W', 'X'],
    rowLetters: ['M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z']
  },
  centerFront: {
    rows: 12,
    seatsPerRow: 15,
    angle: 0,
    startNumber: 22,
    startRow: 'A',
    increment: 1,
    rowLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  },
  centerBack: {
    rows: 11,
    seatsPerRow: 15,
    angle: 0,
    startNumber: 502,
    startRow: 'M',
    increment: 1,
    skipRows: ['Q', 'W', 'X'],
    rowLetters: ['M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z']
  },
  rightFront: {
    rows: 12,
    seatsPerRow: 15,
    angle: -18,
    startNumber: 1,
    startRow: 'A',
    increment: 1,
    rowLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  },
  rightBack: {
    rows: 11,
    seatsPerRow: 20,
    angle: -18,
    startNumber: 1,
    startRow: 'M',
    increment: 2,
    skipRows: ['Q', 'W', 'X'],
    rowLetters: ['M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'Y', 'Z']
  }
}

const generateSeats = (section) => {
  if (!section) return []
  
  const seats = []
  let seatNumber = section.startNumber
  let currentRow = section.startRow.charCodeAt(0)
  let rowIndex = 0
  
  for (let row = 0; row < section.rows; row++) {
    const rowSeats = []
    let currentRowLetter = section.rowLetters ? section.rowLetters[rowIndex] : String.fromCharCode(currentRow)

    // Özel sıra listesi varsa indeksi artır
    if (section.rowLetters) {
      rowIndex++
    } else {
      // Atlanacak sıraları kontrol et
      if (section.skipRows && section.skipRows.includes(currentRowLetter)) {
        currentRow++
        currentRowLetter = String.fromCharCode(currentRow)
      }
      currentRow++
    }

    // Orta blok A ve B sıraları için özel numaralandırma
    if (section === sections.centerFront && (currentRowLetter === 'A' || currentRowLetter === 'B')) {
      // İlk 8 koltuk için çift sayılar (22'den 36'ya)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 22 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Sonraki 8 koltuk için tek sayılar (35'ten 21'e)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 35 - (i * 2),
          row: currentRowLetter,
          seat: i + 9,
          reserved: false
        })
      }
    }
    // Orta blok C, D ve E sıraları için özel numaralandırma
    else if (section === sections.centerFront && (currentRowLetter === 'C' || currentRowLetter === 'D' || currentRowLetter === 'E')) {
      // İlk 8 koltuk için çift sayılar (24'ten 38'e)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 24 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // 39 numaralı koltuk
      rowSeats.push({
        id: 39,
        row: currentRowLetter,
        seat: 9,
        reserved: false
      })
      // 37 numaralı koltuk
      rowSeats.push({
        id: 37,
        row: currentRowLetter,
        seat: 10,
        reserved: false
      })
      // Sonraki 7 koltuk için tek sayılar (35'ten 23'e)
      for (let i = 0; i < 7; i++) {
        rowSeats.push({
          id: 35 - (i * 2),
          row: currentRowLetter,
          seat: i + 11,
          reserved: false
        })
      }
    }
    // Orta blok G ve H sıraları için özel numaralandırma
    else if (section === sections.centerFront && (currentRowLetter === 'G' || currentRowLetter === 'H')) {
      // İlk 9 koltuk için çift sayılar (28'den 44'e)
      for (let i = 0; i < 9; i++) {
        rowSeats.push({
          id: 28 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // 45 numaralı koltuk
      rowSeats.push({
        id: 45,
        row: currentRowLetter,
        seat: 10,
        reserved: false
      })
      // Sonraki 9 koltuk için tek sayılar (43'ten 27'ye)
      for (let i = 0; i < 9; i++) {
        rowSeats.push({
          id: 43 - (i * 2),
          row: currentRowLetter,
          seat: i + 11,
          reserved: false
        })
      }
    }
    // Orta blok F sırası için özel numaralandırma
    else if (section === sections.centerFront && currentRowLetter === 'F') {
      // İlk 10 koltuk için çift sayılar (26'dan 44'e)
      for (let i = 0; i < 10; i++) {
        rowSeats.push({
          id: 26 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // 45 numaralı koltuk
      rowSeats.push({
        id: 45,
        row: currentRowLetter,
        seat: 11,
        reserved: false
      })
      // Sonraki 10 koltuk için tek sayılar (43'ten 25'e)
      for (let i = 0; i < 10; i++) {
        rowSeats.push({
          id: 43 - (i * 2),
          row: currentRowLetter,
          seat: i + 12,
          reserved: false
        })
      }
    }
    // Orta blok I ve J sıraları için özel numaralandırma
    else if (section === sections.centerFront && (currentRowLetter === 'I' || currentRowLetter === 'J')) {
      // İlk 8 koltuk için çift sayılar (30'dan 44'e)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 30 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 4 koltuk
      const middleSeats = [46, 48, 47, 45]
      for (let i = 0; i < 4; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 9,
          reserved: false
        })
      }
      // Son 8 koltuk için tek sayılar (43'ten 29'a)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 43 - (i * 2),
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
    }
    // Orta blok K sırası için özel numaralandırma
    else if (section === sections.centerFront && currentRowLetter === 'K') {
      // İlk 8 koltuk için çift sayılar (30'dan 44'e)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 30 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 4 koltuk
      const middleSeats = [46, 48, 47, 45]
      for (let i = 0; i < 4; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 9,
          reserved: false
        })
      }
      // Son 8 koltuk için tek sayılar (43'ten 31'e)
      for (let i = 0; i < 7; i++) {
        rowSeats.push({
          id: 43 - (i * 2),
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
      // Son koltuk 31
      rowSeats.push({
        id: 31,
        row: currentRowLetter,
        seat: 20,
        reserved: false
      })
    }
    // Orta blok L sırası için özel numaralandırma
    else if (section === sections.centerFront && currentRowLetter === 'L') {
      // İlk 9 koltuk için çift sayılar (32'den 48'e)
      for (let i = 0; i < 9; i++) {
        rowSeats.push({
          id: 32 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 3 koltuk
      const middleSeats = [50, 51, 49]
      for (let i = 0; i < 3; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 10,
          reserved: false
        })
      }
      // Son 9 koltuk için tek sayılar (47'ten 31'e)
      for (let i = 0; i < 9; i++) {
        rowSeats.push({
          id: 47 - (i * 2),
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
    }
    // Sol ön blok için özel koltuk sayıları
    else if (section === sections.leftFront) {
      const currentRowLetter = section.rowLetters ? section.rowLetters[rowIndex - 1] : String.fromCharCode(currentRow)
      let maxSeatNumber
      let startNumber = 2
      
      if (currentRowLetter === 'A' || currentRowLetter === 'B') {
        maxSeatNumber = 20
      } else if (currentRowLetter === 'C' || currentRowLetter === 'D' || currentRowLetter === 'E') {
        maxSeatNumber = 22
      } else if (currentRowLetter === 'F') {
        maxSeatNumber = 24
      } else if (currentRowLetter === 'G' || currentRowLetter === 'H') {
        maxSeatNumber = 26
      } else if (currentRowLetter === 'I' || currentRowLetter === 'J' || currentRowLetter === 'K') {
        maxSeatNumber = 28
      } else if (currentRowLetter === 'L') {
        maxSeatNumber = 30
      } else {
        maxSeatNumber = 20
      }
      
      for (let seatNum = startNumber; seatNum <= maxSeatNumber; seatNum += 2) {
        rowSeats.push({
          id: seatNum,
          row: currentRowLetter,
          seat: (seatNum - startNumber) / 2 + 1,
          reserved: false
        })
      }
    }
    // Sağ ön blok için özel numaralandırma
    else if (section === sections.rightFront) {
      const currentRowLetter = section.rowLetters ? section.rowLetters[rowIndex - 1] : String.fromCharCode(currentRow)
      let startNumber, endNumber, totalSeats
      
      // A ve B sıraları: 1-19 arası, 10 koltuk
      if (currentRowLetter === 'A' || currentRowLetter === 'B') {
        startNumber = 19
        endNumber = 1
        totalSeats = 10
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: startNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // C ve D sıraları: 1-21 arası, 11 koltuk
      else if (currentRowLetter === 'C' || currentRowLetter === 'D') {
        startNumber = 21
        endNumber = 1
        totalSeats = 11
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: startNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // E ve F sıraları: 1-23 arası, 12 koltuk
      else if (currentRowLetter === 'E' || currentRowLetter === 'F') {
        startNumber = 23
        endNumber = 1
        totalSeats = 12
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: startNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // G ve H sıraları: 1-25 arası, 13 koltuk
      else if (currentRowLetter === 'G' || currentRowLetter === 'H') {
        startNumber = 25
        endNumber = 1
        totalSeats = 13
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: startNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // I ve J sıraları: 1-27 arası, 14 koltuk
      else if (currentRowLetter === 'I' || currentRowLetter === 'J') {
        startNumber = 27
        endNumber = 1
        totalSeats = 14
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: startNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // K ve L sıraları: 1-29 arası, 15 koltuk
      else if (currentRowLetter === 'K' || currentRowLetter === 'L') {
        startNumber = 29
        endNumber = 1
        totalSeats = 15
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: startNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
    }
    // Sağ arka blok için özel numaralandırma
    else if (section === sections.rightBack) {
      const currentRowLetter = section.rowLetters ? section.rowLetters[rowIndex - 1] : String.fromCharCode(currentRow)
      
      // M sırası: 1-23 arası, 12 koltuk
      if (currentRowLetter === 'M') {
        const totalSeats = 12
        const maxNumber = 23
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // N sırası: 1-25 arası, 13 koltuk
      else if (currentRowLetter === 'N') {
        const totalSeats = 13
        const maxNumber = 25
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // O sırası: 1-25 arası, 13 koltuk
      else if (currentRowLetter === 'O') {
        const totalSeats = 13
        const maxNumber = 25
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // P sırası: 1-27 arası, 14 koltuk
      else if (currentRowLetter === 'P') {
        const totalSeats = 14
        const maxNumber = 27
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // R sırası: 1-27 arası, 14 koltuk
      else if (currentRowLetter === 'R') {
        const totalSeats = 14
        const maxNumber = 27
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // S sırası: 1-29 arası, 15 koltuk
      else if (currentRowLetter === 'S') {
        const totalSeats = 15
        const maxNumber = 29
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // T sırası: 1-35 arası, 18 koltuk
      else if (currentRowLetter === 'T') {
        const totalSeats = 18
        const maxNumber = 35
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // U sırası: 1-37 arası, 19 koltuk
      else if (currentRowLetter === 'U') {
        const totalSeats = 19
        const maxNumber = 37
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // V sırası: 1-37 arası, 19 koltuk
      else if (currentRowLetter === 'V') {
        const totalSeats = 19
        const maxNumber = 37
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // Y sırası: 1-39 arası, 20 koltuk
      else if (currentRowLetter === 'Y') {
        const totalSeats = 20
        const maxNumber = 39
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // Z sırası: 1-35 arası, 18 koltuk
      else if (currentRowLetter === 'Z') {
        const totalSeats = 18
        const maxNumber = 35
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: maxNumber - (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // Y sırası için özel numaralandırma
      else if (currentRowLetter === 'Y') {
        // Sağdan sola 1'den 39'a kadar 20 koltuk
        for (let i = 0; i < 20; i++) {
          rowSeats.push({
            id: i * 2 + 1, // 1, 3, 5, ..., 39
            row: currentRowLetter,
            seat: 20 - i, // Sağdan sola numaralandırma
            reserved: false
          })
        }
      }
      // Z sırası için özel numaralandırma
      else if (currentRowLetter === 'Z') {
        // Sağdan sola 1'den 35'e kadar 18 koltuk
        for (let i = 0; i < 18; i++) {
          rowSeats.push({
            id: i * 2 + 1, // 1, 3, 5, ..., 35
            row: currentRowLetter,
            seat: 18 - i, // Sağdan sola numaralandırma
            reserved: false
          })
        }
      }
    }
    // Sol arka blok için özel numaralandırma
    else if (section === sections.leftBack) {
      const currentRowLetter = section.rowLetters ? section.rowLetters[rowIndex - 1] : String.fromCharCode(currentRow)
      
      // M sırası: 2-24 arası, 12 koltuk
      if (currentRowLetter === 'M') {
        const totalSeats = 12
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // N sırası: 2-26 arası, 13 koltuk
      else if (currentRowLetter === 'N') {
        const totalSeats = 13
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // O sırası: 2-26 arası, 13 koltuk
      else if (currentRowLetter === 'O') {
        const totalSeats = 13
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // P sırası: 2-28 arası, 14 koltuk
      else if (currentRowLetter === 'P') {
        const totalSeats = 14
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // R sırası: 2-28 arası, 14 koltuk
      else if (currentRowLetter === 'R') {
        const totalSeats = 14
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // S sırası: 2-30 arası, 15 koltuk
      else if (currentRowLetter === 'S') {
        const totalSeats = 15
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // T sırası: 2-36 arası, 18 koltuk
      else if (currentRowLetter === 'T') {
        const totalSeats = 18
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // U sırası: 2-38 arası, 19 koltuk
      else if (currentRowLetter === 'U') {
        const totalSeats = 19
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // V sırası: 2-38 arası, 19 koltuk
      else if (currentRowLetter === 'V') {
        const totalSeats = 19
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // Y sırası: 2-40 arası, 20 koltuk
      else if (currentRowLetter === 'Y') {
        const totalSeats = 20
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
      // Z sırası: 2-36 arası, 18 koltuk
      else if (currentRowLetter === 'Z') {
        const totalSeats = 18
        for (let i = 0; i < totalSeats; i++) {
          rowSeats.push({
            id: 2 + (i * 2),
            row: currentRowLetter,
            seat: i + 1,
            reserved: false
          })
        }
      }
    }
    // Orta arka blok M ve N sıraları için özel numaralandırma
    else if (section === sections.centerBack && currentRowLetter === 'M') {
      // İlk 11 koltuk için çift sayılar (26'dan 46'ya)
      for (let i = 0; i < 11; i++) {
        rowSeats.push({
          id: 26 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 3 koltuk (45, 43, 41)
      const middleSeats = [45, 43, 41]
      for (let i = 0; i < 3; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 12,
          reserved: false
        })
      }
      // Son 8 koltuk için tek sayılar (39'dan 25'e)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 39 - (i * 2),
          row: currentRowLetter,
          seat: i + 15,
          reserved: false
        })
      }
    }
    // N ve O sıraları için özel numaralandırma
    else if (section === sections.centerBack && (currentRowLetter === 'N' || currentRowLetter === 'O')) {
      // İlk 11 koltuk için çift sayılar (28'den 48'e)
      for (let i = 0; i < 11; i++) {
        rowSeats.push({
          id: 28 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 4 koltuk (49, 47, 45, 43)
      const middleSeats = [49, 47, 45, 43]
      for (let i = 0; i < 4; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 12,
          reserved: false
        })
      }
      // Son 8 koltuk için tek sayılar (41'den 27'ye)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 41 - (i * 2),
          row: currentRowLetter,
          seat: i + 16,
          reserved: false
        })
      }
    }
    // P ve R sıraları için özel numaralandırma
    else if (section === sections.centerBack && (currentRowLetter === 'P' || currentRowLetter === 'R')) {
      // İlk 11 koltuk için çift sayılar (30'dan 50'ye)
      for (let i = 0; i < 11; i++) {
        rowSeats.push({
          id: 30 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 4 koltuk (51, 49, 47, 45)
      const middleSeats = [51, 49, 47, 45]
      for (let i = 0; i < 4; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 12,
          reserved: false
        })
      }
      // Son 8 koltuk için tek sayılar (43'den 29'a)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 43 - (i * 2),
          row: currentRowLetter,
          seat: i + 16,
          reserved: false
        })
      }
    }
    // S sırası için özel numaralandırma
    else if (section === sections.centerBack && currentRowLetter === 'S') {
      // İlk 12 koltuk için çift sayılar (32'den 54'e)
      for (let i = 0; i < 12; i++) {
        rowSeats.push({
          id: 32 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 4 koltuk (53, 51, 49, 47)
      const middleSeats = [53, 51, 49, 47]
      for (let i = 0; i < 4; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
      // Son 8 koltuk için tek sayılar (45'ten 31'e)
      for (let i = 0; i < 8; i++) {
        rowSeats.push({
          id: 45 - (i * 2),
          row: currentRowLetter,
          seat: i + 17,
          reserved: false
        })
      }
    }
    // T sırası için özel numaralandırma
    else if (section === sections.centerBack && currentRowLetter === 'T') {
      // İlk 12 koltuk için çift sayılar (38'den 60'a)
      for (let i = 0; i < 12; i++) {
        rowSeats.push({
          id: 38 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 6 koltuk (62, 63, 61, 59, 57, 55)
      const middleSeats = [62, 63, 61, 59, 57, 55]
      for (let i = 0; i < 6; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
      // Son 9 koltuk için tek sayılar (53'ten 37'ye)
      for (let i = 0; i < 9; i++) {
        rowSeats.push({
          id: 53 - (i * 2),
          row: currentRowLetter,
          seat: i + 19,
          reserved: false
        })
      }
    }
    // U ve V sıraları için özel numaralandırma
    else if (section === sections.centerBack && (currentRowLetter === 'U' || currentRowLetter === 'V')) {
      // İlk 12 koltuk için çift sayılar (40'tan 62'ye)
      for (let i = 0; i < 12; i++) {
        rowSeats.push({
          id: 40 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 4 koltuk (62, 64, 63, 61)
      const middleSeats = [62, 64, 63, 61]
      for (let i = 0; i < 4; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
      // Son 11 koltuk için tek sayılar (59'dan 39'a)
      for (let i = 0; i < 11; i++) {
        rowSeats.push({
          id: 59 - (i * 2),
          row: currentRowLetter,
          seat: i + 17,
          reserved: false
        })
      }
    }
    // Y sırası için özel numaralandırma
    else if (section === sections.centerBack && currentRowLetter === 'Y') {
      // İlk 12 koltuk için çift sayılar (42'den 64'e)
      for (let i = 0; i < 12; i++) {
        rowSeats.push({
          id: 42 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 4 koltuk (65, 63, 61, 59)
      const middleSeats = [65, 63, 61, 59]
      for (let i = 0; i < 4; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
      // Son 11 koltuk için tek sayılar (57'den 41'e)
      for (let i = 0; i < 11; i++) {
        rowSeats.push({
          id: 57 - (i * 2),
          row: currentRowLetter,
          seat: i + 17,
          reserved: false
        })
      }
    }
    // Z sırası için özel numaralandırma
    else if (section === sections.centerBack && currentRowLetter === 'Z') {
      // İlk 12 koltuk için çift sayılar (38'den 60'a)
      for (let i = 0; i < 12; i++) {
        rowSeats.push({
          id: 38 + (i * 2),
          row: currentRowLetter,
          seat: i + 1,
          reserved: false
        })
      }
      // Ortadaki özel sıralı 6 koltuk (62, 63, 61, 59, 57, 55)
      const middleSeats = [62, 63, 61, 59, 57, 55]
      for (let i = 0; i < 6; i++) {
        rowSeats.push({
          id: middleSeats[i],
          row: currentRowLetter,
          seat: i + 13,
          reserved: false
        })
      }
      // Son 9 koltuk için tek sayılar (53'ten 37'ye)
      for (let i = 0; i < 9; i++) {
        rowSeats.push({
          id: 53 - (i * 2),
          row: currentRowLetter,
          seat: i + 19,
          reserved: false
        })
      }
    }
    else {
      // Diğer bloklar için normal koltuk düzeni
      for (let seat = 0; seat < section.seatsPerRow; seat++) {
        rowSeats.push({
          id: seatNumber,
          row: String.fromCharCode(currentRow),
          seat: seat + 1,
          reserved: false
        })
        seatNumber += section.increment
      }
    }
    if (rowSeats.length > 0) {
      seats.push(rowSeats)
    }
    currentRow++
  }
  return seats
}

const leftFrontSeats = ref(generateSeats(sections.leftFront))
const leftBackSeats = ref(generateSeats(sections.leftBack))
const centerFrontSeats = ref(generateSeats(sections.centerFront))
const centerBackSeats = ref(generateSeats(sections.centerBack))
const rightFrontSeats = ref(generateSeats(sections.rightFront))
const rightBackSeats = ref(generateSeats(sections.rightBack))

const handleSeatClick = (seat) => {
  emit('seat-select', {
    seatNumber: seat.id,
    rowLabel: seat.row
  })
}
</script>

<template>
  <div class="seat-map">
    <div class="stage">
      <div class="stage-label">SAHNE</div>
    </div>
    <div class="sections">
      <div class="section-group left">
        <div class="section front" :style="{ transform: `rotate(${sections.leftFront.angle}deg)` }">
          <div v-for="(row, rowIndex) in leftFrontSeats" :key="'leftFront-'+rowIndex" class="row">
            <div class="row-number" v-if="row && row.length > 0">{{ row[0].row }}</div>
            <div
              v-for="seat in row"
              :key="seat.id"
              class="seat"
              :class="{ reserved: seat.reserved }"
              @click="handleSeatClick(seat)"
            >
              <span class="seat-number">{{ seat.id }}</span>
            </div>
          </div>
        </div>
        <div class="section back" :style="{ transform: `rotate(${sections.leftBack.angle}deg)` }">
          <div v-for="(row, rowIndex) in leftBackSeats" :key="'leftBack-'+rowIndex" class="row">
            <div class="row-number" v-if="row && row.length > 0">{{ row[0].row }}</div>
            <div
              v-for="seat in row"
              :key="seat.id"
              class="seat"
              :class="{ reserved: seat.reserved }"
              @click="handleSeatClick(seat)"
            >
              <span class="seat-number">{{ seat.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-group center">
        <div class="section front">
          <div v-for="(row, rowIndex) in centerFrontSeats" :key="'centerFront-'+rowIndex" class="row">
            <div class="row-number" v-if="row && row.length > 0">{{ row[0].row }}</div>
            <div
              v-for="seat in row"
              :key="seat.id"
              class="seat"
              :class="{ reserved: seat.reserved }"
              @click="handleSeatClick(seat)"
            >
              <span class="seat-number">{{ seat.id }}</span>
            </div>
          </div>
        </div>
        <div class="section back">
          <div v-for="(row, rowIndex) in centerBackSeats" :key="'centerBack-'+rowIndex" class="row">
            <div class="row-number" v-if="row && row.length > 0">{{ row[0].row }}</div>
            <div
              v-for="seat in row"
              :key="seat.id"
              class="seat"
              :class="{ reserved: seat.reserved }"
              @click="handleSeatClick(seat)"
            >
              <span class="seat-number">{{ seat.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-group right">
        <div class="section front" :style="{ transform: `rotate(${sections.rightFront.angle}deg)` }">
          <div v-for="(row, rowIndex) in rightFrontSeats" :key="'rightFront-'+rowIndex" class="row">
            <div class="row-number" v-if="row && row.length > 0">{{ row[0].row }}</div>
            <div
              v-for="seat in row"
              :key="seat.id"
              class="seat"
              :class="{ reserved: seat.reserved }"
              @click="handleSeatClick(seat)"
            >
              <span class="seat-number">{{ seat.id }}</span>
            </div>
          </div>
        </div>
        <div class="section back" :style="{ transform: `rotate(${sections.rightBack.angle}deg)` }">
          <div v-for="(row, rowIndex) in rightBackSeats" :key="'rightBack-'+rowIndex" class="row">
            <div class="row-number" v-if="row && row.length > 0">{{ row[0].row }}</div>
            <div
              v-for="seat in row"
              :key="seat.id"
              class="seat"
              :class="{ reserved: seat.reserved }"
              @click="handleSeatClick(seat)"
            >
              <span class="seat-number">{{ seat.id }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seat-map {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 2rem;
  transform: scale(0.65);
  transform-origin: top center;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stage {
  display: none;
}

.sections {
  display: flex;
  justify-content: center;
  gap: clamp(0.5rem, 1vw, 1.5rem);
  perspective: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
}

.section-group {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  position: relative;
}

.section-group.left {
  transform: translateX(3.5rem);
}

.section-group.right {
  transform: translateX(-3.5rem);
}

.section-group.right .section.back {
  margin-top: 1.5rem;
  transform-origin: top center;
}

.section-group.left .section.back {
  margin-top: 1.5rem;
  transform-origin: top center;
}

.section {
  display: flex;
  flex-direction: column;
  gap: clamp(0.1rem, 0.2vw, 0.25rem);
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(0.15rem, 0.3vw, 0.4rem);
}

.row-number {
  width: 20px;
  text-align: right;
  font-size: 0.7rem;
  color: #666;
  margin-right: 0.3rem;
  font-weight: bold;
}

.seat {
  width: clamp(18px, 1.8vw, 24px);
  height: clamp(18px, 1.8vw, 24px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  background: white;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.seat-number {
  font-size: clamp(0.45rem, 0.9vw, 0.65rem);
  font-weight: 500;
  color: #444;
  transition: all 0.2s ease;
}

.seat:hover:not(.reserved) {
  transform: translateY(-2px);
  border-color: #3498db;
  background: #f8f9fa;
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.2);
}

.seat:hover:not(.reserved) .seat-number {
  color: #3498db;
}

.seat.reserved {
  background: #ff5252;
  border-color: #ff1744;
  cursor: not-allowed;
  box-shadow: none;
}

.seat.reserved .seat-number {
  color: white;
}

/* Tablet ve mobil için responsive tasarım */
@media (max-width: 1024px) {
  .seat-map {
    transform: scale(1);
    width: 100%;
    height: auto;
    overflow-x: auto;
    padding: 0;
  }

  .sections {
    width: max-content;
    padding: 1rem;
  }

  .section-group.left,
  .section-group.right {
    transform: none;
  }

  .seat {
    width: 20px;
    height: 20px;
  }

  .seat-number {
    font-size: 0.5rem;
  }
}

@media (max-width: 768px) {
  .seat-map {
    transform: scale(0.8);
  }
}

@media (max-width: 480px) {
  .seat-map {
    transform: scale(0.6);
  }

  .seat {
    width: 18px;
    height: 18px;
  }
}
</style> 