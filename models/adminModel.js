const db = require('../config/db');
const bcrypt = require('bcrypt');

const AdminModel = {
  // ==================== ADMIN MANAGEMENT ====================

  // Tìm admin theo username
  getAdminByUsername: (username) => {
    return db.query('SELECT * FROM admin WHERE username = ?', [username]);
  },

  // Tìm admin theo email
  getAdminByEmail: (email) => {
    return db.query('SELECT * FROM admin WHERE email = ?', [email]);
  },

  // Tìm admin theo ID
  getAdminById: (id) => {
    return db.query('SELECT * FROM admin WHERE id = ?', [id]);
  },

  // Đếm số lượng admin trong hệ thống
  countAdmins: async () => {
    const [result] = await db.query('SELECT COUNT(*) as count FROM admin');
    return result[0].count;
  },

  // Tạo admin mới (chỉ admin khác mới tạo được, hoặc seed)
  createAdmin: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return db.query(
      'INSERT INTO admin (username, password, name, email) VALUES (?, ?, ?, ?)',
      [data.username, hashedPassword, data.name, data.email]
    );
  },

  // Xác thực mật khẩu
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  getAllAdmins: () => {
    return db.query('SELECT id, username, name, email FROM admin');
  },

  // Lưu reset password token
  saveResetPasswordToken: (email, token, expiry) => {
    return db.query(
      'UPDATE admin SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?',
      [token, expiry, email]
    );
  },

  // Tìm admin theo reset token
  findByResetToken: (token) => {
    return db.query(
      'SELECT * FROM admin WHERE resetPasswordToken = ? AND resetPasswordExpires > NOW()',
      [token]
    );
  },

  // Reset mật khẩu
  resetPassword: async (token, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE admin SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE resetPasswordToken = ?',
      [hashedPassword, token]
    );
  },

  // ==================== SERVICE MANAGEMENT ====================

  // Lấy tất cả dịch vụ
  getAllServices: () => {
    return db.query('SELECT * FROM service');
  },

  // Lấy dịch vụ theo ID
  getServiceById: (id) => {
    return db.query('SELECT * FROM service WHERE id = ?', [id]);
  },

  // Tạo dịch vụ mới
  createService: (data) => {
    return db.query(
      'INSERT INTO service (serviceName, description, basicPrice, duration) VALUES (?, ?, ?, ?)',
      [data.serviceName, data.description, data.basicPrice, data.duration]
    );
  },

  // Cập nhật dịch vụ
  updateService: (id, data) => {
    return db.query(
      'UPDATE service SET serviceName = ?, description = ?, basicPrice = ?, duration = ? WHERE id = ?',
      [data.serviceName, data.description, data.basicPrice, data.duration, id]
    );
  },

  // Xóa dịch vụ
  deleteService: (id) => {
    return db.query('DELETE FROM service WHERE id = ?', [id]);
  },

  // ==================== EMPLOYEE MANAGEMENT ====================

  // Lấy tất cả nhân viên
  getAllEmployees: () => {
    return db.query('SELECT * FROM employees');
  },

  // Lấy nhân viên theo ID
  getEmployeeById: (id) => {
    return db.query('SELECT * FROM employees WHERE id = ?', [id]);
  },

  // Tạo nhân viên mới
  createEmployee: async (data) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return db.query(
      'INSERT INTO employees (name, email, password, phoneNumber, responsibleArea) VALUES (?, ?, ?, ?, ?)',
      [data.name, data.email, hashedPassword, data.phoneNumber, data.responsibleArea]
    );
  },

  // Cập nhật nhân viên
  updateEmployee: (id, data) => {
    return db.query(
      'UPDATE employees SET name = ?, email = ?, phoneNumber = ?, responsibleArea = ? WHERE id = ?',
      [data.name, data.email, data.phoneNumber, data.responsibleArea, id]
    );
  },

  // Xóa nhân viên
  deleteEmployee: (id) => {
    return db.query('DELETE FROM employees WHERE id = ?', [id]);
  },

  // Kiểm tra email nhân viên đã tồn tại
  checkEmployeeEmailExists: async (email, excludeId = null) => {
    let query = 'SELECT id FROM employees WHERE email = ?';
    let params = [email];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [result] = await db.query(query, params);
    return result && result.length > 0;
  },

  // ==================== BOOKING MANAGEMENT ====================

  // Lấy tất cả booking
  getAllBookings: () => {
    return db.query(
      `SELECT 
        bs.*,
        s.serviceName,
        c.name as customerName,
        c.email as customerEmail,
        c.phoneNumber as customerPhone,
        e.name as employeeName,
        e.email as employeeEmail
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       LEFT JOIN employees e ON bs.idEmployee = e.id
       ORDER BY bs.bookingDay DESC, bs.cleaningTime DESC`
    );
  },

  // Lấy booking theo ID
  getBookingById: (id) => {
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
       WHERE bs.id = ?`,
      [id]
    );
  },

  // Cập nhật trạng thái booking
  updateBookingStatus: (id, status) => {
    return db.query(
      'UPDATE bookingservice SET status = ? WHERE id = ?',
      [status, id]
    );
  },

  // Gán nhân viên cho booking
  assignEmployeeToBooking: (bookingId, employeeId) => {
    return db.query(
      'UPDATE bookingservice SET idEmployee = ?, status = ? WHERE id = ?',
      [employeeId, 'confirmed', bookingId]
    );
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: (id, paymentStatus) => {
    return db.query(
      'UPDATE bookingservice SET paymentStatus = ? WHERE id = ?',
      [paymentStatus, id]
    );
  },

  // Xóa booking
  deleteBooking: (id) => {
    return db.query('DELETE FROM bookingservice WHERE id = ?', [id]);
  },

  // ==================== DASHBOARD & STATISTICS ====================

  // Thống kê tổng quan
  getDashboardStats: async () => {
    const [services] = await db.query('SELECT COUNT(*) as count FROM service');
    const [customers] = await db.query('SELECT COUNT(*) as count FROM customers');
    const [employees] = await db.query('SELECT COUNT(*) as count FROM employees');
    const [bookings] = await db.query('SELECT COUNT(*) as count FROM bookingservice');
    const [pendingBookings] = await db.query('SELECT COUNT(*) as count FROM bookingservice WHERE status IN ("booked", "pending")');
    
    // Đếm employee requests
    let totalRequests = [{ count: 0 }];
    let pendingRequests = [{ count: 0 }];
    try {
      [totalRequests] = await db.query('SELECT COUNT(*) as count FROM employee_requests');
    } catch (err) {
      totalRequests = [{ count: 0 }];
    }
    try {
      [pendingRequests] = await db.query('SELECT COUNT(*) as count FROM employee_requests WHERE status = "pending"');
    } catch (err) {
      pendingRequests = [{ count: 0 }];
    }

    return {
      totalServices: services[0]?.count || 0,
      totalCustomers: customers[0]?.count || 0,
      totalEmployees: employees[0]?.count || 0,
      totalBookings: bookings[0]?.count || 0,
      pendingBookings: pendingBookings[0]?.count || 0,
      totalRequests: totalRequests[0]?.count || 0,
      pendingRequests: pendingRequests[0]?.count || 0
    };
  },

  // Lấy đơn hàng gần đây
  getRecentBookings: async (limit = 5) => {
    const [bookings] = await db.query(
      `SELECT 
        bs.id,
        bs.bookingDay as bookingDate,
        bs.status,
        s.serviceName,
        c.name as customerName,
        e.name as employeeName
       FROM bookingservice bs
       JOIN service s ON bs.idService = s.id
       JOIN customers c ON bs.idCustomer = c.id
       LEFT JOIN employees e ON bs.idEmployee = e.id
       ORDER BY bs.createdAt DESC
       LIMIT ?`,
      [limit]
    );
    return bookings;
  },

  // Đổi mật khẩu (khi đã đăng nhập)
  changePassword: async (adminId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query(
      'UPDATE admin SET password = ?, modified = NOW() WHERE id = ?',
      [hashedPassword, adminId]
    );
  }
};

module.exports = AdminModel;

