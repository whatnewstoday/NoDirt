const express = require("express");
const router = express.Router();
const { auth } = require('../middlewares/auth');
const managerController = require("../controllers/managerController");

/**
 * @swagger
 * tags:
 *   name: Manager
 *   description: API dành cho Manager (quản lý booking và phân công nhân viên)
 */

// ==================== AUTHENTICATION ====================

/**
 * @swagger
 * /api/managers/login:
 *   post:
 *     tags:
 *       - Manager
 *     summary: Đăng nhập Manager
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Username hoặc mật khẩu không đúng
 */
router.post('/login', managerController.login);

/**
 * @swagger
 * /api/managers/logout:
 *   post:
 *     tags:
 *       - Manager
 *     summary: Đăng xuất Manager
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout', auth(['manager']), managerController.logout);

/**
 * @swagger
 * /api/managers/forgot-password:
 *   post:
 *     tags:
 *       - Manager
 *     summary: Quên mật khẩu - Gửi email reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: "manager@example.com"
 *     responses:
 *       200:
 *         description: Email đã được gửi
 */
router.post('/forgot-password', managerController.forgotPassword);

/**
 * @swagger
 * /api/managers/reset-password:
 *   post:
 *     tags:
 *       - Manager
 *     summary: Đặt lại mật khẩu với token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 */
router.post('/reset-password', managerController.resetPassword);

/**
 * @swagger
 * /api/managers/change-password:
 *   post:
 *     tags:
 *       - Manager
 *     summary: Đổi mật khẩu (khi đã đăng nhập)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       401:
 *         description: Mật khẩu hiện tại không đúng
 */
router.post('/change-password', auth(['manager']), managerController.changePassword);

/**
 * @swagger
 * /api/managers/profile:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy thông tin manager hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/profile', auth(['manager']), managerController.getProfile);

/**
 * @swagger
 * /api/managers/profile/update:
 *   put:
 *     tags:
 *       - Manager
 *     summary: Cập nhật thông tin manager
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/profile/update', auth(['manager']), managerController.updateProfile);

// ==================== DASHBOARD ====================

/**
 * @swagger
 * /api/managers/dashboard:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy thống kê dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/dashboard', auth(['manager']), managerController.getDashboard);

// ==================== BOOKING MANAGEMENT ====================

/**
 * @swagger
 * /api/managers/bookings:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy tất cả booking
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/bookings', auth(['manager']), managerController.getAllBookings);

/**
 * @swagger
 * /api/managers/bookings/pending:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy booking chờ phân công
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/bookings/pending', auth(['manager']), managerController.getPendingBookings);

/**
 * @swagger
 * /api/managers/bookings/active:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy booking đang thực hiện
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/bookings/active', auth(['manager']), managerController.getActiveBookings);

/**
 * @swagger
 * /api/managers/bookings/by-date:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy booking theo ngày
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/bookings/by-date', auth(['manager']), managerController.getBookingsByDate);

/**
 * @swagger
 * /api/managers/bookings/{id}:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy chi tiết booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy booking
 */
router.get('/bookings/:id', auth(['manager']), managerController.getBookingDetail);

/**
 * @swagger
 * /api/managers/bookings/{id}/assign:
 *   post:
 *     tags:
 *       - Manager
 *     summary: Phân công nhân viên cho booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *             properties:
 *               employeeId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Phân công thành công
 *       400:
 *         description: Nhân viên không rảnh
 *       404:
 *         description: Không tìm thấy booking
 */
router.post('/bookings/:id/assign', auth(['manager']), managerController.assignEmployee);
router.post('/bookings/:id/semi-auto-assign', auth(['manager']), managerController.semiAutoAssign);

