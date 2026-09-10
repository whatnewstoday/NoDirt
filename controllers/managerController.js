const Manager = require('../models/managerModel');
const Customer = require('../models/customerModel');
const { generateManagerToken } = require('../utils/jwtHelper');
const { sendEmployeeAssignedEmail } = require('../utils/emailService');

// Helper: tính ngày buổi kế tiếp của gói định kỳ (dùng local date, không UTC)
const toLocalDateOnly = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const computeNextRecurringDate = (currentDateStr, frequency, dayOfWeek, dayOfMonth) => {
  // Parse local để tránh lệch ngày UTC+7
  let current;
  if (typeof currentDateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(currentDateStr)) {
    const [y, mo, d] = currentDateStr.slice(0, 10).split('-').map(Number);
    current = new Date(y, mo - 1, d);
  } else {
    current = new Date(currentDateStr);
  }
  if (Number.isNaN(current.getTime())) return null;
  if (frequency === 'weekly') {
    const next = new Date(current);
    next.setDate(next.getDate() + 7);
    return toLocalDateOnly(next);
  }
  if (frequency === 'monthly') {
    const dom = dayOfMonth || current.getDate();
    const next = new Date(current.getFullYear(), current.getMonth() + 1, dom);
    return toLocalDateOnly(next);
  }
  return null;
};


