const db = require('../config/db');
const bcrypt = require('bcrypt');

const EmployeeModel = {
  getEmployeeByEmail: (email) => {
    return db.query('SELECT * FROM employees WHERE email = ?', [email]);
  },

  getEmployeeById: (id) => {
    return db.query('SELECT * FROM employees WHERE id = ?', [id]);
  },

  createEmployee: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return db.query(
      'INSERT INTO employees (idCompany, name, email, password, phoneNumber, responsibleArea) VALUES (?, ?, ?, ?, ?, ?)',
      [data.idCompany, data.name, data.email, hashedPassword, data.phoneNumber, data.responsibleArea]
    );
  },

  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  getAssignedJobs: (employeeId) => {
    return db.query(
      `SELECT 
        bs.id,
        bs.idCustomer,
        bs.idService,
        bs.bookingDay,
        bs.cleaningTime,
        bs.address,
        bs.note,
        bs.status,
        bs.paymentMethod,
        bs.totalFee,
        bs.paymentStatus,
        bs.bookingType,
        bs.specialInstructions,
        bs.checkInTime,
        bs.checkOutTime,
        bs.workDurationMinutes,
        COALESCE(bs.accessMethodSnapshot, csp.accessMethod, 'none') AS accessMethodSnapshot,
        -- hasAccessInfo: true nếu có snapshot hoặc có thông tin live trong profile
        (
          bs.lockboxPinEncSnapshot IS NOT NULL OR bs.condoGuideEncSnapshot IS NOT NULL OR bs.accessNoteEncSnapshot IS NOT NULL
          OR csp.lockboxPinEnc IS NOT NULL OR csp.condoGuideEnc IS NOT NULL OR csp.accessNoteEnc IS NOT NULL
        ) AS hasAccessInfo,
        s.serviceName,
        s.description as serviceDescription,
        c.name as customerName,
        c.phoneNumber as customerPhone,
        c.email as customerEmail
      FROM bookingservice bs
      JOIN service s ON bs.idService = s.id
      JOIN customers c ON bs.idCustomer = c.id
      LEFT JOIN (
        SELECT idCustomer,
          -- Ưu tiên row có PIN, fallback sang bất kỳ row nào (tránh MAX('none') đè 'lockbox')
          COALESCE(MAX(CASE WHEN lockboxPinEnc IS NOT NULL THEN accessMethod END),
                   MAX(CASE WHEN condoGuideEnc IS NOT NULL THEN accessMethod END),
                   MAX(accessMethod)) AS accessMethod,
          COALESCE(MAX(CASE WHEN lockboxPinEnc IS NOT NULL THEN lockboxLocation END),
                   MAX(lockboxLocation)) AS lockboxLocation,
          MAX(lockboxPinEnc)  AS lockboxPinEnc,
          MAX(condoGuideEnc)  AS condoGuideEnc,
          MAX(accessNoteEnc)  AS accessNoteEnc
        FROM customer_service_profiles
        GROUP BY idCustomer
      ) csp ON csp.idCustomer = bs.idCustomer
      WHERE bs.idEmployee = ?
      ORDER BY bs.bookingDay DESC, bs.cleaningTime DESC`,
      [employeeId]
    );
  },

  getBookingAccessInfo: async (bookingId, employeeId) => {
    const [rows] = await db.query(
      `SELECT bs.id, bs.idCustomer, bs.idEmployee, bs.status,
              bs.bookingDay, bs.cleaningTime, bs.checkInTime, bs.checkOutTime,
              bs.accessMethodSnapshot, bs.lockboxLocationSnapshot,
              bs.lockboxPinEncSnapshot, bs.condoGuideEncSnapshot, bs.accessNoteEncSnapshot,
              -- Thông tin truy cập hiện tại của khách (fallback khi snapshot rỗng)
              csp.accessMethod       AS liveAccessMethod,
              csp.lockboxLocation    AS liveLockboxLocation,
              csp.lockboxPinEnc      AS liveLockboxPinEnc,
              csp.condoGuideEnc      AS liveCondoGuideEnc,
              csp.accessNoteEnc      AS liveAccessNoteEnc
       FROM bookingservice bs
       LEFT JOIN (
         SELECT idCustomer,
           -- Ưu tiên row có PIN, fallback sang bất kỳ row nào
           COALESCE(MAX(CASE WHEN lockboxPinEnc IS NOT NULL THEN accessMethod END),
                    MAX(CASE WHEN condoGuideEnc IS NOT NULL THEN accessMethod END),
                    MAX(accessMethod)) AS accessMethod,
           COALESCE(MAX(CASE WHEN lockboxPinEnc IS NOT NULL THEN lockboxLocation END),
                    MAX(lockboxLocation)) AS lockboxLocation,
           MAX(lockboxPinEnc)   AS lockboxPinEnc,
           MAX(condoGuideEnc)   AS condoGuideEnc,
           MAX(accessNoteEnc)   AS accessNoteEnc
         FROM customer_service_profiles
         GROUP BY idCustomer
       ) csp ON csp.idCustomer = bs.idCustomer
       WHERE bs.id = ? AND bs.idEmployee = ?`,
      [bookingId, employeeId]
    );
    return rows[0] || null;
  },


  logAccessEvent: (bookingId, employeeId, eventType, ipAddress, userAgent) => {
    return db.query(
      `INSERT INTO home_access_audit_logs (bookingId, employeeId, eventType, ipAddress, userAgent)
       VALUES (?, ?, ?, ?, ?)`,
      [bookingId, employeeId, eventType, ipAddress || null, userAgent ? String(userAgent).slice(0, 255) : null]
    );
  },

  checkInJob: (bookingId, employeeId) => {
    return db.query(
      `UPDATE bookingservice
       SET checkInTime = NOW(),
           status = 'in progress'
       WHERE id = ? AND idEmployee = ? AND checkInTime IS NULL`,
      [bookingId, employeeId]
    );
  },

  // Lấy idCustomer và kiểm tra snapshot có null không
  getBookingForSnapshot: async (bookingId, employeeId) => {
    const [rows] = await db.query(
      `SELECT id, idCustomer,
              lockboxPinEncSnapshot, condoGuideEncSnapshot, accessNoteEncSnapshot
       FROM bookingservice
       WHERE id = ? AND idEmployee = ?`,
      [bookingId, employeeId]
    );
    return rows[0] || null;
  },

  // Cập nhật snapshot từ profile hiện tại của khách hàng (gọi sau check-in nếu snapshot null)
  refreshAccessSnapshot: (bookingId, snapshot) => {
    return db.query(
      `UPDATE bookingservice
       SET accessMethodSnapshot    = ?,
           lockboxLocationSnapshot = ?,
           lockboxPinEncSnapshot   = ?,
           condoGuideEncSnapshot   = ?,
           accessNoteEncSnapshot   = ?
       WHERE id = ?`,
      [
        snapshot.accessMethodSnapshot,
        snapshot.lockboxLocationSnapshot,
        snapshot.lockboxPinEncSnapshot,
        snapshot.condoGuideEncSnapshot,
        snapshot.accessNoteEncSnapshot,
        bookingId,
      ]
    );
  },

  checkOutJob: (bookingId, employeeId) => {
    return db.query(
      `UPDATE bookingservice
       SET checkOutTime = NOW(),
           workDurationMinutes = CASE
             WHEN checkInTime IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, checkInTime, NOW())
             ELSE NULL
           END,
           status = 'completed'
       WHERE id = ? AND idEmployee = ? AND checkInTime IS NOT NULL AND checkOutTime IS NULL`,
      [bookingId, employeeId]
    );
  },

  updateJobStatus: (bookingId, employeeId, status) => {
    return db.query(
      `UPDATE bookingservice 
       SET status = ? 
       WHERE id = ? AND idEmployee = ?`,
      [status, bookingId, employeeId]
    );
  },

  checkJobOwnership: async (bookingId, employeeId) => {
    const [result] = await db.query(
      'SELECT id FROM bookingservice WHERE id = ? AND idEmployee = ?',
      [bookingId, employeeId]
    );
    return result && result.length > 0;
  },

  // Lấy thông tin booking kèm gói định kỳ (dùng để tự động advance nextBookingDate)
  getBookingWithRecurringInfo: async (bookingId) => {
    const [rows] = await db.query(
      `SELECT bs.id, bs.bookingDay, bs.idEmployee,
              bs.recurringPackageId,
              rp.frequency, rp.dayOfWeek, rp.dayOfMonth,
              rp.cleaningTime as pkgCleaningTime,
              rp.nextBookingDate, rp.idCustomer as pkgCustomerId
       FROM bookingservice bs
       LEFT JOIN recurring_packages rp ON bs.recurringPackageId = rp.id
       WHERE bs.id = ?`,
      [bookingId]
    );
    return rows[0] || null;
  },

  updateEmployee: (id, data) => {
    return db.query(
      'UPDATE employees SET name = ?, phoneNumber = ?, responsibleArea = ? WHERE id = ?',
      [data.name, data.phoneNumber, data.responsibleArea, id]
    );
  },

  saveResetPasswordToken: (email, token, expiry) => {
    return db.query(
      'UPDATE employees SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?',
      [token, expiry, email]
    );
  },

  findByResetToken: (token) => {
    return db.query(
      'SELECT * FROM employees WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()',
      [token]
    );
  },

  resetPassword: async (token, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE employees SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE resetPasswordToken = ?',
      [hashedPassword, token]
    );
  },

  changePassword: async (employeeId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE employees SET password = ?, modified = NOW() WHERE id = ?',
      [hashedPassword, employeeId]
    );
  }
};

module.exports = EmployeeModel;