/**
 * @swagger
 * /api/managers/bookings/{id}/status:
 *   put:
 *     tags:
 *       - Manager
 *     summary: Cập nhật trạng thái booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [booked, confirmed, processing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/bookings/:id/status', auth(['manager']), managerController.updateBookingStatus);

// ==================== EMPLOYEE MANAGEMENT ====================

/**
 * @swagger
 * /api/managers/employees:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy tất cả nhân viên
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/employees', auth(['manager']), managerController.getAllEmployees);

/**
 * @swagger
 * /api/managers/employees/available:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Lấy nhân viên rảnh
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/employees/available', auth(['manager']), managerController.getAvailableEmployees);

/**
 * @swagger
 * /api/managers/employees/{employeeId}/schedule:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Xem lịch làm việc của nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/employees/:employeeId/schedule', auth(['manager']), managerController.getEmployeeSchedule);

/**
 * @swagger
 * /api/managers/employees/{id}/area:
 *   put:
 *     tags:
 *       - Manager
 *     summary: Cập nhật khu vực phụ trách của nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - responsibleArea
 *             properties:
 *               responsibleArea:
 *                 type: string
 *                 example: "Quận 1, Quận 3"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy nhân viên
 */
router.put('/employees/:id/area', auth(['manager']), managerController.updateEmployeeArea);


/**
 * @swagger
 * /api/managers/bookings/{bookingId}/suggest-employees:
 *   get:
 *     tags:
 *       - Manager
 *     summary: Gợi ý nhân viên phù hợp cho booking
 *     description: Smart matching dựa trên khu vực, lịch rảnh, số công việc đang làm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy booking
 */
router.get('/bookings/:bookingId/suggest-employees', auth(['manager']), managerController.suggestEmployees);

// ==================== EMPLOYEE REQUESTS ====================

/**
 * @swagger
 * /api/managers/employee-requests:
 *   post:
 *     tags:
 *       - Manager - Employee Requests
 *     summary: Tạo yêu cầu thêm nhân viên mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeName
 *               - employeeEmail
 *             properties:
 *               employeeName:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               employeeEmail:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@example.com"
 *               employeePhone:
 *                 type: string
 *                 example: "0912345678"
 *               responsibleArea:
 *                 type: string
 *                 example: "Quận 1, Quận 3"
 *               requestReason:
 *                 type: string
 *                 example: "Cần thêm nhân viên để xử lý booking tăng cao"
 *     responses:
 *       201:
 *         description: Tạo yêu cầu thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       409:
 *         description: Email đã tồn tại
 */
router.post('/employee-requests', auth(['manager']), managerController.createEmployeeRequest);

/**
 * @swagger
 * /api/managers/employee-requests:
 *   get:
 *     tags:
 *       - Manager - Employee Requests
 *     summary: Lấy tất cả yêu cầu của manager
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/employee-requests', auth(['manager']), managerController.getMyEmployeeRequests);

/**
 * @swagger
 * /api/managers/employee-requests/{id}:
 *   get:
 *     tags:
 *       - Manager - Employee Requests
 *     summary: Lấy chi tiết yêu cầu
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
router.get('/employee-requests/:id', auth(['manager']), managerController.getEmployeeRequestDetail);

/**
 * @swagger
 * /api/managers/employee-requests/{id}:
 *   put:
 *     tags:
 *       - Manager - Employee Requests
 *     summary: Cập nhật yêu cầu (chỉ khi status = pending)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeName
 *               - employeeEmail
 *             properties:
 *               employeeName:
 *                 type: string
 *               employeeEmail:
 *                 type: string
 *                 format: email
 *               employeePhone:
 *                 type: string
 *               responsibleArea:
 *                 type: string
 *               requestReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy hoặc không thể chỉnh sửa
 */
router.put('/employee-requests/:id', auth(['manager']), managerController.updateEmployeeRequest);

/**
 * @swagger
 * /api/managers/employee-requests/{id}/cancel:
 *   delete:
 *     tags:
 *       - Manager - Employee Requests
 *     summary: Hủy yêu cầu (chỉ khi status = pending)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Hủy thành công
 *       404:
 *         description: Không tìm thấy hoặc không thể hủy
 */
router.delete('/employee-requests/:id/cancel', auth(['manager']), managerController.cancelEmployeeRequest);

module.exports = router;

