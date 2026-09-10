const express = require("express");
const router = express.Router();
const { auth } = require('../middlewares/auth');
const adminController = require("../controllers/adminController");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: API dành cho quản trị viên (quản lý toàn bộ hệ thống)
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Đăng nhập quản trị viên
 *     description: Admin không thể tự đăng ký, chỉ được mời bởi admin khác
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
 *                 example: "admin"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Username hoặc mật khẩu không đúng
 */
router.post("/login", adminController.login);

/**
 * @swagger
 * /api/admin/logout:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Đăng xuất
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post("/logout", adminController.logout);

/**
 * @swagger
 * /api/admin/forgot-password:
 *   post:
 *     tags:
 *       - Admin
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
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: Email đã được gửi
 */
router.post("/forgot-password", adminController.forgotPassword);

/**
 * @swagger
 * /api/admin/reset-password:
 *   post:
 *     tags:
 *       - Admin
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
router.post("/reset-password", adminController.resetPassword);

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Lấy thông tin admin hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy admin
 */
router.get("/profile", auth(true), adminController.getProfile);

/**
 * @swagger
 * /api/admin/change-password:
 *   post:
 *     tags:
 *       - Admin
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
router.post("/change-password", auth(true), adminController.changePassword);

/**
 * @swagger
 * /api/admin/invite:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Mời admin mới (chỉ admin hiện tại)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newadmin"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "New Admin"
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       201:
 *         description: Mời admin thành công
 *       409:
 *         description: Username đã tồn tại
 */
router.post("/invite", auth(true), adminController.inviteAdmin);

/**
 * @swagger
 * /api/admin/managers:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Tạo manager mới (chỉ admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - name
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 example: "newmanager"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "New Manager"
 *               email:
 *                 type: string
 *                 example: "manager@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "0987654321"
 *     responses:
 *       201:
 *         description: Tạo manager thành công
 *       409:
 *         description: Username/Email đã tồn tại
 */
router.post("/managers", auth(true), adminController.createManager);



/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Thống kê tổng quan hệ thống
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thống kê thành công
 */
router.get("/dashboard", auth(true), adminController.getDashboard);



/**
 * @swagger
 * /api/admin/services:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Xem tất cả dịch vụ
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách dịch vụ
 */
router.get("/services", auth(true), adminController.getAllServices);

/**
 * @swagger
 * /api/admin/services:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Tạo dịch vụ mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceName
 *               - basicPrice
 *             properties:
 *               serviceName:
 *                 type: string
 *                 example: "Dọn dẹp nhà cửa cơ bản"
 *               description:
 *                 type: string
 *                 example: "Dọn dẹp phòng khách, phòng ngủ"
 *               basicPrice:
 *                 type: number
 *                 example: 500000
 *               duration:
 *                 type: integer
 *                 example: 120
 *                 description: "Thời gian (phút)"
 *     responses:
 *       201:
 *         description: Tạo dịch vụ thành công
 */
router.post("/services", auth(true), adminController.createService);

/**
 * @swagger
 * /api/admin/services/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Cập nhật dịch vụ
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
 *             properties:
 *               serviceName:
 *                 type: string
 *               description:
 *                 type: string
 *               basicPrice:
 *                 type: number
 *               duration:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy dịch vụ
 */
router.put("/services/:id", auth(true), adminController.updateService);

/**
 * @swagger
 * /api/admin/services/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Xóa dịch vụ
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
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy dịch vụ
 */
router.delete("/services/:id", auth(true), adminController.deleteService);

/**
 * @swagger
 * /api/admin/employees:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Xem tất cả nhân viên
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách nhân viên
 */
router.get("/employees", auth(true), adminController.getAllEmployees);

/**
 * @swagger
 * /api/admin/employees:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Tạo nhân viên mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Nguyễn Văn A"
 *               email:
 *                 type: string
 *                 example: "employee@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               phoneNumber:
 *                 type: string
 *                 example: "0987654321"
 *               responsibleArea:
 *                 type: string
 *                 example: "Quận 1, TP.HCM"
 *     responses:
 *       201:
 *         description: Tạo nhân viên thành công
 *       409:
 *         description: Email đã tồn tại
 */
