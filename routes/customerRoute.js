const express = require("express");
const router = express.Router();
const { auth, requireCustomer } = require('../middlewares/auth');
const customerController = require("../controllers/customerController");

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: API dành cho khách hàng (xem dịch vụ, đặt lịch, đánh giá...)
 */

/**
 * @swagger
 * /api/customers/register:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Đăng ký tài khoản mới
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
 *                 format: email
 *                 example: "nguyenvana@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *               phoneNumber:
 *                 type: string
 *                 example: "0987654321"
 *               address:
 *                 type: string
 *                 example: "123 Nguyễn Trãi, Quận 5, TP.HCM"
 *     responses:
 *       201:
 *         description: Đăng ký tài khoản thành công
 *       400:
 *         description: Thiếu thông tin bắt buộc
 *       409:
 *         description: Email đã được sử dụng
 *       500:
 *         description: Lỗi server
 */
router.post("/register", customerController.register);

/**
 * @swagger
 * /api/customers/login:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Đăng nhập vào hệ thống
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
 *                 example: "nguyenvana@example.com"
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
 *                   description: "JWT token để sử dụng trong các API yêu cầu xác thực. Copy token này và paste vào nút Authorize ở đầu trang."
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
 *       400:
 *         description: Thiếu email hoặc mật khẩu
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 *       500:
 *         description: Lỗi server
 */
router.post("/login", customerController.login);

/**
 * @swagger
 * /api/customers/logout:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Đăng xuất khỏi hệ thống
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *       500:
 *         description: Lỗi khi đăng xuất
 */
router.post("/logout", customerController.logout);

/**
 * @swagger
 * /api/customers/forgot-password:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Quên mật khẩu - Gửi email reset password
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
 *                 format: email
 *                 example: "nguyenvana@example.com"
 *     responses:
 *       200:
 *         description: Email hướng dẫn đặt lại mật khẩu đã được gửi
 *       400:
 *         description: Thiếu email
 *       500:
 *         description: Lỗi server
 */
router.post("/forgot-password", customerController.forgotPassword);

/**
 * @swagger
 * /api/customers/reset-password:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Đặt lại mật khẩu với token từ email
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
 *                 example: "a1b2c3d4e5f6..."
 *                 description: "Token nhận được từ email"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *                 description: "Mật khẩu mới (tối thiểu 6 ký tự)"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Token không hợp lệ hoặc mật khẩu không đúng định dạng
 *       500:
 *         description: Lỗi server
 */
router.post("/reset-password", customerController.resetPassword);

/**
 * @swagger
 * /api/customers/change-password:
 *   post:
 *     tags:
 *       - Customers
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
 *                 description: "Mật khẩu hiện tại"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "newpassword123"
 *                 description: "Mật khẩu mới (tối thiểu 6 ký tự)"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Thiếu thông tin hoặc mật khẩu mới không đúng định dạng
 *       401:
 *         description: Mật khẩu hiện tại không đúng hoặc chưa đăng nhập
 *       500:
 *         description: Lỗi server
 */
router.post("/change-password", auth(true), requireCustomer, customerController.changePassword);

/**
 * @swagger
 * /api/customers/services:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Lấy danh sách tất cả dịch vụ có sẵn
 *     responses:
 *       200:
 *         description: Lấy danh sách dịch vụ thành công
 *       500:
 *         description: Lỗi server
 */
router.get("/services", customerController.listServices);

/**
 * @swagger
 * /api/customers/services/{id}:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Xem chi tiết dịch vụ
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của dịch vụ
 *     responses:
 *       200:
 *         description: Lấy thông tin dịch vụ thành công
 *       404:
 *         description: Không tìm thấy dịch vụ
 */
router.get("/services/:id", customerController.viewServiceDetail);

/**
 * @swagger
 * /api/customers/bookings:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Xem danh sách đơn đặt lịch của khách hàng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách lịch đặt thành công
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.get("/bookings", auth(true), requireCustomer, customerController.viewBookings);

/**
 * @swagger
 * /api/customers/book:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Đặt lịch dọn dẹp
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_service
 *               - booking_day
 *               - cleaning_time
 *               - address
 *               - payment_method
 *               - total_fee
 *             properties:
 *               id_service:
 *                 type: integer
 *                 example: 1
 *                 description: "ID của dịch vụ"
 *               booking_day:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-05"
 *                 description: "Ngày đặt lịch"
 *               cleaning_time:
 *                 type: string
 *                 format: time
 *                 example: "14:00:00"
 *                 description: "Thời gian dọn dẹp"
 *               address:
 *                 type: string
 *                 example: "123 Nguyễn Trãi, Quận 5, TP.HCM"
 *                 description: "Địa chỉ dọn dẹp"
 *               note:
 *                 type: string
 *                 example: "Cần dọn kỹ phòng khách"
 *                 description: "Ghi chú thêm"
 *               payment_method:
 *                 type: string
 *                 enum: [cash, online]
 *                 example: "cash"
 *                 description: "Phương thức thanh toán"
 *               total_fee:
 *                 type: number
 *                 format: decimal
 *                 example: 500000
 *                 description: "Tổng phí dịch vụ"
 *     responses:
 *       201:
 *         description: Đặt lịch thành công
 *       400:
 *         description: Thiếu thông tin hoặc dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 */
