const db = require('../config/db');
const bcrypt = require('bcrypt');


/* CREATE TABLE Customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) ,
    phoneNumber VARCHAR(15) ,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) ,
    address VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE Service (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serviceName VARCHAR(100) NOT NULL,
    description TEXT,
    basicPrice DECIMAL(12,2) NOT NULL,
    duration INT COMMENT 'Đơn vị: phút',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP NULL DEFAULT NULL
);

CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) ,
    phoneNumber VARCHAR(15) ,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) ,
    responsibleArea VARCHAR(100)
);

CREATE TABLE bookingService (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idCustomer INT ,
    idService INT ,
    idEmployee INT,
    bookingDay DATE, 
    cleaningTime TIME,
    address VARCHAR(255),
    note TEXT,
    status ENUM('booked', 'processing', 'in progress', 'completed', 'cancelled') DEFAULT 'booked',
    paymentMethod ENUM('cash', 'online') DEFAULT 'cash',
    totalFee DECIMAL(12,2),
    paymentStatus ENUM('unpaid', 'paid') DEFAULT 'unpaid'
);

CREATE TABLE REVIEW (
    id INT AUTO_INCREMENT PRIMARY KEY,
    idBooking INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 10),
    comment TEXT,
    reviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ADMIN (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255),
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE
);

CREATE TABLE IF NOT EXISTS employee_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employeeName VARCHAR(100),
    employeeEmail VARCHAR(255),
    employeePhone VARCHAR(15),
    responsibleArea VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    requestNote TEXT COMMENT 'Ghi chú từ công ty khi gửi yêu cầu',
    adminResponse TEXT COMMENT 'Phản hồi từ admin khi xử lý yêu cầu',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP NULL DEFAULT NULL
);




);*/
const CustomerModel = {
  getCustomerByEmail: (email) => {
    return db.query('SELECT * FROM customers WHERE email = ?', [email]);
  },

  createCustomer: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return db.query(
      'INSERT INTO customers (name, email, password, phoneNumber, address) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, hashedPassword, data.phoneNumber, data.address]
    );
  },

  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
  getCustomerById: (id) => {
    return db.query('SELECT * FROM customers WHERE id = ?', [id]);
  },

  updateCustomer: (idCustomer, data) => {
    return db.query('UPDATE customers SET name = ?, phoneNumber = ?, email = ?, address = ? WHERE id = ?',
      [data.name, data.phoneNumber, data.email, data.address, idCustomer]);
  },

  getAllServices: () => {
    return db.query('SELECT * FROM service');
  },

  getServiceById: (id) => {
    return db.query('SELECT * FROM service WHERE id = ?', [id]);
  },

  bookService: (data) => {
    return db.query(
      `INSERT INTO bookingservice (
        idCustomer, idService, idEmployee, bookingDay, cleaningTime, address, homeSizeSqm, note, paymentMethod, totalFee,
        bookingType, recurringPackageId, specialInstructions,
        accessMethodSnapshot, lockboxLocationSnapshot, lockboxPinEncSnapshot, condoGuideEncSnapshot, accessNoteEncSnapshot
      )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.idCustomer,
        data.idService,
        data.idEmployee,
        data.bookingDay,
        data.cleaningTime,
        data.address,
        data.homeSizeSqm || null,
        data.note,
        data.paymentMethod,
        data.totalFee,
        data.bookingType || 'one_time',
        data.recurringPackageId || null,
        data.specialInstructions || null,
        data.accessMethodSnapshot || 'none',
        data.lockboxLocationSnapshot || null,
        data.lockboxPinEncSnapshot || null,
        data.condoGuideEncSnapshot || null,
        data.accessNoteEncSnapshot || null,
      ]
    );
  },



  getBookingsByCustomer: (idCustomer) => {
    return db.query(
      `SELECT d.*, s.serviceName, s.description, rp.frequency as recurringFrequency
       FROM bookingservice d
       JOIN service s ON d.idService = s.id
       LEFT JOIN recurring_packages rp ON d.recurringPackageId = rp.id
       WHERE d.idCustomer = ?`,
      [idCustomer]
    );
  },

  getBookingByIdAndCustomer: (bookingId, customerId) => {
    return db.query(
      `SELECT bs.*, s.serviceName, s.basicPrice, s.duration
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       WHERE bs.id = ? AND bs.idCustomer = ?`,
      [bookingId, customerId]
    );
  },

  getServicePriceById: async (serviceId) => {
    const [rows] = await db.query('SELECT id, basicPrice, serviceName FROM service WHERE id = ?', [serviceId]);
    return rows[0] || null;
  },

  getServiceProfileByCustomer: (customerId) => {
    return db.query(
      'SELECT * FROM customer_service_profiles WHERE idCustomer = ?',
      [customerId]
    );
  },

  upsertServiceProfile: (customerId, data) => {
    return db.query(
      `INSERT INTO customer_service_profiles
       (idCustomer, homeSizeSqm, priorityAreas, hasPets, petNotes, defaultAddress, defaultTime, specialInstructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       homeSizeSqm = VALUES(homeSizeSqm),
       priorityAreas = VALUES(priorityAreas),
       hasPets = VALUES(hasPets),
       petNotes = VALUES(petNotes),
       defaultAddress = VALUES(defaultAddress),
       defaultTime = VALUES(defaultTime),
       specialInstructions = VALUES(specialInstructions)`,
      [
        customerId,
        data.homeSizeSqm || null,
        data.priorityAreas || null,
        data.hasPets ? 1 : 0,
        data.petNotes || null,
        data.defaultAddress || null,
        data.defaultTime || null,
        data.specialInstructions || null
      ]
    );
  },

  getAccessProfile: async (customerId) => {
    const [rows] = await db.query(
      `SELECT accessMethod, lockboxLocation, lockboxPinEnc, condoGuideEnc, accessNoteEnc
       FROM customer_service_profiles WHERE idCustomer = ?`,
      [customerId]
    );
    return rows[0] || null;
  },

  upsertAccessProfile: (customerId, data) => {
    return db.query(
      `INSERT INTO customer_service_profiles
       (idCustomer, accessMethod, lockboxLocation, lockboxPinEnc, condoGuideEnc, accessNoteEnc)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       accessMethod = VALUES(accessMethod),
       lockboxLocation = VALUES(lockboxLocation),
       lockboxPinEnc = VALUES(lockboxPinEnc),
       condoGuideEnc = VALUES(condoGuideEnc),
       accessNoteEnc = VALUES(accessNoteEnc)`,
      [
        customerId,
        data.accessMethod || 'none',
        data.lockboxLocation || null,
        data.lockboxPinEnc || null,
        data.condoGuideEnc || null,
        data.accessNoteEnc || null,
      ]
    );
  },

  createRecurringPackage: (data) => {
    return db.query(
      `INSERT INTO recurring_packages
      (
        idCustomer, idService, frequency, dayOfWeek, dayOfMonth, cleaningTime, address,
        homeSizeSqm, note, specialInstructions, totalFee, preferredEmployeeId, trialBookingId, nextBookingDate
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.idCustomer,
        data.idService,
        data.frequency,
        data.dayOfWeek || null,
        data.dayOfMonth || null,
        data.cleaningTime,
        data.address,
        data.homeSizeSqm || null,
        data.note || null,
        data.specialInstructions || null,
        data.totalFee,
        data.preferredEmployeeId || null,
        data.trialBookingId || null,
        data.nextBookingDate || null
      ]
    );
  },

  createRecurringBooking: (data) => {
    return db.query(
      `INSERT INTO bookingservice
      (
        idCustomer, idService, idEmployee, bookingDay, cleaningTime, address, note, paymentMethod,
        totalFee, bookingType, recurringPackageId, specialInstructions,
        accessMethodSnapshot, lockboxLocationSnapshot, lockboxPinEncSnapshot, condoGuideEncSnapshot, accessNoteEncSnapshot
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'recurring', ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.idCustomer,
        data.idService,
        data.idEmployee || null,
        data.bookingDay,
        data.cleaningTime,
        data.address,
        data.note || null,
        data.paymentMethod || 'cash',
        data.totalFee,
        data.recurringPackageId,
        data.specialInstructions || null,
        data.accessMethodSnapshot || 'none',
        data.lockboxLocationSnapshot || null,
        data.lockboxPinEncSnapshot || null,
        data.condoGuideEncSnapshot || null,
        data.accessNoteEncSnapshot || null,
      ]
    );
  },

  getRecurringPackagesByCustomer: (customerId) => {
    return db.query(
      `SELECT rp.*, s.serviceName, e.name as preferredEmployeeName
       FROM recurring_packages rp
       JOIN service s ON rp.idService = s.id
       LEFT JOIN employees e ON rp.preferredEmployeeId = e.id
       WHERE rp.idCustomer = ?
       ORDER BY rp.createdAt DESC`,
      [customerId]
    );
  },

  getRecurringPackageByIdAndCustomer: (packageId, customerId) => {
    return db.query(
      `SELECT rp.*, s.serviceName, s.duration
       FROM recurring_packages rp
       JOIN service s ON rp.idService = s.id
       WHERE rp.id = ? AND rp.idCustomer = ?`,
      [packageId, customerId]
    );
  },

  updateRecurringPackageStatus: (packageId, customerId, status) => {
    return db.query(
      'UPDATE recurring_packages SET status = ? WHERE id = ? AND idCustomer = ?',
      [status, packageId, customerId]
    );
  },

  updateRecurringPackageSchedule: (packageId, customerId, bookingDay, cleaningTime) => {
    return db.query(
      `UPDATE recurring_packages
       SET nextBookingDate = ?, cleaningTime = ?
       WHERE id = ? AND idCustomer = ?`,
      [bookingDay, cleaningTime, packageId, customerId]
    );
  },

  // Tự động tiến nextBookingDate sang buổi kế tiếp (không cần customerId - dùng nội bộ khi hoàn thành)
  advanceRecurringNextDate: (packageId, nextDate) => {
    return db.query(
      `UPDATE recurring_packages SET nextBookingDate = ? WHERE id = ?`,
      [nextDate, packageId]
    );
  },


  createServiceContract: (data) => {
    return db.query(
      `INSERT INTO service_contracts
      (idCustomer, recurringPackageId, contractCode, contractTitle, contractTerms, filePath, fileName, status, signedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.idCustomer,
        data.recurringPackageId,
        data.contractCode,
        data.contractTitle,
        data.contractTerms,
        data.filePath,
        data.fileName,
        data.status || 'active',
        data.signedAt || null
      ]
    );
  },

  getContractsByCustomer: (customerId) => {
    return db.query(
      `SELECT c.*, rp.frequency, s.serviceName
       FROM service_contracts c
       JOIN recurring_packages rp ON c.recurringPackageId = rp.id
       JOIN service s ON rp.idService = s.id
       WHERE c.idCustomer = ?
       ORDER BY c.createdAt DESC`,
      [customerId]
    );
  },

  updateRecurringPreferredEmployee: (packageId, employeeId) => {
    return db.query(
      'UPDATE recurring_packages SET preferredEmployeeId = ? WHERE id = ?',
      [employeeId, packageId]
    );
  },

  getCustomerDashboardSummary: async (customerId) => {
    const [upcomingRows] = await db.query(
      `SELECT COUNT(*) as count
       FROM bookingservice
       WHERE idCustomer = ?
         AND bookingDay >= CURDATE()
         AND status IN ('booked', 'confirmed', 'processing', 'in progress')`,
      [customerId]
    );
    const [usedRows] = await db.query(
      `SELECT COUNT(*) as count
       FROM bookingservice
       WHERE idCustomer = ?
         AND status = 'completed'`,
      [customerId]
    );
    const [spendRows] = await db.query(
      `SELECT COALESCE(SUM(totalFee), 0) as total
       FROM bookingservice
       WHERE idCustomer = ?
         AND status != 'cancelled'`,
      [customerId]
    );
    return {
      upcoming: upcomingRows[0]?.count || 0,
      sessionsUsed: usedRows[0]?.count || 0,
      totalSpent: Number(spendRows[0]?.total || 0)
    };
  },

  addReview: (data) => {
    return db.query(
      `INSERT INTO review (idBooking, rating, comment) VALUES (?, ?, ?)`,
      [data.idBooking, data.rating, data.comment]
    );
  },

  getReviewByBooking: (bookingId) => {
    return db.query(
      `SELECT r.*, c.name as customerName, s.serviceName, b.bookingDay
       FROM review r
       JOIN bookingservice b ON r.idBooking = b.id
       JOIN customers c ON b.idCustomer = c.id
       JOIN service s ON b.idService = s.id
       WHERE r.idBooking = ?`,
      [bookingId]
    );
  },

  getReviewsByService: (serviceId) => {
    return db.query(
      `SELECT r.*, c.name as customerName, b.bookingDay
       FROM review r
       JOIN bookingservice b ON r.idBooking = b.id
       JOIN customers c ON b.idCustomer = c.id
       WHERE b.idService = ?
       ORDER BY r.reviewDate DESC`,
      [serviceId]
    );
  },

  getReviewsByCustomer: (customerId) => {
    return db.query(
      `SELECT r.*, s.serviceName, b.bookingDay
       FROM review r
       JOIN bookingservice b ON r.idBooking = b.id
       JOIN service s ON b.idService = s.id
       WHERE b.idCustomer = ?
       ORDER BY r.reviewDate DESC`,
      [customerId]
    );
  },

  checkReviewExists: (bookingId) => {
    return db.query(
      `SELECT id FROM review WHERE idBooking = ?`,
      [bookingId]
    );
  },

  getServiceAverageRating: (serviceId) => {
    return db.query(
      `SELECT 
        COUNT(*) as totalReviews,
        AVG(r.rating) as averageRating,
        SUM(CASE WHEN r.rating >= 4 THEN 1 ELSE 0 END) as excellentCount,
        SUM(CASE WHEN r.rating = 3 THEN 1 ELSE 0 END) as goodCount,
        SUM(CASE WHEN r.rating <= 2 THEN 1 ELSE 0 END) as poorCount
       FROM review r
       JOIN bookingservice b ON r.idBooking = b.id
       WHERE b.idService = ?`,
      [serviceId]
    );
  },

  saveResetPasswordToken: (email, token, expires) => {
    return db.query(
      'UPDATE customers SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?',
      [token, expires, email]
    );
  },

  findByResetToken: (token) => {
    return db.query(
      'SELECT * FROM customers WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()',
      [token]
    );
  },

  resetPassword: async (token, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE customers SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE resetPasswordToken = ?',
      [hashedPassword, token]
    );
  },

  changePassword: async (customerId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE customers SET password = ?, modified = NOW() WHERE id = ?',
      [hashedPassword, customerId]
    );
  },

  updateReviewSentiment: (reviewId, data) => {
    return db.query(
      `UPDATE review 
       SET sentiment = ?, sentimentScore = ?, topics = ?, isMismatch = ?
       WHERE id = ?`,
      [
        data.sentiment,
        data.confidence,
        JSON.stringify(data.topics || []),
        data.is_mismatch ? 1 : 0,
        reviewId,
      ]
    );
  },

  getServiceSentimentStats: (serviceId) => {
    return db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN r.sentiment = 'positive' THEN 1 ELSE 0 END) as positiveCount,
        SUM(CASE WHEN r.sentiment = 'negative' THEN 1 ELSE 0 END) as negativeCount,
        SUM(CASE WHEN r.sentiment = 'neutral' THEN 1 ELSE 0 END) as neutralCount,
        SUM(CASE WHEN r.isMismatch = 1 THEN 1 ELSE 0 END) as mismatchCount
       FROM review r
       JOIN bookingservice b ON r.idBooking = b.id
       WHERE b.idService = ? AND r.sentiment IS NOT NULL`,
      [serviceId]
    );
  },

  getFlaggedReviews: () => {
    return db.query(
      `SELECT r.*, c.name as customerName, s.serviceName, b.bookingDay,
              b.idEmployee, e.name as employeeName
       FROM review r
       JOIN bookingservice b ON r.idBooking = b.id
       JOIN customers c ON b.idCustomer = c.id
       JOIN service s ON b.idService = s.id
       LEFT JOIN employees e ON b.idEmployee = e.id
       WHERE r.isMismatch = 1
       ORDER BY r.reviewDate DESC`
    );
  }
};

module.exports = CustomerModel;