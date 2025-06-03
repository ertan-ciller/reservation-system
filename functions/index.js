const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Gmail ayarlarını buraya gir
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ertanciller@gmail.com", // Gmail adresin
    pass: "xnrxigsudrdqmrcl", // Gmail uygulama şifresi (2FA ile alınan)
  },
});

exports.sendReservationEmail = functions.firestore
    .document("reservations/{reservationId}")
    .onCreate(async (snap, context) => {
      const data = snap.data();

      const email = data.email;
      const fullName = `${data.firstName} ${data.lastName}`;
      const seats = Array.isArray(data.seatIds) ?
          data.seatIds.map((s) => `Koltuk ${s.row}-${s.id}`).join(", ") :
          "Bilinmeyen";

      const mailOptions = {
        from: "ertanciller@gmail.com",
        to: email,
        subject: "Rezervasyon Onayı",
        text: 
            `Merhaba ${fullName},\n\n` +
            `Rezervasyonunuz başarıyla alındı.\n` +
            `Seçilen koltuklar: ${seats}\n\n` +
            `Teşekkürler.`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`E-posta gönderildi: ${email}`);
      } catch (error) {
        console.error("E-posta gönderilemedi:", error);
      }
    });
