const express = require("express");
const router = express.Router();
const { auth, requireEmployee } = require('../middlewares/auth');
const employeeController = require("../controllers/employeeController");

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: API dành cho nhân viên dọn dẹp (xem công việc, cập nhật trạng thái...)
 */

/**
 * @swagger
 * /api/employees/login:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Đăng nhập cho nhân viên
 *     description: Nhân viên không thể tự đăng ký, chỉ được admin mời và cấp tài khoản
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "employee@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Đăng nhập thành công"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   description: "JWT token để sử dụng trong các API yêu cầu xác thực"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     responsibleArea:
 *                       type: string
 *       400:
 *         description: Thiếu email hoặc mật khẩu
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 *       500:
 *         description: Lỗi server
 */
router.post("/login", employeeController.login);

/**
 * @swagger
 * /api/employees/logout:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Đăng xuất khỏi hệ thống
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       500:
 *         description: Lỗi khi đăng xuất
 */
router.post("/logout", employeeController.logout);

/**
 * @swagger
 * /api/employees/forgot-password:
 *   post:
 *     tags:
 *       - Employees
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
 *                 example: "employee@example.com"
 *     responses:
 *       200:
 *         description: Email đã được gửi
 */
router.post("/forgot-password", employeeController.forgotPassword);

/**
 * @swagger
 * /api/employees/reset-password:
 *   post:
 *     tags:
 *       - Employees
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
router.post("/reset-password", employeeController.resetPassword);

/**
 * @swagger
 * /api/employees/change-password:
 *   post:
 *     tags:
 *       - Employees
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
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       401:
 *         description: Mật khẩu hiện tại không đúng
 */
router.post("/change-password", auth(true), requireEmployee, employeeController.changePassword);

/**
 * @swagger
 * /api/employees/jobs:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Xem danh sách công việc được giao (chỉ đọc)
 *     description: Nhân viên xem các công việc (booking) đã được giao cho mình
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách công việc thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Danh sách công việc được giao"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: "ID của booking"
 *                       idCustomer:
 *                         type: integer
 *                       idService:
 *                         type: integer
 *                       bookingDay:
 *                         type: string
 *                         format: date
 *                       cleaningTime:
 *                         type: string
 *                         format: time
 *                       address:
 *                         type: string
 *                       note:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [booked, processing, in progress, completed, cancelled]
 *                       paymentMethod:
 *                         type: string
 *                         enum: [cash, online]
 *                       totalFee:
 *                         type: number
 *                       paymentStatus:
 *                         type: string
 *                         enum: [unpaid, paid]
 *                       serviceName:
 *                         type: string
 *                       serviceDescription:
 *                         type: string
 *                       customerName:
 *                         type: string
 *                       customerPhone:
 *                         type: string
 *                       customerEmail:
 *                         type: string
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.get("/jobs", auth(true), requireEmployee, employeeController.viewAssignedJobs);

/**
 * @swagger
 * /api/employees/jobs/update-status:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Cập nhật trạng thái công việc (nếu được phép)
 *     description: Nhân viên chỉ có thể cập nhật trạng thái của công việc được giao cho mình
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_booking
 *               - status
 *             properties:
 *               id_booking:
 *                 type: integer
 *                 example: 1
 *                 description: "ID của booking cần cập nhật"
 *               status:
 *                 type: string
 *                 enum: [booked, processing, in progress, completed, cancelled]
 *                 example: "in progress"
 *                 description: "Trạng thái mới của công việc"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Thiếu thông tin hoặc trạng thái không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       403:
 *         description: Không có quyền cập nhật công việc này
 *       500:
 *         description: Lỗi server
 */
router.post("/jobs/update-status", auth(true), requireEmployee, employeeController.updateJobStatus);
router.post("/jobs/:bookingId/check-in", auth(true), requireEmployee, employeeController.checkInJob);
router.post("/jobs/:bookingId/check-out", auth(true), requireEmployee, employeeController.checkOutJob);
router.get("/jobs/:bookingId/access", auth(true), requireEmployee, employeeController.viewJobAccessInfo);

/**
 * @swagger
 * /api/employees/profile:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Xem thông tin cá nhân
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin nhân viên
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy thông tin nhân viên
 */
router.get("/profile", auth(true), requireEmployee, employeeController.viewProfile);

/**
 * @swagger
 * /api/employees/profile/update:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Cập nhật thông tin cá nhân
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
 *                 example: "Nguyễn Văn B"
 *                 description: "Họ tên"
 *               phoneNumber:
 *                 type: string
 *                 example: "0987654321"
 *                 description: "Số điện thoại"
 *               responsibleArea:
 *                 type: string
 *                 example: "Quận 1, TP.HCM"
 *                 description: "Khu vực phụ trách"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/profile/update", auth(true), requireEmployee, employeeController.updateProfile);

module.exports = router;

