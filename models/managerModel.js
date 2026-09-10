const db = require('../config/db');
const bcrypt = require('bcrypt');

const ManagerModel = {
  /*CREATE TABLE Customers (
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
    responsibleArea VARCHAR(100),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP NULL DEFAULT NULL
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
    paymentStatus ENUM('unpaid', 'paid') DEFAULT 'unpaid',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified timestamp null default null
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
    email VARCHAR(255) UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified timestamp null default null
);


CREATE TABLE IF NOT EXISTS managers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phoneNumber VARCHAR(20),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  modified timestamp null default null
);
*/
  getManagerByUsername: (username) => {
    return db.query('SELECT * FROM managers WHERE username = ?', [username]);
  },

  getManagerByEmail: (email) => {
    return db.query('SELECT * FROM managers WHERE email = ?', [email]);
  },

  getManagerById: (id) => {
    return db.query('SELECT id, name, username, email, phoneNumber, createdAt FROM managers WHERE id = ?', [id]);
  },

  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  countManagers: async () => {
    const [result] = await db.query('SELECT COUNT(*) as count FROM managers');
    return result[0].count;
  },

  createManager: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return db.query(
      'INSERT INTO managers (name, username, email, password, phoneNumber) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.username, data.email, hashedPassword, data.phoneNumber]
    );
  },

  updateManager: (id, data) => {
    return db.query(
      'UPDATE managers SET name = ?, email = ?, phoneNumber = ? WHERE id = ?',
      [data.name, data.email, data.phoneNumber, id]
    );
  },

  saveResetPasswordToken: (email, token, expiry) => {
    return db.query(
      'UPDATE managers SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?',
      [token, expiry, email]
    );
  },

  findByResetToken: (token) => {
    return db.query(
      'SELECT * FROM managers WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()',
      [token]
    );
  },

  resetPassword: async (token, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE managers SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE resetPasswordToken = ?',
      [hashedPassword, token]
    );
  },

  getAllBookings: () => {
    return db.query(
      `SELECT 
        bs.*,
        bs.totalFee AS totalPrice,
        s.serviceName,
        s.duration,
        s.basicPrice,
        c.name as customerName,
        c.email as customerEmail,
        c.phoneNumber as customerPhone,
        c.address as customerAddress,
        e.name as employeeName,
        e.email as employeeEmail,
        e.phoneNumber as employeePhone,
        e.responsibleArea as employeeArea
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       LEFT JOIN employees e ON bs.idEmployee = e.id
       ORDER BY bs.bookingDay DESC, bs.cleaningTime DESC`
    );
  },

  getPendingBookings: () => {
    return db.query(
      `SELECT 
        bs.*,
        bs.totalFee AS totalPrice,
        s.serviceName,
        s.duration,
        s.basicPrice,
        c.name as customerName,
        c.email as customerEmail,
        c.phoneNumber as customerPhone,
        c.address as customerAddress
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       WHERE bs.idEmployee IS NULL 
         AND (bs.status NOT IN ('completed', 'cancelled') OR bs.status IS NULL)
       ORDER BY bs.bookingDay ASC, bs.cleaningTime ASC`
    );
  },

  getActiveBookings: () => {
    return db.query(
      `SELECT 
        bs.*,
        bs.totalFee AS totalPrice,
        s.serviceName,
        c.name as customerName,
        e.name as employeeName,
        e.phoneNumber as employeePhone
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       LEFT JOIN employees e ON bs.idEmployee = e.id
       WHERE bs.status IN ('confirmed', 'processing', 'in progress')
       ORDER BY bs.bookingDay ASC, bs.cleaningTime ASC`
    );
  },

  getBookingById: (id) => {
    return db.query(
      `SELECT 
        bs.*,
        s.serviceName,
        s.description,
        s.duration,
        s.basicPrice,
        c.name as customerName,
        c.email as customerEmail,
        c.phoneNumber as customerPhone,
        c.address as customerAddress,
        e.name as employeeName,
        e.email as employeeEmail,
        e.phoneNumber as employeePhone,
        e.responsibleArea as employeeArea,
        rp.frequency as recurringFrequency,
        rp.dayOfWeek as recurringDayOfWeek,
        rp.dayOfMonth as recurringDayOfMonth,
        rp.nextBookingDate as recurringNextBookingDate,
        rp.preferredEmployeeId
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       LEFT JOIN employees e ON bs.idEmployee = e.id
       LEFT JOIN recurring_packages rp ON bs.recurringPackageId = rp.id
       WHERE bs.id = ?`,
      [id]
    );
  },


  assignEmployeeToBooking: (bookingId, employeeId) => {
    return db.query(
      'UPDATE bookingservice SET idEmployee = ?, status = ? WHERE id = ?',
      [employeeId, 'confirmed', bookingId]
    );
  },

  updateBookingStatus: (id, status) => {
    return db.query(
      'UPDATE bookingservice SET status = ? WHERE id = ?',
      [status, id]
    );
  },

  getAllEmployees: () => {
    return db.query(
      `SELECT 
        e.*,
        COUNT(DISTINCT bs.id) as activeJobs
       FROM employees e
       LEFT JOIN bookingservice bs ON e.id = bs.idEmployee 
         AND bs.status IN ('confirmed', 'processing', 'in progress')
       GROUP BY e.id
       ORDER BY e.name ASC`
    );
  },

  getEmployeesByArea: (area) => {
    return db.query(
      `SELECT 
        e.*,
        COUNT(DISTINCT bs.id) as activeJobs
       FROM employees e
       LEFT JOIN bookingservice bs ON e.id = bs.idEmployee 
         AND bs.status IN ('confirmed', 'processing', 'in progress')
       WHERE e.responsibleArea LIKE ?
       GROUP BY e.id
       ORDER BY activeJobs ASC, e.name ASC`,
      [`%${area}%`]
    );
  },

  getAvailableEmployees: (limit = 10) => {
    return db.query(
      `SELECT 
        e.*,
        COUNT(DISTINCT bs.id) as activeJobs
       FROM employees e
       LEFT JOIN bookingservice bs ON e.id = bs.idEmployee 
         AND bs.status IN ('confirmed', 'processing', 'in progress')
       GROUP BY e.id
       HAVING activeJobs < 3
       ORDER BY activeJobs ASC, e.name ASC
       LIMIT ?`,
      [limit]
    );
  },

  getEmployeeSchedule: (employeeId, startDate, endDate) => {
    return db.query(
      `SELECT 
        bs.*,
        s.serviceName,
        s.duration,
        c.name as customerName,
        c.address as customerAddress
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       WHERE bs.idEmployee = ?
         AND bs.bookingDay BETWEEN ? AND ?
         AND bs.status != 'cancelled'
       ORDER BY bs.bookingDay ASC, bs.cleaningTime ASC`,
      [employeeId, startDate, endDate]
    );
  },

  checkEmployeeAvailability: async (employeeId, bookingDay, cleaningTime, duration) => {
    const [result] = await db.query(
      `SELECT COUNT(*) as count
       FROM bookingservice
       WHERE idEmployee = ?
         AND bookingDay = ?
         AND status IN ('confirmed', 'processing', 'in progress')
         AND (
           -- Check for time overlap
           (cleaningTime <= ? AND DATE_ADD(cleaningTime, INTERVAL ? MINUTE) > ?)
           OR (cleaningTime > ? AND cleaningTime < DATE_ADD(?, INTERVAL ? MINUTE))
         )`,
      [employeeId, bookingDay, cleaningTime, duration, cleaningTime, cleaningTime, cleaningTime, duration]
    );
    return result[0].count === 0;
  },

  suggestEmployees: async (bookingDay, cleaningTime, duration, customerArea = null, preferredEmployeeId = null) => {
    let query = `
      SELECT 
        e.*,
        COUNT(DISTINCT bs.id) as activeJobs,
        CASE
          WHEN ? IS NOT NULL AND e.id = ? THEN 1
          ELSE 0
        END as preferredMatch,
        CASE 
          WHEN e.responsibleArea LIKE ? THEN 1
          ELSE 0
        END as areaMatch
      FROM employees e
      LEFT JOIN bookingservice bs ON e.id = bs.idEmployee 
        AND bs.status IN ('confirmed', 'processing', 'in progress')
      WHERE NOT EXISTS (
        SELECT 1 FROM bookingservice conflict
        WHERE conflict.idEmployee = e.id
          AND conflict.bookingDay = ?
          AND conflict.status IN ('confirmed', 'processing', 'in progress')
          AND (
            (conflict.cleaningTime <= ? AND DATE_ADD(conflict.cleaningTime, INTERVAL ? MINUTE) > ?)
            OR (conflict.cleaningTime > ? AND conflict.cleaningTime < DATE_ADD(?, INTERVAL ? MINUTE))
          )
      )
      GROUP BY e.id
      ORDER BY preferredMatch DESC, areaMatch DESC, activeJobs ASC, e.name ASC
    `;

    const areaPattern = customerArea ? `%${customerArea}%` : '%';

    return db.query(query, [
      preferredEmployeeId,
      preferredEmployeeId,
      areaPattern,
      bookingDay,
      cleaningTime, duration, cleaningTime,
      cleaningTime, cleaningTime, duration
    ]);
  },


  getDashboardStats: async () => {
    const [pendingBookings] = await db.query(
      `SELECT COUNT(*) as count FROM bookingservice
       WHERE idEmployee IS NULL AND status = 'booked'`
    );
    const [activeBookings] = await db.query(
      `SELECT COUNT(*) as count FROM bookingservice
       WHERE status IN ('confirmed', 'processing', 'in progress')`
    );
    const [completedToday] = await db.query(
      `SELECT COUNT(*) as count FROM bookingservice
       WHERE status = 'completed'
         AND (
           DATE(checkOutTime) = CURDATE()
           OR (checkOutTime IS NULL AND DATE(bookingDay) = CURDATE())
         )`
    );
    const [totalEmployees] = await db.query(
      'SELECT COUNT(*) as count FROM employees'
    );
    const [availableEmployees] = await db.query(
      `SELECT COUNT(*) as count FROM (
         SELECT e.id
         FROM employees e
         LEFT JOIN bookingservice bs ON e.id = bs.idEmployee 
           AND bs.status IN ('confirmed', 'processing', 'in progress')
         GROUP BY e.id
         HAVING COUNT(bs.id) < 3
       ) t`
    );

    return {
      pendingBookings: pendingBookings[0].count,
      activeBookings: activeBookings[0].count,
      completedToday: completedToday[0].count,
      totalEmployees: totalEmployees[0].count,
      availableEmployees: availableEmployees[0].count
    };
  },

  getBookingsByDate: (date) => {
    return db.query(
      `SELECT 
        bs.*,
        s.serviceName,
        c.name as customerName,
        e.name as employeeName
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       LEFT JOIN employees e ON bs.idEmployee = e.id
       WHERE DATE(bs.bookingDay) = ?
       ORDER BY bs.cleaningTime ASC`,
      [date]
    );
  },

  
  createEmployeeRequest: (data) => {
    return db.query(
      `INSERT INTO employee_requests 
       (idManager, employeeName, employeeEmail, employeePhone, responsibleArea, requestNote) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.idManager,
        data.employeeName,
        data.employeeEmail,
        data.employeePhone,
        data.responsibleArea,
        data.requestNote
      ]
    );
  },

  getEmployeeRequestsByManager: (managerId) => {
    return db.query(
      `SELECT * FROM employee_requests
       WHERE idManager = ?
       ORDER BY createdAt DESC`,
      [managerId]
    );
  },

  getEmployeeRequestByIdForManager: (requestId, managerId) => {
    return db.query(
      `SELECT * FROM employee_requests
       WHERE id = ? AND idManager = ?`,
      [requestId, managerId]
    );
  },

  updateEmployeeRequest: (requestId, managerId, data) => {
    return db.query(
      `UPDATE employee_requests 
       SET employeeName = ?, 
           employeeEmail = ?, 
           employeePhone = ?, 
           responsibleArea = ?,
           requestNote = ?
       WHERE id = ? AND idManager = ? AND status = 'pending'`,
      [
        data.employeeName,
        data.employeeEmail,
        data.employeePhone,
        data.responsibleArea,
        data.requestNote,
        requestId,
        managerId
      ]
    );
  },

  cancelEmployeeRequest: (requestId, managerId) => {
    return db.query(
      `UPDATE employee_requests 
       SET status = 'rejected',
           adminResponse = 'Đã hủy bởi Manager'
       WHERE id = ? AND idManager = ? AND status = 'pending'`,
      [requestId, managerId]
    );
  },

  getAllEmployeeRequests: () => {
    return db.query(
      `SELECT 
        er.*,
        m.name as managerName,
        m.email as managerEmail,
        m.phoneNumber as managerPhone
       FROM employee_requests er
       JOIN managers m ON er.idManager = m.id
       ORDER BY 
         CASE er.status 
           WHEN 'pending' THEN 1 
           WHEN 'approved' THEN 2 
           WHEN 'rejected' THEN 3 
         END,
         er.createdAt DESC`
    );
  },

  getEmployeeRequestsByStatus: (status) => {
    return db.query(
      `SELECT 
        er.*,
        m.name as managerName,
        m.email as managerEmail,
        m.phoneNumber as managerPhone
       FROM employee_requests er
       JOIN managers m ON er.idManager = m.id
       WHERE er.status = ?
       ORDER BY er.createdAt DESC`,
      [status]
    );
  },

  getEmployeeRequestById: (requestId) => {
    return db.query(
      `SELECT 
        er.*,
        m.name as managerName,
        m.email as managerEmail,
        m.phoneNumber as managerPhone,
        m.username as managerUsername
       FROM employee_requests er
       JOIN managers m ON er.idManager = m.id
       WHERE er.id = ?`,
      [requestId]
    );
  },

  approveEmployeeRequest: (requestId, adminResponse) => {
    return db.query(
      `UPDATE employee_requests 
       SET status = 'approved',
           adminResponse = ?
       WHERE id = ? AND status = 'pending'`,
      [adminResponse, requestId]
    );
  },

  rejectEmployeeRequest: (requestId, adminResponse) => {
    return db.query(
      `UPDATE employee_requests 
       SET status = 'rejected',
           adminResponse = ?
       WHERE id = ? AND status = 'pending'`,
      [adminResponse, requestId]
    );
  },

  checkEmployeeEmailExists: async (email) => {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM employees WHERE email = ?',
      [email]
    );
    return rows[0].count > 0;
  },

  checkEmailInPendingRequests: async (email, excludeRequestId = null) => {
    let query = 'SELECT COUNT(*) as count FROM employee_requests WHERE employeeEmail = ? AND status = "pending"';
    const params = [email];

    if (excludeRequestId) {
      query += ' AND id != ?';
      params.push(excludeRequestId);
    }

    const [rows] = await db.query(query, params);
    return rows[0].count > 0;
  },

  getEmployeeRequestStats: async () => {
    const [total] = await db.query('SELECT COUNT(*) as count FROM employee_requests');
    const [pending] = await db.query('SELECT COUNT(*) as count FROM employee_requests WHERE status = "pending"');
    const [approved] = await db.query('SELECT COUNT(*) as count FROM employee_requests WHERE status = "approved"');
    const [rejected] = await db.query('SELECT COUNT(*) as count FROM employee_requests WHERE status = "rejected"');

    return {
      total: total[0].count,
      pending: pending[0].count,
      approved: approved[0].count,
      rejected: rejected[0].count
    };
  },

  updateEmployeeArea: (employeeId, responsibleArea) => {
    return db.query(
      'UPDATE employees SET responsibleArea = ? WHERE id = ?',
      [responsibleArea, employeeId]
    );
  },

  getEmployeeById: (employeeId) => {
    return db.query('SELECT * FROM employees WHERE id = ?', [employeeId]);
  },

  setPreferredEmployeeForRecurringPackage: (recurringPackageId, employeeId) => {
    return db.query(
      'UPDATE recurring_packages SET preferredEmployeeId = ? WHERE id = ?',
      [employeeId, recurringPackageId]
    );
  },

  changePassword: async (managerId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE managers SET password = ?, modified = NOW() WHERE id = ?',
      [hashedPassword, managerId]
    );
  }
};

module.exports = ManagerModel;

