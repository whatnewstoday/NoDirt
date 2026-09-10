const Customer = require('../models/customerModel');
const { generateCustomerToken } = require('../utils/jwtHelper');
const { sendResetPasswordEmail, sendBookingConfirmationEmail } = require('../utils/emailService');
const crypto = require('crypto');
const path = require('path');
const { generateContractDocx } = require('../utils/contractDocx');
const { encrypt: encryptAccess, decrypt: decryptAccess, maskPin } = require('../utils/accessCrypto');

// Parse date an toàn: nếu là chuỗi YYYY-MM-DD thì dùng local midnight,
// tránh lỗi lệch ngày do new Date("YYYY-MM-DD") tạo ra UTC midnight → lùi 1 ngày ở UTC+7
const parseDate = (value) => {
  if (!value) return null;
  // Nếu là chuỗi dạng YYYY-MM-DD (hoặc có prefix đó), parse local
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [y, mo, d] = value.slice(0, 10).split('-').map(Number);
    const date = new Date(y, mo - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // Date object hoặc kiểu khác
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};


const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

// Dùng local date (không phải UTC) để tránh lệch ngày khi server ở UTC+7
const toDateOnly = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};


const getAccessSnapshot = async (customerId) => {
  const profile = await Customer.getAccessProfile(customerId);
  if (!profile) return {};
  return {
    accessMethodSnapshot: profile.accessMethod || 'none',
    lockboxLocationSnapshot: profile.lockboxLocation || null,
    lockboxPinEncSnapshot: profile.lockboxPinEnc || null,
    condoGuideEncSnapshot: profile.condoGuideEnc || null,
    accessNoteEncSnapshot: profile.accessNoteEnc || null,
  };
};