router.post("/employees", auth(true), adminController.createEmployee);

/**
 * @swagger
 * /api/admin/employees/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Cập nhật nhân viên
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               responsibleArea:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy nhân viên
 */
router.put("/employees/:id", auth(true), adminController.updateEmployee);

/**
 * @swagger
 * /api/admin/employees/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Xóa nhân viên
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
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy nhân viên
 */
router.delete("/employees/:id", auth(true), adminController.deleteEmployee);

/**
 * @swagger
 * /api/admin/bookings:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Xem tất cả đơn đặt lịch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách booking
 */
router.get("/bookings", auth(true), adminController.getAllBookings);

/**
 * @swagger
 * /api/admin/bookings/{id}/status:
 *   put:
 *     tags:
 *       - Admin
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
 *                 enum: [booked, processing, in progress, completed, cancelled]
 *                 example: "processing"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Trạng thái không hợp lệ
 */
router.put("/bookings/:id/status", auth(true), adminController.updateBookingStatus);

/**
 * @swagger
 * /api/admin/bookings/{id}/payment:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Cập nhật trạng thái thanh toán
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
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [unpaid, paid]
 *                 example: "paid"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/bookings/:id/payment", auth(true), adminController.updatePaymentStatus);

// ==================== EMPLOYEE REQUESTS MANAGEMENT ====================

/**
 * @swagger
 * /api/admin/employee-requests:
 *   get:
 *     tags:
 *       - Admin - Employee Requests
 *     summary: Lấy tất cả yêu cầu thêm nhân viên
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/employee-requests", auth(true), adminController.getAllEmployeeRequests);

/**
 * @swagger
 * /api/admin/employee-requests/stats:
 *   get:
 *     tags:
 *       - Admin - Employee Requests
 *     summary: Lấy thống kê yêu cầu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get("/employee-requests/stats", auth(true), adminController.getEmployeeRequestStats);

/**
 * @swagger
 * /api/admin/employee-requests/{id}:
 *   get:
 *     tags:
 *       - Admin - Employee Requests
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
 *         description: Không tìm thấy
 */
router.get("/employee-requests/:id", auth(true), adminController.getEmployeeRequestDetail);

/**
 * @swagger
 * /api/admin/employee-requests/{id}/approve:
 *   post:
 *     tags:
 *       - Admin - Employee Requests
 *     summary: Phê duyệt yêu cầu và tạo nhân viên
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
 *             properties:
 *               adminNote:
 *                 type: string
 *                 example: "Đã phê duyệt"
 *               createEmployee:
 *                 type: boolean
 *                 default: true
 *                 description: Có tạo nhân viên ngay hay không
 *               password:
 *                 type: string
 *                 example: "employee123"
 *                 description: Mật khẩu cho nhân viên mới (bắt buộc nếu createEmployee = true)
 *     responses:
 *       200:
 *         description: Phê duyệt thành công
 *       400:
 *         description: Thiếu thông tin hoặc yêu cầu đã được xử lý
 *       404:
 *         description: Không tìm thấy yêu cầu
 *       409:
 *         description: Email đã tồn tại
 */
router.post("/employee-requests/:id/approve", auth(true), adminController.approveEmployeeRequest);

/**
 * @swagger
 * /api/admin/employee-requests/{id}/reject:
 *   post:
 *     tags:
 *       - Admin - Employee Requests
 *     summary: Từ chối yêu cầu
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
 *               - adminNote
 *             properties:
 *               adminNote:
 *                 type: string
 *                 example: "Không đủ ngân sách"
 *     responses:
 *       200:
 *         description: Từ chối thành công
 *       400:
 *         description: Thiếu lý do hoặc yêu cầu đã được xử lý
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
router.post("/employee-requests/:id/reject", auth(true), adminController.rejectEmployeeRequest);

module.exports = router;

