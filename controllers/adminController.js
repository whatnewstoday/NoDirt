const Admin = require('../models/adminModel');
const Manager = require('../models/managerModel');
const Employee = require('../models/employeeModel');
const { generateAdminToken } = require('../utils/jwtHelper');

const adminController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp username và mật khẩu'
        });
      }

      const [admins] = await Admin.getAdminByUsername(username);
      if (!admins || admins.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Username hoặc mật khẩu không đúng'
        });
      }

      const admin = admins[0];
      const isValidPassword = await Admin.verifyPassword(password, admin.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Username hoặc mật khẩu không đúng'
        });
      }

      req.session.user = {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      };

      const token = generateAdminToken(admin);

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        token: token,
        data: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          email: admin.email
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng nhập'
      });
    }
  },

  // Đăng xuất
  logout: (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng xuất'
          });
        }
        res.status(200).json({
          success: true,
          message: 'Đăng xuất thành công'
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng xuất'
      });
    }
  },

  // Quên mật khẩu - Gửi email reset
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email'
        });
      }

      const [admins] = await Admin.getAdminByEmail(email);
      if (!admins || admins.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu'
        });
      }

      const admin = admins[0];
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 giờ

      await Admin.saveResetPasswordToken(email, resetToken, resetTokenExpiry);

      // Gửi email (nếu có email service)
      try {
        const { sendResetPasswordEmail } = require('../utils/emailService');
        await sendResetPasswordEmail(email, admin.name, resetToken, 'admin');
        console.log(` Đã gửi email reset password tới ${email}`);
      } catch (emailError) {
        console.error(' Lỗi khi gửi email:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Lỗi khi gửi email. Vui lòng thử lại sau'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Email hướng dẫn đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý yêu cầu'
      });
    }
  },

  // Reset password với token
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp token và mật khẩu mới'
        });
      }

      // Tìm admin theo token
      const [admins] = await Admin.findByResetToken(token);
      if (!admins || admins.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }

      // Reset password
      await Admin.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập với mật khẩu mới'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đặt lại mật khẩu'
      });
    }
  },

  // Mời admin mới (chỉ admin hiện tại mới làm được)
  inviteAdmin: async (req, res) => {
    try {
      const { username, password, name, email } = req.body;

      if (!username || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin'
        });
      }

      // Kiểm tra username đã tồn tại
      const [existing] = await Admin.getAdminByUsername(username);
      if (existing && existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username đã tồn tại'
        });
      }

      await Admin.createAdmin({ username, password, name, email });

      res.status(201).json({
        success: true,
        message: 'Mời admin mới thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo admin'
      });
    }
  },

  // Tạo manager mới (chỉ admin mới làm được)
  createManager: async (req, res) => {
    try {
      const { username, password, name, email, phoneNumber } = req.body;

      if (!username || !password || !name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin (username, password, name, email)'
        });
      }

      // Kiểm tra username đã tồn tại
      const [existingUsername] = await Manager.getManagerByUsername(username);
      if (existingUsername && existingUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username đã tồn tại'
        });
      }

      // Kiểm tra email đã tồn tại
      const [existingEmail] = await Manager.getManagerByEmail(email);
      if (existingEmail && existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }

      await Manager.createManager({ username, password, name, email, phoneNumber });

      res.status(201).json({
        success: true,
        message: 'Tạo manager mới thành công'
      });
    } catch (error) {
      console.error('Create manager error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo manager'
      });
    }
  },

  // ==================== SERVICE MANAGEMENT ====================

  // Xem tất cả dịch vụ
  getAllServices: async (req, res) => {
    try {
      const [services] = await Admin.getAllServices();
      res.status(200).json({
        success: true,
        message: 'Danh sách dịch vụ',
        data: services
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách dịch vụ'
      });
    }
  },

  // Tạo dịch vụ mới
  createService: async (req, res) => {
    try {
      const { serviceName, description, basicPrice, duration } = req.body;

      if (!serviceName || !basicPrice) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tên dịch vụ và giá cơ bản'
        });
      }

      await Admin.createService({ serviceName, description, basicPrice, duration });

      res.status(201).json({
        success: true,
        message: 'Tạo dịch vụ thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo dịch vụ'
      });
    }
  },

  // Cập nhật dịch vụ
  updateService: async (req, res) => {
    try {
      const { id } = req.params;
      const { serviceName, description, basicPrice, duration } = req.body;

      const [service] = await Admin.getServiceById(id);
      if (!service || service.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ'
        });
      }

      await Admin.updateService(id, { serviceName, description, basicPrice, duration });

      res.status(200).json({
        success: true,
        message: 'Cập nhật dịch vụ thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật dịch vụ'
      });
    }
  },

  // Xóa dịch vụ
  deleteService: async (req, res) => {
    try {
      const { id } = req.params;

      const [service] = await Admin.getServiceById(id);
      if (!service || service.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ'
        });
      }

      await Admin.deleteService(id);

      res.status(200).json({
        success: true,
        message: 'Xóa dịch vụ thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa dịch vụ'
      });
    }
  },

  getAllEmployees: async (req, res) => {
    try {
      const [employees] = await Admin.getAllEmployees();

      // Xóa password trước khi trả về
      employees.forEach(emp => delete emp.password);

      res.status(200).json({
        success: true,
        message: 'Danh sách nhân viên',
        data: employees
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách nhân viên'
      });
    }
  },

  createEmployee: async (req, res) => {
    try {
      const { name, email, password, phoneNumber, responsibleArea } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tên, email và mật khẩu'
        });
      }

      const emailExists = await Admin.checkEmployeeEmailExists(email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }

      await Admin.createEmployee({ name, email, password, phoneNumber, responsibleArea });

      res.status(201).json({
        success: true,
        message: 'Tạo nhân viên thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo nhân viên'
      });
    }
  },

  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phoneNumber, responsibleArea } = req.body;

      const [employee] = await Admin.getEmployeeById(id);
      if (!employee || employee.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên'
        });
      }

      // Kiểm tra email đã tồn tại (trừ chính nhân viên này)
      const emailExists = await Admin.checkEmployeeEmailExists(email, id);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email đã tồn tại'
        });
      }

      await Admin.updateEmployee(id, { name, email, phoneNumber, responsibleArea });

      res.status(200).json({
        success: true,
        message: 'Cập nhật nhân viên thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật nhân viên'
      });
    }
  },

  // Xóa nhân viên
  deleteEmployee: async (req, res) => {
    try {
      const { id } = req.params;

      const [employee] = await Admin.getEmployeeById(id);
      if (!employee || employee.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên'
        });
      }

      await Admin.deleteEmployee(id);

      res.status(200).json({
        success: true,
        message: 'Xóa nhân viên thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa nhân viên'
      });
    }
  },

  // ==================== BOOKING MANAGEMENT ====================

  // Xem tất cả booking
  getAllBookings: async (req, res) => {
    try {
      const [bookings] = await Admin.getAllBookings();
      res.status(200).json({
        success: true,
        message: 'Danh sách đơn đặt lịch',
        data: bookings
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách booking'
      });
    }
  },

  // Cập nhật trạng thái booking
  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['booked', 'confirmed', 'processing', 'in progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ'
        });
      }

      const [booking] = await Admin.getBookingById(id);
      if (!booking || booking.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy booking'
        });
      }

      await Admin.updateBookingStatus(id, status);

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái booking thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái'
      });
    }
  },

  // Cập nhật trạng thái thanh toán
  updatePaymentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentStatus } = req.body;

      const validStatuses = ['unpaid', 'paid'];
      if (!validStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái thanh toán không hợp lệ'
        });
      }

      await Admin.updatePaymentStatus(id, paymentStatus);

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thanh toán thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái thanh toán'
      });
    }
  },

  // ==================== DASHBOARD ====================

  // Thống kê tổng quan
  getDashboard: async (req, res) => {
    try {
      const stats = await Admin.getDashboardStats();
      const recentBookings = await Admin.getRecentBookings(5);
      res.status(200).json({
        success: true,
        message: 'Thống kê tổng quan',
        data: {
          stats,
          recentBookings
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê'
      });
    }
  },

  // EMPLOYEE REQUESTS MANAGEMENT 

  // Lấy tất cả employee requests
  getAllEmployeeRequests: async (req, res) => {
    try {
      const { status } = req.query;

      let requests;
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        [requests] = await Manager.getEmployeeRequestsByStatus(status);
      } else {
        [requests] = await Manager.getAllEmployeeRequests();
      }

      console.log('Backend - getAllEmployeeRequests - Raw result:', requests);
      console.log('Backend - getAllEmployeeRequests - Count:', requests?.length);

      res.status(200).json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('Get employee requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách yêu cầu'
      });
    }
  },

  // Lấy chi tiết employee request
  getEmployeeRequestDetail: async (req, res) => {
    try {
      const { id } = req.params;

      const [requests] = await Manager.getEmployeeRequestById(id);

      if (!requests || requests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu'
        });
      }

      res.status(200).json({
        success: true,
        data: requests[0]
      });
    } catch (error) {
      console.error('Get employee request detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải chi tiết yêu cầu'
      });
    }
  },

  // Approve employee request và tự động tạo nhân viên
  approveEmployeeRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { adminResponse, createEmployee = true, password } = req.body;

      // Lấy thông tin request
      const [requests] = await Manager.getEmployeeRequestById(id);

      if (!requests || requests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu'
        });
      }

      const request = requests[0];

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Yêu cầu này đã được xử lý trước đó'
        });
      }

      // Kiểm tra email có bị trùng không (double check)
      const emailExists = await Manager.checkEmployeeEmailExists(request.employeeEmail);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã được sử dụng. Không thể tạo nhân viên.'
        });
      }

      // Approve request
      await Manager.approveEmployeeRequest(id, adminResponse || 'Đã phê duyệt');

      // Nếu chọn tạo nhân viên luôn
      if (createEmployee) {
        if (!password) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng cung cấp mật khẩu cho nhân viên mới'
          });
        }

        // Tạo nhân viên mới
        await Admin.createEmployee({
          name: request.employeeName,
          email: request.employeeEmail,
          password: password,
          phoneNumber: request.employeePhone,
          responsibleArea: request.responsibleArea
        });

        res.status(200).json({
          success: true,
          message: 'Đã phê duyệt và tạo nhân viên thành công'
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Đã phê duyệt yêu cầu. Bạn có thể tạo nhân viên sau.'
        });
      }
    } catch (error) {
      console.error('Approve employee request error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi phê duyệt yêu cầu'
      });
    }
  },

  // Reject employee request
  rejectEmployeeRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const { adminResponse } = req.body;

      if (!adminResponse) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp lý do từ chối'
        });
      }

      // Lấy thông tin request để kiểm tra
      const [requests] = await Manager.getEmployeeRequestById(id);

      if (!requests || requests.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu'
        });
      }

      const request = requests[0];

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Yêu cầu này đã được xử lý trước đó'
        });
      }

      // Reject request
      await Manager.rejectEmployeeRequest(id, adminResponse);

      res.status(200).json({
        success: true,
        message: 'Đã từ chối yêu cầu'
      });
    } catch (error) {
      console.error('Reject employee request error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi từ chối yêu cầu'
      });
    }
  },

  // Lấy thống kê employee requests
  getEmployeeRequestStats: async (req, res) => {
    try {
      const stats = await Manager.getEmployeeRequestStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Get employee request stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải thống kê yêu cầu'
      });
    }
  },

  // Lấy thông tin admin hiện tại
  getProfile: async (req, res) => {
    try {
      const adminId = req.user.userId;
      const [admins] = await Admin.getAdminById(adminId);

      if (!admins || admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin admin'
        });
      }

      const admin = admins[0];
      delete admin.password;

      res.status(200).json({
        success: true,
        data: admin
      });
    } catch (error) {
      console.error('Get admin profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin admin'
      });
    }
  },

  // Đổi mật khẩu (khi đã đăng nhập)
  changePassword: async (req, res) => {
    try {
      const adminId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Kiểm tra thông tin bắt buộc
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới'
        });
      }

      // Kiểm tra độ dài mật khẩu mới
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      // Lấy thông tin admin
      const [admins] = await Admin.getAdminById(adminId);
      if (!admins || admins.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin admin'
        });
      }

      const admin = admins[0];

      // Xác thực mật khẩu hiện tại
      const isValidPassword = await Admin.verifyPassword(currentPassword, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      // Đổi mật khẩu
      await Admin.changePassword(adminId, newPassword);

      res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đổi mật khẩu'
      });
    }
  }
};

module.exports = adminController;