const customerController = {
  // Đăng ký tài khoản mới
  register: async (req, res) => {
    try {
      const { name, email, password, phoneNumber, address } = req.body;

      // Kiểm tra thông tin bắt buộc
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin: tên, email và mật khẩu'
        });
      }

      // Kiểm tra email đã tồn tại chưa
      const [existingCustomer] = await Customer.getCustomerByEmail(email);
      if (existingCustomer && existingCustomer.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email đã được sử dụng'
        });
      }

      // Tạo tài khoản mới
      const data = { name, email, password, phoneNumber, address };
      await Customer.createCustomer(data);

      res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi đăng ký tài khoản'
      });
    }
  },

  // Đăng nhập
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Kiểm tra thông tin đăng nhập
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp email và mật khẩu'
        });
      }

      // Tìm khách hàng theo email
      const [customers] = await Customer.getCustomerByEmail(email);
      if (!customers || customers.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      const customer = customers[0];

      // Xác thực mật khẩu
      const isValidPassword = await Customer.verifyPassword(password, customer.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng'
        });
      }

      // Tạo session
      req.session.user = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        role: 'customer'
      };

      // Tạo JWT token sử dụng helper function
      const token = generateCustomerToken(customer);

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        token: token, // JWT token để sử dụng trong Swagger
        data: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phoneNumber: customer.phoneNumber
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
  // Lấy toàn bộ dịch vụ
  listServices: async (req, res) => {
    try {
      const [services] = await Customer.getAllServices();
      res.status(200).json({
        success: true,
        message: 'Danh sách dịch vụ',
        data: services
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách dịch vụ' });
    }
  },

  // Xem chi tiết 1 dịch vụ
  viewServiceDetail: async (req, res) => {
    try {
      const id = req.params.id;
      const [service] = await Customer.getServiceById(id);
      if (!service || service.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
      }
      res.status(200).json({
        success: true,
        message: 'Chi tiết dịch vụ',
        data: service[0]
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết dịch vụ' });
    }
  },

  // Đặt dịch vụ
  bookService: async (req, res) => {
    try {
      // Lấy ID từ session hoặc JWT token
      let customerId;

      if (req.session && req.session.user && req.session.user.id) {
        // Ưu tiên lấy từ session
        customerId = req.session.user.id;
      } else if (req.user && req.user.userId) {
        // Fallback sang JWT token nếu không có session
        customerId = req.user.userId;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Vui lòng đăng nhập trước khi đặt dịch vụ'
        });
      }

      const service = await Customer.getServicePriceById(req.body.id_service);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dịch vụ'
        });
      }

      // Tính phí và thời gian theo diện tích
      const homeSizeSqm = req.body.home_size_sqm ? parseFloat(req.body.home_size_sqm) : null;
      const computedFee = homeSizeSqm && homeSizeSqm > 0
        ? Math.round(service.basicPrice * homeSizeSqm)
        : service.basicPrice;
      const estimatedDuration = homeSizeSqm && homeSizeSqm > 0
        ? Math.round(homeSizeSqm * 3)
        : null;

      const accessSnapshot = await getAccessSnapshot(customerId);
      const data = {
        idCustomer: customerId,
        idService: req.body.id_service,
        idEmployee: null,
        bookingDay: req.body.booking_day,
        cleaningTime: req.body.cleaning_time,
        address: req.body.address,
        homeSizeSqm: homeSizeSqm,
        note: req.body.note,
        paymentMethod: req.body.payment_method,
        totalFee: computedFee,
        bookingType: req.body.booking_type || 'one_time',
        recurringPackageId: req.body.recurring_package_id || null,
        specialInstructions: req.body.special_instructions || null,
        ...accessSnapshot,
      };
      await Customer.bookService(data);

      // Gửi email xác nhận (fire-and-forget)
      try {
        const [customers] = await Customer.getCustomerById(customerId);
        if (customers && customers.length > 0) {
          const customer = customers[0];
          sendBookingConfirmationEmail(customer.email, customer.name, {
            serviceName: service.serviceName,
            bookingType: data.bookingType,
            bookingDay: data.bookingDay,
            cleaningTime: data.cleaningTime,
            address: data.address,
            totalFee: data.totalFee,
          }).catch(err => console.error('Email xác nhận booking warning:', err.message));
        }
      } catch (emailErr) {
        console.error('Email xác nhận booking warning (non-fatal):', emailErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Đặt dịch vụ thành công',
        data: { totalFee: computedFee, estimatedDuration }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi khi đặt dịch vụ' });
    }
  },

  createTrialBooking: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const { id_service, booking_day, cleaning_time, address, note, payment_method, special_instructions, home_size_sqm } = req.body;

      if (!id_service || !booking_day || !cleaning_time || !address) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin buổi dùng thử'
        });
      }

      const service = await Customer.getServicePriceById(id_service);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
      }

      // Tính phí và thời gian theo diện tích
      const homeSizeSqm = home_size_sqm ? parseFloat(home_size_sqm) : null;
      const computedFee = homeSizeSqm && homeSizeSqm > 0
        ? Math.round(service.basicPrice * homeSizeSqm)
        : service.basicPrice;

      const accessSnapshot = await getAccessSnapshot(customerId);
      await Customer.bookService({
        idCustomer: customerId,
        idService: id_service,
        idEmployee: null,
        bookingDay: booking_day,
        cleaningTime: cleaning_time,
        address,
        homeSizeSqm,
        note: note || 'Buổi dùng thử',
        paymentMethod: payment_method || 'cash',
        totalFee: computedFee,
        bookingType: 'trial',
        specialInstructions: special_instructions || null,
        ...accessSnapshot,
      });

      // Gửi email xác nhận trial (fire-and-forget)
      try {
        const [customers] = await Customer.getCustomerById(customerId);
        if (customers && customers.length > 0) {
          const customer = customers[0];
          sendBookingConfirmationEmail(customer.email, customer.name, {
            serviceName: service.serviceName,
            bookingType: 'trial',
            bookingDay: booking_day,
            cleaningTime: cleaning_time,
            address,
            totalFee: computedFee,
          }).catch(err => console.error('Email xác nhận trial warning:', err.message));
        }
      } catch (emailErr) {
        console.error('Email xác nhận trial warning (non-fatal):', emailErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Đặt buổi dùng thử thành công'
      });
    } catch (error) {
      console.error('Create trial booking error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi đặt buổi dùng thử' });
    }
  },

  rebookFromHistory: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const { bookingId } = req.params;
      const { booking_day, cleaning_time } = req.body;

      const [bookings] = await Customer.getBookingByIdAndCustomer(bookingId, customerId);
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng cần đặt lại' });
      }

      const source = bookings[0];
      const targetDate = booking_day || toDateOnly(addDays(new Date(), 1));
      const targetTime = cleaning_time || source.cleaningTime;

      const accessSnapshot = await getAccessSnapshot(customerId);
      await Customer.bookService({
        idCustomer: customerId,
        idService: source.idService,
        idEmployee: null,
        bookingDay: targetDate,
        cleaningTime: targetTime,
        address: source.address,
        note: source.note || null,
        paymentMethod: source.paymentMethod || 'cash',
        totalFee: source.totalFee || source.basicPrice,
        bookingType: 'one_time',
        specialInstructions: source.specialInstructions || null,
        ...accessSnapshot,
      });

      res.status(201).json({
        success: true,
        message: 'Đặt lại lịch cũ thành công'
      });
    } catch (error) {
      console.error('Rebook error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi đặt lại lịch' });
    }
  },

  convertTrialToRecurring: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const {
        trial_booking_id,
        frequency,
        cycles = 4,
        start_date,
      } = req.body;

      if (!trial_booking_id || !['weekly', 'monthly'].includes(frequency)) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp trial_booking_id và frequency hợp lệ'
        });
      }

      const [bookings] = await Customer.getBookingByIdAndCustomer(trial_booking_id, customerId);
      if (!bookings || bookings.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy booking dùng thử' });
      }

      const trial = bookings[0];
      const baseDate = parseDate(start_date || trial.bookingDay) || addDays(new Date(), 1);
      const bookingsToCreate = Math.max(1, Math.min(Number(cycles) || 4, 12));
      const dayOfWeek = baseDate.getDay();
      const dayOfMonth = baseDate.getDate();

      const [pkgResult] = await Customer.createRecurringPackage({
        idCustomer: customerId,
        idService: trial.idService,
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
        cleaningTime: trial.cleaningTime,
        address: trial.address,
        homeSizeSqm: trial.homeSizeSqm || null,
        note: trial.note,
        specialInstructions: trial.specialInstructions,
        totalFee: trial.totalFee || trial.basicPrice,
        preferredEmployeeId: trial.idEmployee || null,
        trialBookingId: trial.id,
        nextBookingDate: toDateOnly(baseDate),
      });

      const recurringPackageId = pkgResult.insertId;
      const accessSnapshot = await getAccessSnapshot(customerId);
      let cursor = new Date(baseDate);
      for (let i = 0; i < bookingsToCreate; i += 1) {
        if (i > 0) {
          if (frequency === 'weekly') cursor = addDays(cursor, 7);
          else cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, dayOfMonth);
        }
        await Customer.createRecurringBooking({
          idCustomer: customerId,
          idService: trial.idService,
          idEmployee: null,
          bookingDay: toDateOnly(cursor),
          cleaningTime: trial.cleaningTime,
          address: trial.address,
          note: trial.note,
          paymentMethod: trial.paymentMethod || 'cash',
          totalFee: trial.totalFee || trial.basicPrice,
          recurringPackageId,
          specialInstructions: trial.specialInstructions || null,
          ...accessSnapshot,
        });
      }

      // Auto-generate service contract (Word)
      let contractInfo = null;
      try {
        const [customers] = await Customer.getCustomerById(customerId);
        const [packages] = await Customer.getRecurringPackageByIdAndCustomer(recurringPackageId, customerId);
        if (customers && customers.length && packages && packages.length) {
          const customer = customers[0];
          const pkg = packages[0];
          const contractCode = `CTR-${Date.now()}`;
          const contractFileName = `${contractCode}.docx`;
          const freqLabel = frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng';

          // Giá đã báo cho khách: ưu tiên totalFee (đã tính sẵn), fallback basicPrice × sqm
          const pkgTotalFee = Number(pkg.totalFee) || 0;
          let quotedPrice = pkgTotalFee;
          if (!quotedPrice) {
            const serviceInfo = await Customer.getServicePriceById(pkg.idService || trial.idService);
            const bp = serviceInfo ? Number(serviceInfo.basicPrice) : 0;
            const sqm = Number(pkg.homeSizeSqm) || 1;
            quotedPrice = Math.round(bp * sqm);
          }
          const quotedPriceFormatted = quotedPrice.toLocaleString('vi-VN');

          const startDateFormatted = toDateOnly(baseDate).split('-').reverse().join('/');

          const absolutePath = generateContractDocx({
            fileName: contractFileName,
            contractCode,
            customerName: customer.name || '',
            phone: customer.phoneNumber || '',
            email: customer.email || '',
            address: pkg.address || '',
            serviceType: pkg.serviceName || '',
            frequency: freqLabel,
            numberOfSessions: bookingsToCreate,
            startDate: startDateFormatted,
            cleaningTime: pkg.cleaningTime || '',
            price: quotedPriceFormatted,
          });

          await Customer.createServiceContract({
            idCustomer: customerId,
            recurringPackageId,
            contractCode,
            contractTitle: `Hợp đồng dịch vụ định kỳ - ${pkg.serviceName}`,
            contractTerms: `Dịch vụ: ${pkg.serviceName} | Tần suất: ${freqLabel} | Số buổi: ${bookingsToCreate} | Bắt đầu: ${startDateFormatted}`,
            filePath: absolutePath,
            fileName: contractFileName,
            status: 'active',
          });

          contractInfo = {
            contractCode,
            fileName: contractFileName,
            downloadUrl: `/contracts/${contractFileName}`,
          };
        }
      } catch (contractErr) {
        console.error('Auto-generate contract warning (non-fatal):', contractErr);
        // Contract generation failure is non-fatal; the package is still created
      }

      // Gửi email xác nhận gói định kỳ (fire-and-forget)
      try {
        const [custRows] = await Customer.getCustomerById(customerId);
        if (custRows && custRows.length > 0) {
          const cust = custRows[0];
          sendBookingConfirmationEmail(cust.email, cust.name, {
            serviceName: trial.serviceName,
            bookingType: 'recurring',
            bookingDay: toDateOnly(baseDate),
            cleaningTime: trial.cleaningTime,
            address: trial.address,
            totalFee: trial.totalFee || trial.basicPrice,
          }).catch(err => console.error('Email xác nhận recurring warning:', err.message));
        }
      } catch (emailErr) {
        console.error('Email xác nhận recurring warning (non-fatal):', emailErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Chuyển sang gói định kỳ thành công',
        data: { recurringPackageId, generatedBookings: bookingsToCreate, contract: contractInfo }
      });
    } catch (error) {
      console.error('Convert trial to recurring error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo gói định kỳ' });
    }
  },

  getRecurringPackages: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const [packages] = await Customer.getRecurringPackagesByCustomer(customerId);
      res.status(200).json({ success: true, data: packages });
    } catch (error) {
      console.error('Get recurring packages error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách gói định kỳ' });
    }
  },

  updateRecurringPackageStatus: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const { packageId } = req.params;
      const { status } = req.body;
      if (!['active', 'paused', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái gói không hợp lệ' });
      }
      const [result] = await Customer.updateRecurringPackageStatus(packageId, customerId, status);
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy gói định kỳ' });
      }
      res.status(200).json({ success: true, message: 'Cập nhật trạng thái gói thành công' });
    } catch (error) {
      console.error('Update recurring package status error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái gói' });
    }
  },

  skipRecurringSession: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const { packageId } = req.params;
      const [packages] = await Customer.getRecurringPackageByIdAndCustomer(packageId, customerId);
      if (!packages || packages.length === 0) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy gói định kỳ' });
      }
      const pkg = packages[0];
      const current = parseDate(pkg.nextBookingDate || new Date()) || new Date();
      const nextDate = pkg.frequency === 'weekly' ? addDays(current, 7) : new Date(current.getFullYear(), current.getMonth() + 1, pkg.dayOfMonth || current.getDate());
      await Customer.updateRecurringPackageSchedule(packageId, customerId, toDateOnly(nextDate), pkg.cleaningTime);
      res.status(200).json({ success: true, message: 'Đã bỏ qua 1 buổi trong gói định kỳ' });
    } catch (error) {
      console.error('Skip recurring session error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi bỏ qua buổi định kỳ' });
    }
  },

  rescheduleRecurringSession: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const { packageId } = req.params;
      const { booking_day, cleaning_time } = req.body;
      if (!booking_day || !cleaning_time) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ngày và giờ mới' });
      }
      const [result] = await Customer.updateRecurringPackageSchedule(packageId, customerId, booking_day, cleaning_time);
      if (!result.affectedRows) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy gói định kỳ' });
      }
      res.status(200).json({ success: true, message: 'Đổi lịch buổi định kỳ thành công' });
    } catch (error) {
      console.error('Reschedule recurring session error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi đổi lịch buổi định kỳ' });
    }
  },

  getServiceProfile: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const [profiles] = await Customer.getServiceProfileByCustomer(customerId);
      res.status(200).json({ success: true, data: profiles[0] || null });
    } catch (error) {
      console.error('Get service profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy hồ sơ dịch vụ' });
    }
  },

  upsertServiceProfile: async (req, res) => {
    try {
      const customerId = req.user.userId;
      await Customer.upsertServiceProfile(customerId, req.body || {});
      res.status(200).json({ success: true, message: 'Cập nhật hồ sơ dịch vụ thành công' });
    } catch (error) {
      console.error('Upsert service profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật hồ sơ dịch vụ' });
    }
  },

  getAccessProfile: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const profile = await Customer.getAccessProfile(customerId);
      if (!profile) {
        return res.status(200).json({
          success: true,
          data: {
            accessMethod: 'none',
            lockboxLocation: null,
            hasLockboxPin: false,
            lockboxPinMasked: null,
            hasCondoGuide: false,
            hasAccessNote: false,
          }
        });
      }
      const pin = decryptAccess(profile.lockboxPinEnc);
      res.status(200).json({
        success: true,
        data: {
          accessMethod: profile.accessMethod || 'none',
          lockboxLocation: profile.lockboxLocation || null,
          hasLockboxPin: !!profile.lockboxPinEnc,
          lockboxPinMasked: pin ? maskPin(pin) : null,
          hasCondoGuide: !!profile.condoGuideEnc,
          hasAccessNote: !!profile.accessNoteEnc,
        }
      });
    } catch (error) {
      console.error('Get access profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thông tin truy cập' });
    }
  },

  upsertAccessProfile: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const {
        accessMethod,
        lockboxLocation,
        lockboxPin,
        condoGuide,
        accessNote,
        keepExistingPin,
        keepExistingCondo,
        keepExistingNote,
      } = req.body || {};

      const allowedMethods = ['none', 'lockbox', 'condo_gate', 'both'];
      const method = allowedMethods.includes(accessMethod) ? accessMethod : 'none';

      const existing = (await Customer.getAccessProfile(customerId)) || {};

      let lockboxPinEnc = existing.lockboxPinEnc || null;
      if (!keepExistingPin) {
        lockboxPinEnc = lockboxPin && String(lockboxPin).trim()
          ? encryptAccess(String(lockboxPin).trim())
          : null;
      }

      let condoGuideEnc = existing.condoGuideEnc || null;
      if (!keepExistingCondo) {
        condoGuideEnc = condoGuide && String(condoGuide).trim()
          ? encryptAccess(String(condoGuide).trim())
          : null;
      }

      let accessNoteEnc = existing.accessNoteEnc || null;
      if (!keepExistingNote) {
        accessNoteEnc = accessNote && String(accessNote).trim()
          ? encryptAccess(String(accessNote).trim())
          : null;
      }

      if (method === 'none') {
        lockboxPinEnc = null;
        condoGuideEnc = null;
        accessNoteEnc = null;
      }

      await Customer.upsertAccessProfile(customerId, {
        accessMethod: method,
        lockboxLocation: lockboxLocation || null,
        lockboxPinEnc,
        condoGuideEnc,
        accessNoteEnc,
      });

      res.status(200).json({
        success: true,
        message: 'Đã cập nhật thông tin truy cập an toàn',
      });
    } catch (error) {
      console.error('Upsert access profile error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông tin truy cập' });
    }
  },

  getDashboardSummary: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const summary = await Customer.getCustomerDashboardSummary(customerId);
      const [packages] = await Customer.getRecurringPackagesByCustomer(customerId);
      res.status(200).json({
        success: true,
        data: {
          ...summary,
          activePackages: packages.filter((pkg) => pkg.status === 'active').length
        }
      });
    } catch (error) {
      console.error('Get dashboard summary error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy thống kê dashboard' });
    }
  },

  generateRecurringContract: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const { packageId } = req.params;
      const [customers] = await Customer.getCustomerById(customerId);
      const [packages] = await Customer.getRecurringPackageByIdAndCustomer(packageId, customerId);
      if (!customers || !customers.length || !packages || !packages.length) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy dữ liệu để tạo hợp đồng' });
      }

      const customer = customers[0];
      const pkg = packages[0];
      const contractCode = `CTR-${Date.now()}`;
      const fileName = `${contractCode}.docx`;
      const freqLabel = pkg.frequency === 'weekly' ? 'Hàng tuần' : 'Hàng tháng';

      // Giá đã báo cho khách: ưu tiên totalFee (đã tính sẵn), fallback basicPrice × sqm
      const pkgTotalFee = Number(pkg.totalFee) || 0;
      let quotedPrice = pkgTotalFee;
      if (!quotedPrice) {
        const serviceInfo = await Customer.getServicePriceById(pkg.idService);
        const bp = serviceInfo ? Number(serviceInfo.basicPrice) : 0;
        const sqm = Number(pkg.homeSizeSqm) || 1;
        quotedPrice = Math.round(bp * sqm);
      }
      const quotedPriceFormatted = quotedPrice.toLocaleString('vi-VN');

      const startDateFormatted = pkg.nextBookingDate
        ? toDateOnly(new Date(pkg.nextBookingDate)).split('-').reverse().join('/')
        : 'N/A';

      const absolutePath = generateContractDocx({
        fileName,
        contractCode,
        customerName: customer.name || '',
        phone: customer.phoneNumber || '',
        email: customer.email || '',
        address: pkg.address || '',
        serviceType: pkg.serviceName || '',
        frequency: freqLabel,
        numberOfSessions: pkg.totalSessions || '—',
        startDate: startDateFormatted,
        cleaningTime: pkg.cleaningTime || '',
        price: quotedPriceFormatted,
      });

      await Customer.createServiceContract({
        idCustomer: customerId,
        recurringPackageId: pkg.id,
        contractCode,
        contractTitle: `Hợp đồng dịch vụ định kỳ - ${pkg.serviceName}`,
        contractTerms: `Dịch vụ: ${pkg.serviceName} | Tần suất: ${freqLabel} | Bắt đầu: ${startDateFormatted}`,
        filePath: absolutePath,
        fileName,
        status: 'active',
      });

      res.status(201).json({
        success: true,
        message: 'Tạo hợp đồng dịch vụ thành công',
        data: {
          contractCode,
          fileName,
          downloadUrl: `/contracts/${fileName}`,
          localPath: path.normalize(absolutePath)
        }
      });
    } catch (error) {
      console.error('Generate recurring contract error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi tạo hợp đồng dịch vụ' });
    }
  },

  getMyContracts: async (req, res) => {
    try {
      const customerId = req.user.userId;
      const [contracts] = await Customer.getContractsByCustomer(customerId);
      const data = contracts.map((item) => ({
        ...item,
        downloadUrl: `/contracts/${item.fileName}`
      }));
      res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Get contracts error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách hợp đồng' });
    }
  },

  // Xem lịch sử đặt dịch vụ
  viewBookings: async (req, res) => {
    try {
      // Middleware auth đã kiểm tra authentication
      const idCustomer = req.user.userId;
      const [bookings] = await Customer.getBookingsByCustomer(idCustomer);
      res.status(200).json({
        success: true,
        message: 'Danh sách đặt dịch vụ',
        data: bookings
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử đặt dịch vụ' });
    }
  },

  // Gửi đánh giá dịch vụ
  addReview: async (req, res) => {
    try {
      const customerId = req.user.userId || req.user.id;
      const data = {
        idBooking: req.body.id_booking,
        rating: req.body.rating,
        comment: req.body.comment,
      };

      // Validate rating
      if (!data.rating || data.rating < 1 || data.rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Điểm đánh giá phải từ 1 đến 5'
        });
      }

      // Kiểm tra booking có tồn tại và thuộc về customer này không
      const [bookings] = await Customer.getBookingsByCustomer(customerId);
      const booking = bookings.find(b => b.id === data.idBooking);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng hoặc bạn không có quyền đánh giá đơn hàng này'
        });
      }

      // Kiểm tra đơn hàng đã hoàn thành chưa
      if (booking.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể đánh giá sau khi dịch vụ hoàn thành'
        });
      }

      // Kiểm tra đã review chưa
      const [existingReview] = await Customer.checkReviewExists(data.idBooking);
      if (existingReview && existingReview.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Bạn đã đánh giá đơn hàng này rồi'
        });
      }

      const [result] = await Customer.addReview(data);
      const reviewId = result.insertId;

      let sentimentResult = null;
      if (data.comment && data.comment.trim()) {
        try {
          const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
          const response = await fetch(`${aiServiceUrl}/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: data.comment, rating: data.rating }),
          });

          if (response.ok) {
            sentimentResult = await response.json();
            await Customer.updateReviewSentiment(reviewId, sentimentResult);
          }
        } catch (aiError) {
          console.error('Sentiment analysis failed (non-blocking):', aiError.message);
        }
      }

      res.status(201).json({
        success: true,
        message: 'Gửi đánh giá thành công',
        sentiment: sentimentResult,
      });
    } catch (error) {
      console.error('Add review error:', error);
      res.status(500).json({ success: false, message: 'Lỗi khi gửi đánh giá' });
    }
  },

  // Lấy review của một booking
  getReviewByBooking: async (req, res) => {
    try {
      const { bookingId } = req.params;
      const [reviews] = await Customer.getReviewByBooking(bookingId);

      if (!reviews || reviews.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Chưa có đánh giá cho đơn hàng này'
        });
      }

      res.status(200).json({
        success: true,
        data: reviews[0]
      });
    } catch (error) {
      console.error('Get review by booking error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy đánh giá'
      });
    }
  },

  // Lấy tất cả reviews của một service
  getReviewsByService: async (req, res) => {
    try {
      const { serviceId } = req.params;
      const [reviews] = await Customer.getReviewsByService(serviceId);

      res.status(200).json({
        success: true,
        data: reviews,
        total: reviews.length
      });
    } catch (error) {
      console.error('Get reviews by service error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đánh giá'
      });
    }
  },

  // Lấy reviews của customer hiện tại
  getMyReviews: async (req, res) => {
    try {
      const customerId = req.user.userId || req.user.id;
      const [reviews] = await Customer.getReviewsByCustomer(customerId);

      res.status(200).json({
        success: true,
        data: reviews,
        total: reviews.length
      });
    } catch (error) {
      console.error('Get my reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đánh giá của bạn'
      });
    }
  },

  // Lấy rating trung bình của service
  getServiceRating: async (req, res) => {
    try {
      const { serviceId } = req.params;
      const [result] = await Customer.getServiceAverageRating(serviceId);

      if (!result || result.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            totalReviews: 0,
            averageRating: 0,
            excellentCount: 0,
            goodCount: 0,
            poorCount: 0
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          totalReviews: parseInt(result[0].totalReviews) || 0,
          averageRating: parseFloat(result[0].averageRating) || 0,
          excellentCount: parseInt(result[0].excellentCount) || 0,
          goodCount: parseInt(result[0].goodCount) || 0,
          poorCount: parseInt(result[0].poorCount) || 0
        }
      });
    } catch (error) {
      console.error('Get service rating error:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy rating dịch vụ'
      });
    }
  },

  // Xem thông tin cá nhân
  viewProfile: async (req, res) => {
    try {
      // Middleware auth đã kiểm tra authentication
      const customerId = req.user.userId;
      const [customers] = await Customer.getCustomerById(customerId);

      if (!customers || customers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin khách hàng'
        });
      }

      const customer = customers[0];
      delete customer.password;

      res.status(200).json({
        success: true,
        message: 'Thông tin cá nhân',
        data: customer
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin cá nhân'
      });
    }
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (req, res) => {
    try {
      // Middleware auth đã kiểm tra authentication
      const id = req.user.userId;
      await Customer.updateCustomer(id, req.body);
      res.status(200).json({ success: true, message: 'Cập nhật hồ sơ thành công' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi khi cập nhật hồ sơ' });
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

      const [customers] = await Customer.getCustomerByEmail(email);
      if (!customers || customers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email hướng dẫn đặt lại mật khẩu'
        });
      }

      const customer = customers[0];

      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 giờ

      await Customer.saveResetPasswordToken(email, resetToken, resetTokenExpiry);

      try {
        const { sendResetPasswordEmail } = require('../utils/emailService');
        await sendResetPasswordEmail(email, customer.name, resetToken, 'customer');
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

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự'
        });
      }

      const [customers] = await Customer.findByResetToken(token);
      if (!customers || customers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Token không hợp lệ hoặc đã hết hạn'
        });
      }

      await Customer.resetPassword(token, newPassword);

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

  changePassword: async (req, res) => {
    try {
      const customerId = req.user.userId;
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

      const [customers] = await Customer.getCustomerById(customerId);
      if (!customers || customers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin khách hàng'
        });
      }

      const customer = customers[0];

      const isValidPassword = await Customer.verifyPassword(currentPassword, customer.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng'
        });
      }

      await Customer.changePassword(customerId, newPassword);

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
  },
};

module.exports = customerController;
