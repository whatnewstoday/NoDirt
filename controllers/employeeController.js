const Employee = require('../models/employeeModel');
const Customer = require('../models/customerModel');
const { generateEmployeeToken } = require('../utils/jwtHelper');
const { decrypt: decryptAccess } = require('../utils/accessCrypto');

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


const REVEAL_MINUTES_BEFORE = 30;

const combineBookingDateTime = (bookingDay, cleaningTime) => {
  if (!bookingDay || !cleaningTime) return null;
  const datePart = new Date(bookingDay);
  if (Number.isNaN(datePart.getTime())) return null;
  const [h = '0', m = '0', s = '0'] = String(cleaningTime).split(':');
  datePart.setHours(Number(h) || 0, Number(m) || 0, Number(s) || 0, 0);
  return datePart;
};

const employeeController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email và mật khẩu'
        });
      }

      const [employees] = await Employee.getEmployeeByEmail(email);
      if (!employees || employees.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      const employee = employees[0];

      const isValidPassword = await Employee.verifyPassword(password, employee.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      req.session.user = {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phoneNumber: employee.phoneNumber,
        role: 'employee'
      };

      const token = generateEmployeeToken(employee);

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        token: token,
        data: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          responsibleArea: employee.responsibleArea
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

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email'
        });
      }

      const [employees] = await Employee.getEmployeeByEmail(email);
      if (!employees || employees.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu'
        });
      }

      const employee = employees[0];
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 giờ

      await Employee.saveResetPasswordToken(email, resetToken, resetTokenExpiry);

      try {
        const { sendResetPasswordEmail } = require('../utils/emailService');
        await sendResetPasswordEmail(email, employee.name, resetToken, 'employee');
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

      const [employees] = await Employee.findByResetToken(token);
      if (!employees || employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }

      await Employee.resetPassword(token, newPassword);

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

  viewJobAccessInfo: async (req, res) => {
    try {
      const employeeId = req.user.userId;
      const { bookingId } = req.params;

      const booking = await Employee.getBookingAccessInfo(bookingId, employeeId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy công việc hoặc bạn không có quyền xem' });
      }

      // Ưu tiên snapshot (chụp lúc đặt); fallback sang thông tin hiện tại của khách
      const hasSnapshot = booking.lockboxPinEncSnapshot || booking.condoGuideEncSnapshot || booking.accessNoteEncSnapshot;
      const accessMethod = hasSnapshot
        ? (booking.accessMethodSnapshot || 'none')
        : (booking.liveAccessMethod || 'none');
      const pinEnc        = booking.lockboxPinEncSnapshot   || booking.liveLockboxPinEnc   || null;
      const condoEnc      = booking.condoGuideEncSnapshot   || booking.liveCondoGuideEnc   || null;
      const noteEnc       = booking.accessNoteEncSnapshot   || booking.liveAccessNoteEnc   || null;
      const lockboxLoc    = booking.lockboxLocationSnapshot || booking.liveLockboxLocation  || null;

      if (accessMethod === 'none' || (!pinEnc && !condoEnc && !noteEnc)) {
        return res.status(200).json({
          success: true,
          data: {
            unlocked: false,
            reason: 'no_access_info',
            accessMethod,
            message: 'Khách hàng không cấu hình thông tin truy cập đặc biệt.',
          }
        });
      }

      const now = new Date();
      const scheduledAt = combineBookingDateTime(booking.bookingDay, booking.cleaningTime);
      const revealAt = scheduledAt ? new Date(scheduledAt.getTime() - REVEAL_MINUTES_BEFORE * 60 * 1000) : null;

      const ip = req.ip;
      const userAgent = req.headers['user-agent'];

      const status = String(booking.status || '').toLowerCase();

      if (booking.checkOutTime) {
        Employee.logAccessEvent(bookingId, employeeId, 'denied_after_checkout', ip, userAgent).catch(() => {});
        return res.status(403).json({
          success: false,
          data: {
            unlocked: false,
            reason: 'after_checkout',
            message: 'Bạn đã check-out, không thể xem lại thông tin truy cập.',
          }
        });
      }

      if (status === 'cancelled' || status === 'completed') {
        Employee.logAccessEvent(bookingId, employeeId, 'denied_wrong_status', ip, userAgent).catch(() => {});
        return res.status(403).json({
          success: false,
          data: {
            unlocked: false,
            reason: 'wrong_status',
            message: 'Công việc đã kết thúc hoặc bị hủy, không còn quyền xem.',
          }
        });
      }

      const isInProgress = status === 'in progress' || status === 'processing';
      const isCheckedIn  = !!booking.checkInTime;
      const inTimeWindow = revealAt && now >= revealAt;

      if (!isInProgress && !isCheckedIn && !inTimeWindow) {
        Employee.logAccessEvent(bookingId, employeeId, 'denied_too_early', ip, userAgent).catch(() => {});
        return res.status(403).json({
          success: false,
          data: {
            unlocked: false,
            reason: 'too_early',
            revealAt: revealAt ? revealAt.toISOString() : null,
            message: revealAt
              ? `Thông tin sẽ mở khóa lúc ${revealAt.toLocaleString('vi-VN')} (30 phút trước giờ làm việc).`
              : 'Chưa đến thời gian xem thông tin truy cập.',
          }
        });
      }

      Employee.logAccessEvent(bookingId, employeeId, 'view_access', ip, userAgent).catch(() => {});

      const lockboxPin = decryptAccess(pinEnc);
      const condoGuide = decryptAccess(condoEnc);
      const accessNote = decryptAccess(noteEnc);

      res.status(200).json({
        success: true,
        data: {
          unlocked: true,
          accessMethod,
          lockboxLocation: lockboxLoc,
          lockboxPin,
          condoGuide,
          accessNote,
          revealAt: revealAt ? revealAt.toISOString() : null,
          autoHideAt: null,
          warning: 'Tuyệt đối bảo mật: Không chia sẻ thông tin này cho bất kỳ ai. Mã sẽ tự ẩn sau khi check-out.',
        }
      });
    } catch (error) {
      console.error('viewJobAccessInfo error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin truy cập' });
    }
  },

  viewAssignedJobs: async (req, res) => {
    try {
      const employeeId = req.user.userId;

      const [jobs] = await Employee.getAssignedJobs(employeeId);

      res.status(200).json({
        success: true,
        message: 'Danh sách công việc được giao',
        data: jobs
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách công việc'
      });
    }
  },

  updateJobStatus: async (req, res) => {
    try {
      const employeeId = req.user.userId;
      const { id_booking, bookingId, status } = req.body;

      const bookingIdValue = id_booking || bookingId;
      if (!bookingIdValue || !status) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp ID booking và trạng thái mới'
        });
      }

      const normalizeStatus = (value = '') =>
        value
          .toString()
          .toLowerCase()
          .trim()
          .replace(/_/g, ' ')
          .replace(/\s+/g, ' ');

      const normalizedStatus = normalizeStatus(status);
      const validStatuses = ['in progress', 'completed'];
      if (!validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ. Bạn chỉ có thể cập nhật sang trạng thái "in progress" hoặc "completed".'
        });
      }

      const hasPermission = await Employee.checkJobOwnership(bookingIdValue, employeeId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền cập nhật công việc này'
        });
      }

      await Employee.updateJobStatus(bookingIdValue, employeeId, normalizedStatus);

      // Khi hoàn thành buổi định kỳ, tự động cập nhật nextBookingDate sang buổi tiếp theo
      if (normalizedStatus === 'completed') {
        try {
          const booking = await Employee.getBookingWithRecurringInfo(bookingIdValue);
          if (booking && booking.recurringPackageId && booking.frequency) {
            const nextDate = computeNextRecurringDate(
              booking.nextBookingDate || booking.bookingDay,
              booking.frequency,
              booking.dayOfWeek,
              booking.dayOfMonth
            );
            if (nextDate) {
              await Customer.advanceRecurringNextDate(booking.recurringPackageId, nextDate);
            }
          }
        } catch (recurringErr) {
          console.error('Advance recurring nextBookingDate warning (non-fatal):', recurringErr.message);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Cập nhật trạng thái công việc thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái công việc'
      });
    }
  },

  checkInJob: async (req, res) => {
    try {
      const employeeId = req.user.userId;
      const { bookingId } = req.params;

      const hasPermission = await Employee.checkJobOwnership(bookingId, employeeId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền check-in cho công việc này'
        });
      }

      const [result] = await Employee.checkInJob(bookingId, employeeId);
      if (!result.affectedRows) {
        return res.status(400).json({
          success: false,
          message: 'Công việc này đã check-in hoặc không hợp lệ'
        });
      }

      // Nếu booking chưa có access snapshot (khách hàng cập nhật profile sau khi đặt lịch),
      // re-snapshot từ profile hiện tại để nhân viên có thể xem thông tin truy cập ngay sau check-in.
      try {
        const booking = await Employee.getBookingForSnapshot(bookingId, employeeId);
        if (
          booking &&
          !booking.lockboxPinEncSnapshot &&
          !booking.condoGuideEncSnapshot &&
          !booking.accessNoteEncSnapshot
        ) {
          const profile = await Customer.getAccessProfile(booking.idCustomer);
          if (profile) {
            await Employee.refreshAccessSnapshot(bookingId, {
              accessMethodSnapshot:    profile.accessMethod     || 'none',
              lockboxLocationSnapshot: profile.lockboxLocation  || null,
              lockboxPinEncSnapshot:   profile.lockboxPinEnc    || null,
              condoGuideEncSnapshot:   profile.condoGuideEnc    || null,
              accessNoteEncSnapshot:   profile.accessNoteEnc    || null,
            });
          }
        }
      } catch (snapshotErr) {
        // Non-fatal: snapshot refresh thất bại không ảnh hưởng check-in
        console.error('Snapshot refresh warning (non-fatal):', snapshotErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'Check-in thành công'
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi check-in'
      });
    }
  },

  checkOutJob: async (req, res) => {
    try {
      const employeeId = req.user.userId;
      const { bookingId } = req.params;

      const hasPermission = await Employee.checkJobOwnership(bookingId, employeeId);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền check-out cho công việc này'
        });
      }

      const [result] = await Employee.checkOutJob(bookingId, employeeId);
      if (!result.affectedRows) {
        return res.status(400).json({
          success: false,
          message: 'Bạn cần check-in trước khi check-out'
        });
      }

      // Sau checkout (status → completed), tự động tiến ngày gói định kỳ
      try {
        const booking = await Employee.getBookingWithRecurringInfo(bookingId);
        if (booking && booking.recurringPackageId && booking.frequency) {
          const nextDate = computeNextRecurringDate(
            booking.nextBookingDate || booking.bookingDay,
            booking.frequency,
            booking.dayOfWeek,
            booking.dayOfMonth
          );
          if (nextDate) {
            await Customer.advanceRecurringNextDate(booking.recurringPackageId, nextDate);
          }
        }
      } catch (recurringErr) {
        console.error('Advance recurring nextBookingDate (checkout) warning (non-fatal):', recurringErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'Check-out thành công'
      });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi check-out'
      });
    }
  },

  viewProfile: async (req, res) => {
    try {
      const employeeId = req.user.userId;
      const [employees] = await Employee.getEmployeeById(employeeId);

      if (!employees || employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin nhân viên'
        });
      }

      const employee = employees[0];
      delete employee.password;

      res.status(200).json({
        success: true,
        message: 'Thông tin cá nhân',
        data: employee
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin cá nhân'
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const employeeId = req.user.userId;
      const { name, phoneNumber, responsibleArea } = req.body;

      await Employee.updateEmployee(employeeId, { name, phoneNumber, responsibleArea });

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin'
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const employeeId = req.user.userId;
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

      const [employees] = await Employee.getEmployeeById(employeeId);
      if (!employees || employees.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin nhân viên'
        });
      }

      const employee = employees[0];

      const isValidPassword = await Employee.verifyPassword(currentPassword, employee.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      await Employee.changePassword(employeeId, newPassword);

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

module.exports = employeeController;