router.post("/book", auth(true), requireCustomer, customerController.bookService);
router.post("/book/trial", auth(true), requireCustomer, customerController.createTrialBooking);
router.post("/book/rebook/:bookingId", auth(true), requireCustomer, customerController.rebookFromHistory);
router.post("/recurring-packages/convert-from-trial", auth(true), requireCustomer, customerController.convertTrialToRecurring);
router.get("/recurring-packages", auth(true), requireCustomer, customerController.getRecurringPackages);
router.patch("/recurring-packages/:packageId/status", auth(true), requireCustomer, customerController.updateRecurringPackageStatus);
router.post("/recurring-packages/:packageId/skip", auth(true), requireCustomer, customerController.skipRecurringSession);
router.post("/recurring-packages/:packageId/reschedule", auth(true), requireCustomer, customerController.rescheduleRecurringSession);
router.get("/service-profile", auth(true), requireCustomer, customerController.getServiceProfile);
router.put("/service-profile", auth(true), requireCustomer, customerController.upsertServiceProfile);
router.get("/service-profile/access", auth(true), requireCustomer, customerController.getAccessProfile);
router.put("/service-profile/access", auth(true), requireCustomer, customerController.upsertAccessProfile);
router.get("/dashboard-summary", auth(true), requireCustomer, customerController.getDashboardSummary);
router.post("/contracts/recurring/:packageId/generate", auth(true), requireCustomer, customerController.generateRecurringContract);
router.get("/contracts", auth(true), requireCustomer, customerController.getMyContracts);

/**
 * @swagger
 * /api/customers/review:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Gửi đánh giá sau khi sử dụng dịch vụ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_booking
 *               - rating
 *             properties:
 *               id_booking:
 *                 type: integer
 *                 example: 12
 *                 description: "ID của booking service"
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *                 description: "Điểm đánh giá từ 1 đến 5"
 *               comment:
 *                 type: string
 *                 example: "Dịch vụ rất tốt, nhân viên thân thiện."
 *                 description: "Nhận xét về dịch vụ"
 *     responses:
 *       201:
 *         description: Gửi đánh giá thành công
 *       400:
 *         description: Dữ liệu đánh giá không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/review", auth(true), requireCustomer, customerController.addReview);

/**
 * @swagger
 * /api/customers/profile:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Xem thông tin cá nhân
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng
 *       401:
 *         description: Người dùng chưa đăng nhập
 *       404:
 *         description: Không tìm thấy thông tin khách hàng
 */
router.get("/profile", auth(true), requireCustomer, customerController.viewProfile);

/**
 * @swagger
 * /api/customers/profile/update:
 *   post:
 *     tags:
 *       - Customers
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
 *                 example: "Nguyễn Văn A"
 *                 description: "Họ tên"
 *               phoneNumber:
 *                 type: string
 *                 example: "0987654321"
 *                 description: "Số điện thoại"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "nguyenvana@example.com"
 *                 description: "Email"
 *               address:
 *                 type: string
 *                 example: "123 Trần Hưng Đạo, Quận 1, TP.HCM"
 *                 description: "Địa chỉ"
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Thiếu thông tin
 *       401:
 *         description: Chưa đăng nhập hoặc token không hợp lệ
 *       500:
 *         description: Lỗi server
 */
router.post("/profile/update", auth(true), requireCustomer, customerController.updateProfile);

// Review Routes
/**
 * @swagger
 * /api/customers/reviews/my:
 *   get:
 *     tags:
 *       - Customers - Reviews
 *     summary: Lấy danh sách đánh giá của khách hàng hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về danh sách đánh giá
 */
router.get("/reviews/my", auth(true), requireCustomer, customerController.getMyReviews);

/**
 * @swagger
 * /api/customers/reviews/booking/{bookingId}:
 *   get:
 *     tags:
 *       - Customers - Reviews
 *     summary: Lấy đánh giá của một booking
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trả về đánh giá
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.get("/reviews/booking/:bookingId", customerController.getReviewByBooking);

/**
 * @swagger
 * /api/customers/reviews/service/{serviceId}:
 *   get:
 *     tags:
 *       - Customers - Reviews
 *     summary: Lấy tất cả đánh giá của một dịch vụ
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trả về danh sách đánh giá
 */
router.get("/reviews/service/:serviceId", customerController.getReviewsByService);

/**
 * @swagger
 * /api/customers/reviews/service/{serviceId}/rating:
 *   get:
 *     tags:
 *       - Customers - Reviews
 *     summary: Lấy rating trung bình của một dịch vụ
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Trả về thống kê rating
 */
router.get("/reviews/service/:serviceId/rating", customerController.getServiceRating);

module.exports = router;
