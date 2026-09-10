const cron = require('node-cron');
const db = require('../config/db');
const { sendBookingReminderEmail } = require('./emailService');

/**
 * Cron job: Gửi email nhắc nhở 24h trước buổi dọn dẹp
 * Chạy mỗi ngày lúc 08:00 sáng
 * Query tất cả booking có bookingDay = ngày mai, status booked/confirmed
 */
const startCronJobs = () => {
  // Nhắc nhở 24h — chạy lúc 8h sáng mỗi ngày
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Bắt đầu gửi email nhắc nhở 24h...');

    try {
      const [bookings] = await db.query(`
        SELECT 
          bs.id,
          bs.bookingDay,
          bs.cleaningTime,
          bs.address,
          s.serviceName,
          c.name AS customerName,
          c.email AS customerEmail,
          e.name AS employeeName,
          e.phoneNumber AS employeePhone
        FROM bookingservice bs
        JOIN service s ON bs.idService = s.id
        JOIN customers c ON bs.idCustomer = c.id
        LEFT JOIN employees e ON bs.idEmployee = e.id
        WHERE bs.bookingDay = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
          AND bs.status IN ('booked', 'confirmed')
      `);

      if (!bookings || bookings.length === 0) {
        console.log('[CRON] Không có booking nào cần nhắc nhở ngày mai.');
        return;
      }

      console.log(`[CRON] Tìm thấy ${bookings.length} booking cần nhắc nhở.`);

      let sent = 0;
      let failed = 0;

      for (const booking of bookings) {
        try {
          await sendBookingReminderEmail(booking.customerEmail, booking.customerName, {
            serviceName: booking.serviceName,
            bookingDay: booking.bookingDay,
            cleaningTime: booking.cleaningTime,
            address: booking.address,
            employeeName: booking.employeeName || null,
            employeePhone: booking.employeePhone || null,
          });
          sent++;
        } catch (emailErr) {
          console.error(`[CRON] Lỗi gửi nhắc nhở cho booking #${booking.id}:`, emailErr.message);
          failed++;
        }
      }

      console.log(`[CRON] Hoàn tất nhắc nhở: ${sent} thành công, ${failed} thất bại.`);
    } catch (error) {
      console.error('[CRON] Lỗi chạy cron nhắc nhở:', error);
    }
  });

  console.log('[CRON] Đã khởi động cron jobs — nhắc nhở 24h chạy lúc 08:00 mỗi ngày.');
};

module.exports = { startCronJobs };