const managerController = {
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email/username và mật khẩu'
        });
      }

      let managers;
      if (username.includes('@')) {
        [managers] = await Manager.getManagerByEmail(username);
      } else {
        [managers] = await Manager.getManagerByUsername(username);
      }

      if (!managers || managers.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email/Username hoặc mật khẩu không đúng'
        });
      }

      const manager = managers[0];
      const isValidPassword = await Manager.verifyPassword(password, manager.password);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email/Username hoặc mật khẩu không đúng'
        });
      }

      req.session.user = {
        id: manager.id,
        username: manager.username,
        name: manager.name,
        email: manager.email,
        role: 'manager'
      };

      const token = generateManagerToken(manager);

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          id: manager.id,
          username: manager.username,
          name: manager.name,
          email: manager.email,
          role: 'manager'
        },
        token
      });
    } catch (error) {
      console.error('Manager login error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi đăng nhập'
      });
    }
  },

  
  logout: async (req, res) => {
    try {
      req.session.destroy();
      res.status(200).json({
        success: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      console.error('Manager logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng xuất'
      });
    }
  },

  
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email'
        });
      }

      const [managers] = await Manager.getManagerByEmail(email);
      if (!managers || managers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu'
        });
      }

      const manager = managers[0];
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 giờ

      await Manager.saveResetPasswordToken(email, resetToken, resetTokenExpiry);

      try {
        const { sendResetPasswordEmail } = require('../utils/emailService');
        await sendResetPasswordEmail(email, manager.name, resetToken, 'manager');
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

  
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp token và mật khẩu mới'
        });
      }

      
      const [managers] = await Manager.findByResetToken(token);
      if (!managers || managers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }

      
      await Manager.resetPassword(token, newPassword);

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

  
  getProfile: async (req, res) => {
    try {
      const managerId = req.user.userId; 
      const [managers] = await Manager.getManagerById(managerId);

      if (!managers || managers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin manager'
        });
      }

      res.status(200).json({
        success: true,
        data: managers[0]
      });
    } catch (error) {
      console.error('Get manager profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin manager'
      });
    }
  },

  
  updateProfile: async (req, res) => {
    try {
      const managerId = req.user.userId; 
      const { name, email, phoneNumber } = req.body;

      const [result] = await Manager.updateManager(managerId, { name, email, phoneNumber });

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy manager để cập nhật'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin thành công'
      });
    } catch (error) {
      console.error('Update manager profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin'
      });
    }
  },

  

  
  getDashboard: async (req, res) => {
    try {
      const stats = await Manager.getDashboardStats();
      const [pendingBookings] = await Manager.getPendingBookings();
      const [activeBookings] = await Manager.getActiveBookings();

      res.status(200).json({
        success: true,
        data: {
          stats,
          recentPending: pendingBookings.slice(0, 5),
          recentActive: activeBookings.slice(0, 5)
        }
      });
    } catch (error) {
      console.error('Get manager dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải dashboard'
      });
    }
  },

  

  
  getAllBookings: async (req, res) => {
    try {
      const [bookings] = await Manager.getAllBookings();

      
      const mappedBookings = bookings.map(booking => ({
        id: booking.id,
        customerId: booking.idCustomer,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        serviceId: booking.idService,
        serviceName: booking.serviceName,
        employeeId: booking.idEmployee,
        employeeName: booking.employeeName,
        bookingDate: booking.bookingDay,
        cleaningTime: booking.cleaningTime,
        address: booking.address,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        note: booking.note,
        createdAt: booking.createdAt
      }));

      res.status(200).json({
        success: true,
        data: mappedBookings
      });
    } catch (error) {
      console.error('Get all bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách booking'
      });
    }
  },

  
  getPendingBookings: async (req, res) => {
    try {
      const [bookings] = await Manager.getPendingBookings();

      const mappedBookings = bookings.map(booking => ({
        id: booking.id,
        customerId: booking.idCustomer,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        serviceId: booking.idService,
        serviceName: booking.serviceName,
        bookingDate: booking.bookingDay,
        cleaningTime: booking.cleaningTime,
        address: booking.address,
        totalPrice: booking.totalPrice,
        status: booking.status,
        note: booking.note,
        createdAt: booking.createdAt
      }));

      res.status(200).json({
        success: true,
        data: mappedBookings
      });
    } catch (error) {
      console.error('Get pending bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải booking chờ phân công'
      });
    }
  },


  getActiveBookings: async (req, res) => {
    try {
      const [bookings] = await Manager.getActiveBookings();

      const mappedBookings = bookings.map(booking => ({
        id: booking.id,
        customerId: booking.idCustomer,
        customerName: booking.customerName,
        serviceId: booking.idService,
        serviceName: booking.serviceName,
        employeeId: booking.idEmployee,
        employeeName: booking.employeeName,
        employeePhone: booking.employeePhone,
        bookingDate: booking.bookingDay,
        cleaningTime: booking.cleaningTime,
        address: booking.address,
        totalPrice: booking.totalPrice ?? booking.totalFee ?? 0,
        status: booking.status,
        createdAt: booking.createdAt
      }));

      res.status(200).json({
        success: true,
        data: mappedBookings
      });
    } catch (error) {
      console.error('Get active bookings error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải booking đang thực hiện'
      });
    }
  },

  getBookingDetail: async (req, res) => {
    try {
      const { id } = req.params;
      const [bookings] = await Manager.getBookingById(id);

      if (!bookings || bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy booking'
        });
      }

      const booking = bookings[0];

      res.status(200).json({
        success: true,
        data: {
          id: booking.id,
          customerId: booking.idCustomer,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          customerAddress: booking.customerAddress,
          serviceId: booking.idService,
          serviceName: booking.serviceName,
          serviceDescription: booking.description,
          serviceDuration: booking.duration,
          servicePrice: booking.basicPrice,
          employeeId: booking.idEmployee,
          employeeName: booking.employeeName,
          employeeEmail: booking.employeeEmail,
          employeePhone: booking.employeePhone,
          employeeArea: booking.employeeArea,
          bookingDate: booking.bookingDay,
          cleaningTime: booking.cleaningTime,
          address: booking.address,
          totalPrice: booking.totalPrice,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          note: booking.note,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        }
      });
    } catch (error) {
      console.error('Get booking detail error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải chi tiết booking'
      });
    }
  },

  assignEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const { employeeId } = req.body;

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn nhân viên'
        });
      }

      const [bookings] = await Manager.getBookingById(id);
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy booking'
        });
      }

      const booking = bookings[0];

      const isAvailable = await Manager.checkEmployeeAvailability(
        employeeId,
        booking.bookingDay,
        booking.cleaningTime,
        booking.duration
      );

      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'Nhân viên không rảnh vào thời điểm này'
        });
      }

      await Manager.assignEmployeeToBooking(id, employeeId);
      if (booking.recurringPackageId) {
        await Manager.setPreferredEmployeeForRecurringPackage(booking.recurringPackageId, employeeId);
      }

      // Gửi email thông báo phân công cho khách hàng (fire-and-forget)
      try {
        const [updatedBookings] = await Manager.getBookingById(id);
        if (updatedBookings && updatedBookings.length > 0) {
          const b = updatedBookings[0];
          if (b.customerEmail) {
            sendEmployeeAssignedEmail(b.customerEmail, b.customerName, {
              serviceName: b.serviceName,
              bookingDay: b.bookingDay,
              cleaningTime: b.cleaningTime,
              address: b.address,
              employeeName: b.employeeName,
              employeePhone: b.employeePhone,
            }).catch(err => console.error('Email phân công warning:', err.message));
          }
        }
      } catch (emailErr) {
        console.error('Email phân công warning (non-fatal):', emailErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'Phân công nhân viên thành công'
      });
    } catch (error) {
      console.error('Assign employee error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi phân công nhân viên'
      });
    }
  },

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

      await Manager.updateBookingStatus(id, status);

      // Khi hoàn thành buổi định kỳ, tự động tiến nextBookingDate sang buổi kế tiếp
      if (status === 'completed') {
        try {
          const [bookings] = await Manager.getBookingById(id);
          const booking = bookings && bookings[0];
          if (booking && booking.recurringPackageId && booking.recurringFrequency) {
            const nextDate = computeNextRecurringDate(
              booking.recurringNextBookingDate || booking.bookingDay,
              booking.recurringFrequency,
              booking.recurringDayOfWeek,
              booking.recurringDayOfMonth
            );
            if (nextDate) {
              await Customer.advanceRecurringNextDate(booking.recurringPackageId, nextDate);
            }
          }
        } catch (recurringErr) {
          console.error('Advance recurring nextBookingDate (manager) warning (non-fatal):', recurringErr.message);
        }
      }


      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái thành công'
      });
    } catch (error) {
      console.error('Update booking status error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái'
      });
    }
  },

  getAllEmployees: async (req, res) => {
    try {
      const [employees] = await Manager.getAllEmployees();

      res.status(200).json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Get all employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách nhân viên'
      });
    }
  },

  getAvailableEmployees: async (req, res) => {
    try {
      const [employees] = await Manager.getAvailableEmployees();

      res.status(200).json({
        success: true,
        data: employees
      });
    } catch (error) {
      console.error('Get available employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách nhân viên rảnh'
      });
    }
  },

  suggestEmployees: async (req, res) => {
    try {
      const { bookingId } = req.params;

      const [bookings] = await Manager.getBookingById(bookingId);
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy booking'
        });
      }

      const booking = bookings[0];

      const areaMatch = booking.address ? booking.address.match(/Quận\s+\d+|Quận\s+[A-Za-z]+/i) : null;
      const customerArea = areaMatch ? areaMatch[0] : null;

      const [employees] = await Manager.suggestEmployees(
        booking.bookingDay,
        booking.cleaningTime,
        booking.duration,
        customerArea,
        booking.preferredEmployeeId || null
      );

      res.status(200).json({
        success: true,
        data: employees.map(emp => ({
          ...emp,
          isPreferredMatch: emp.preferredMatch === 1,
          isAreaMatch: emp.areaMatch === 1,
          availability: 'available' 
        }))
      });
    } catch (error) {
      console.error('Suggest employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi gợi ý nhân viên'
      });
    }
  },

  semiAutoAssign: async (req, res) => {
    try {
      const { id } = req.params;
      const [bookings] = await Manager.getBookingById(id);
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy booking'
        });
      }

      const booking = bookings[0];
      const areaMatch = booking.address ? booking.address.match(/Quận\s+\d+|Quận\s+[A-Za-z]+/i) : null;
      const customerArea = areaMatch ? areaMatch[0] : null;

      const [candidates] = await Manager.suggestEmployees(
        booking.bookingDay,
        booking.cleaningTime,
        booking.duration,
        customerArea,
        booking.preferredEmployeeId || null
      );

      if (!candidates || candidates.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Không có nhân viên phù hợp để phân công tự động'
        });
      }

      const selected = candidates[0];
      await Manager.assignEmployeeToBooking(id, selected.id);
      if (booking.recurringPackageId) {
        await Manager.setPreferredEmployeeForRecurringPackage(booking.recurringPackageId, selected.id);
      }

      // Gửi email thông báo phân công cho khách hàng (fire-and-forget)
      try {
        const [updatedBookings] = await Manager.getBookingById(id);
        if (updatedBookings && updatedBookings.length > 0) {
          const b = updatedBookings[0];
          if (b.customerEmail) {
            sendEmployeeAssignedEmail(b.customerEmail, b.customerName, {
              serviceName: b.serviceName,
              bookingDay: b.bookingDay,
              cleaningTime: b.cleaningTime,
              address: b.address,
              employeeName: b.employeeName,
              employeePhone: b.employeePhone,
            }).catch(err => console.error('Email phân công bán tự động warning:', err.message));
          }
        }
      } catch (emailErr) {
        console.error('Email phân công bán tự động warning (non-fatal):', emailErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'Phân công bán tự động thành công',
        data: {
          employeeId: selected.id,
          employeeName: selected.name,
          preferredMatch: selected.preferredMatch === 1,
          areaMatch: selected.areaMatch === 1
        }
      });
    } catch (error) {
      console.error('Semi auto assign error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi phân công bán tự động'
      });
    }
  },

  getEmployeeSchedule: async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      const [schedule] = await Manager.getEmployeeSchedule(employeeId, startDate, endDate);

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Get employee schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải lịch nhân viên'
      });
    }
  },

  getBookingsByDate: async (req, res) => {
    try {
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ngày'
        });
      }

      const [bookings] = await Manager.getBookingsByDate(date);

      res.status(200).json({
        success: true,
        data: bookings
      });
    } catch (error) {
      console.error('Get bookings by date error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải booking theo ngày'
      });
    }
  },

  createEmployeeRequest: async (req, res) => {
    try {
      const managerId = req.user.id;
      console.log('Backend - Create Request - Manager ID:', managerId);
      console.log('Backend - Create Request - User:', req.user);
      const { employeeName, employeeEmail, employeePhone, responsibleArea, requestNote } = req.body;
      console.log('Backend - Create Request - Body:', req.body);

      if (!managerId) {
        return res.status(401).json({
          success: false,
          message: 'Không xác định được Manager ID'
        });
      }

      if (!employeeName || !employeeEmail) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tên và email nhân viên'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employeeEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ'
        });
      }

      const emailExists = await Manager.checkEmployeeEmailExists(employeeEmail);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã được sử dụng bởi nhân viên khác'
        });
      }

      const emailInPending = await Manager.checkEmailInPendingRequests(employeeEmail);
      if (emailInPending) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã có trong danh sách chờ duyệt'
        });
      }

      await Manager.createEmployeeRequest({
        idManager: managerId,
        employeeName,
        employeeEmail,
        employeePhone,
        responsibleArea,
        requestNote
      });

      res.status(201).json({
        success: true,
        message: 'Tạo yêu cầu thành công. Vui lòng chờ admin phê duyệt.'
      });
    } catch (error) {
      console.error('Create employee request error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo yêu cầu'
      });
    }
  },

  getMyEmployeeRequests: async (req, res) => {
    try {
      const managerId = req.user.id;
      console.log('Backend - Manager ID:', managerId);
      const [requests] = await Manager.getEmployeeRequestsByManager(managerId);
      console.log('Backend - Manager requests result:', requests);
      console.log('Backend - Manager requests count:', requests?.length);

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

  getEmployeeRequestDetail: async (req, res) => {
    try {
      const managerId = req.user.id;
      const { id } = req.params;

      const [requests] = await Manager.getEmployeeRequestByIdForManager(id, managerId);

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

  updateEmployeeRequest: async (req, res) => {
    try {
      const managerId = req.user.id;
      const { id } = req.params;
      const { employeeName, employeeEmail, employeePhone, responsibleArea, requestNote } = req.body;

      if (!employeeName || !employeeEmail) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp tên và email nhân viên'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(employeeEmail)) {
        return res.status(400).json({
          success: false,
          message: 'Email không hợp lệ'
        });
      }

      const emailExists = await Manager.checkEmployeeEmailExists(employeeEmail);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã được sử dụng bởi nhân viên khác'
        });
      }

      const emailInPending = await Manager.checkEmailInPendingRequests(employeeEmail, id);
      if (emailInPending) {
        return res.status(409).json({
          success: false,
          message: 'Email này đã có trong danh sách chờ duyệt'
        });
      }

      const [result] = await Manager.updateEmployeeRequest(id, managerId, {
        employeeName,
        employeeEmail,
        employeePhone,
        responsibleArea,
        requestNote
      });

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu hoặc yêu cầu không thể chỉnh sửa'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật yêu cầu thành công'
      });
    } catch (error) {
      console.error('Update employee request error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật yêu cầu'
      });
    }
  },

  cancelEmployeeRequest: async (req, res) => {
    try {
      const managerId = req.user.id;
      const { id } = req.params;

      const [result] = await Manager.cancelEmployeeRequest(id, managerId);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu hoặc yêu cầu không thể hủy'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Đã hủy yêu cầu thành công'
      });
    } catch (error) {
      console.error('Cancel employee request error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy yêu cầu'
      });
    }
  },

  updateEmployeeArea: async (req, res) => {
    try {
      const { id } = req.params;
      const { responsibleArea } = req.body;

      if (!responsibleArea) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp khu vực phụ trách'
        });
      }

      const [employees] = await Manager.getEmployeeById(id);
      if (!employees || employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy nhân viên'
        });
      }

      const [result] = await Manager.updateEmployeeArea(id, responsibleArea);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không thể cập nhật khu vực nhân viên'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật khu vực phụ trách thành công'
      });
    } catch (error) {
      console.error('Update employee area error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật khu vực nhân viên'
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const managerId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
        });
      }

      const [managers] = await Manager.getManagerByUsername(req.user.username);
      if (!managers || managers.length === 0) {
        const [managersByEmail] = await Manager.getManagerByEmail(req.user.email);
        if (!managersByEmail || managersByEmail.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy thông tin manager'
          });
        }
        var manager = managersByEmail[0];
      } else {
        var manager = managers[0];
      }

      const isValidPassword = await Manager.verifyPassword(currentPassword, manager.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      await Manager.changePassword(managerId, newPassword);

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

module.exports = managerController;

