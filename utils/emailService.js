const nodemailer = require('nodemailer');

const roleLabels = {
  customer: 'khách hàng',
  employee: 'nhân viên',
  manager: 'quản lý',
  admin: 'quản trị viên',
};

const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const getRoleLabel = (type) => roleLabels[type] || 'người dùng';

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Dịch Vụ Dọn Dẹp" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(' Email đã được gửi:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(' Lỗi khi gửi email:', error);
    return { success: false, error: error.message };
  }
};

const getResetPasswordEmailTemplate = (name, resetLink, userType) => {
  const roleLabel = getRoleLabel(userType);
  return {
    subject: ' Yêu cầu đặt lại mật khẩu',
    html: `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#f3f4f6;">
          <div style="
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
            max-width:600px;
            margin:0 auto;
            background-color:#ffffff;
            box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);
          ">
            <!-- Header -->
            <div style="background-color:#2563eb;padding:40px 20px;text-align:center;">
              <div style="
                width:60px;
                height:60px;
                background-color:#ffffff;
                border-radius:12px;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                margin-bottom:16px;
              ">
              </div>
              <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0;">NoDirt</h1>
            </div>

            <!-- Body -->
            <div style="padding:40px 20px;">
              <!-- Main Content -->
              <div style="text-align:center;margin-bottom:32px;">
                <h2 style="color:#111827;font-size:24px;font-weight:600;margin:0 0 16px 0;">
                  Đặt lại mật khẩu của bạn
                </h2>
                <p style="color:#6b7280;font-size:16px;line-height:24px;margin:0;">
                  Xin chào ${name}, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${roleLabel} của bạn.
                </p>
              </div>

              <!-- Reset Button -->
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${resetLink}" style="
                  display:inline-block;
                  background-color:#2563eb;
                  color:#ffffff;
                  font-size:16px;
                  font-weight:600;
                  padding:16px 40px;
                  border-radius:8px;
                  text-decoration:none;
                  box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);
                ">
                  Đặt lại mật khẩu
                </a>
                <p style="color:#9ca3af;font-size:14px;margin-top:16px;">
                  Link này sẽ hết hạn sau 60 phút
                </p>
              </div>

              <!-- Alternative Link -->
              <div style="
                background-color:#fef3c7;
                border-left:4px solid #f59e0b;
                border-radius:4px;
                padding:16px;
                margin-bottom:32px;
              ">
                <p style="color:#92400e;font-size:14px;margin:0 0 8px 0;font-weight:600;">
                  Nút không hoạt động?
                </p>
                <p style="color:#78350f;font-size:14px;margin:0 0 8px 0;">
                  Sao chép và dán link sau vào trình duyệt:
                </p>
                <p style="
                  color:#1f2937;
                  font-size:13px;
                  margin:0;
                  word-break:break-all;
                  background-color:#ffffff;
                  padding:8px;
                  border-radius:4px;
                  font-family:monospace;
                ">
                  ${resetLink}
                </p>
              </div>

              <!-- Security Notice -->
              <div style="
                background-color:#fee2e2;
                border-left:4px solid #ef4444;
                border-radius:4px;
                padding:16px;
                margin-bottom:24px;
              ">
                <p style="color:#991b1b;font-size:14px;margin:0 0 8px 0;font-weight:600;">
                  Lưu ý bảo mật
                </p>
                <p style="color:#7f1d1d;font-size:14px;margin:0;line-height:20px;">
                  Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay.
                  Không chia sẻ link này với bất kỳ ai.
                </p>
              </div>

              <p style="color:#6b7280;font-size:14px;margin:0;">
                Trân trọng,<br />
                <strong>Đội ngũ NoDirt</strong>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
};

const sendResetPasswordEmail = async (email, name, resetToken, userType) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${userType}/reset-password?token=${resetToken}`;
  const template = getResetPasswordEmailTemplate(name, resetLink, userType);
  return await sendEmail(email, template.subject, template.html);
};

// ============================================================
// Base layout helper — dùng chung cho tất cả email templates
// ============================================================
const wrapEmailLayout = (headerBgColor, bodyHtml) => `
<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;">
    <div style="
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
      max-width:600px;
      margin:0 auto;
      background-color:#ffffff;
      box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);
    ">
      <!-- Header -->
      <div style="background-color:${headerBgColor};padding:40px 20px;text-align:center;">
        <div style="
          width:60px;
          height:60px;
          background-color:#ffffff;
          border-radius:12px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          margin-bottom:16px;
        "></div>
        <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:0;">NoDirt</h1>
      </div>

      <!-- Body -->
      <div style="padding:40px 20px;">
        ${bodyHtml}

        <p style="color:#6b7280;font-size:14px;margin:24px 0 0 0;">
          Trân trọng,<br />
          <strong>Đội ngũ NoDirt</strong>
        </p>
      </div>
    </div>
  </body>
</html>
`;

const infoRow = (label, value) => `
  <tr>
    <td style="padding:8px 12px;color:#6b7280;font-size:14px;border-bottom:1px solid #f3f4f6;white-space:nowrap;">${label}</td>
    <td style="padding:8px 12px;color:#111827;font-size:14px;font-weight:500;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>
`;

const bookingTypeLabels = {
  one_time: 'Đặt lẻ',
  trial: 'Buổi dùng thử',
  recurring: 'Gói định kỳ',
};

// ============================================================
// Template 1: Xác nhận đặt lịch
// ============================================================
const getBookingConfirmationTemplate = (customerName, details) => {
  const typeLabel = bookingTypeLabels[details.bookingType] || 'Đặt lẻ';
  const dateStr = new Date(details.bookingDay).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const fee = Number(details.totalFee || 0).toLocaleString('vi-VN');

  const body = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">✅</div>
      <h2 style="color:#111827;font-size:24px;font-weight:600;margin:0 0 12px 0;">
        Đặt lịch thành công!
      </h2>
      <p style="color:#6b7280;font-size:16px;line-height:24px;margin:0;">
        Xin chào <strong>${customerName}</strong>, đơn đặt lịch của bạn đã được ghi nhận.
      </p>
    </div>

    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:4px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Dịch vụ', details.serviceName)}
        ${infoRow('Loại đặt lịch', typeLabel)}
        ${infoRow('Ngày', dateStr)}
        ${infoRow('Giờ', details.cleaningTime)}
        ${infoRow('Địa chỉ', details.address)}
        ${infoRow('Tổng phí', fee + ' VNĐ')}
      </table>
    </div>

    <div style="
      background-color:#eff6ff;
      border-left:4px solid #3b82f6;
      border-radius:4px;
      padding:16px;
      margin-bottom:24px;
    ">
      <p style="color:#1e40af;font-size:14px;margin:0;line-height:20px;">
        <strong>Lưu ý:</strong> Chúng tôi sẽ sớm phân công nhân viên cho đơn hàng của bạn.
        Bạn sẽ nhận được email thông báo khi nhân viên được phân công.
      </p>
    </div>
  `;

  return {
    subject: '✅ Xác nhận đặt lịch thành công — NoDirt',
    html: wrapEmailLayout('#10b981', body),
  };
};

const sendBookingConfirmationEmail = async (email, customerName, details) => {
  const template = getBookingConfirmationTemplate(customerName, details);
  return await sendEmail(email, template.subject, template.html);
};

// ============================================================
// Template 2: Nhắc nhở 24h trước buổi dọn
// ============================================================
const getBookingReminderTemplate = (customerName, details) => {
  const dateStr = new Date(details.bookingDay).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let employeeInfo = '';
  if (details.employeeName) {
    employeeInfo = `
      ${infoRow('Nhân viên', details.employeeName)}
      ${details.employeePhone ? infoRow('SĐT nhân viên', details.employeePhone) : ''}
    `;
  }

  const body = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">🔔</div>
      <h2 style="color:#111827;font-size:24px;font-weight:600;margin:0 0 12px 0;">
        Nhắc nhở lịch dọn dẹp ngày mai
      </h2>
      <p style="color:#6b7280;font-size:16px;line-height:24px;margin:0;">
        Xin chào <strong>${customerName}</strong>, bạn có lịch dọn dẹp vào ngày mai.
      </p>
    </div>

    <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:4px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Dịch vụ', details.serviceName)}
        ${infoRow('Ngày', dateStr)}
        ${infoRow('Giờ', details.cleaningTime)}
        ${infoRow('Địa chỉ', details.address)}
        ${employeeInfo}
      </table>
    </div>

    <div style="
      background-color:#fef3c7;
      border-left:4px solid #f59e0b;
      border-radius:4px;
      padding:16px;
      margin-bottom:24px;
    ">
      <p style="color:#92400e;font-size:14px;margin:0;line-height:20px;">
        <strong>Lưu ý:</strong> Vui lòng đảm bảo có người ở nhà hoặc chuẩn bị phương thức truy cập
        cho nhân viên. Nếu cần thay đổi lịch, vui lòng thao tác trước giờ dọn dẹp.
      </p>
    </div>
  `;

  return {
    subject: '🔔 Nhắc nhở: Lịch dọn dẹp ngày mai — NoDirt',
    html: wrapEmailLayout('#f59e0b', body),
  };
};

const sendBookingReminderEmail = async (email, customerName, details) => {
  const template = getBookingReminderTemplate(customerName, details);
  return await sendEmail(email, template.subject, template.html);
};

// ============================================================
// Template 3: Thông báo phân công nhân viên
// ============================================================
const getEmployeeAssignedTemplate = (customerName, details) => {
  const dateStr = new Date(details.bookingDay).toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const body = `
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">👤</div>
      <h2 style="color:#111827;font-size:24px;font-weight:600;margin:0 0 12px 0;">
        Nhân viên đã được phân công
      </h2>
      <p style="color:#6b7280;font-size:16px;line-height:24px;margin:0;">
        Xin chào <strong>${customerName}</strong>, đơn hàng của bạn đã được phân công nhân viên.
      </p>
    </div>

    <div style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:4px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        ${infoRow('Nhân viên', details.employeeName)}
        ${details.employeePhone ? infoRow('SĐT nhân viên', details.employeePhone) : ''}
        ${infoRow('Dịch vụ', details.serviceName)}
        ${infoRow('Ngày', dateStr)}
        ${infoRow('Giờ', details.cleaningTime)}
        ${infoRow('Địa chỉ', details.address)}
      </table>
    </div>

    <div style="
      background-color:#f0fdf4;
      border-left:4px solid #10b981;
      border-radius:4px;
      padding:16px;
      margin-bottom:24px;
    ">
      <p style="color:#065f46;font-size:14px;margin:0;line-height:20px;">
        <strong>Mọi thứ đã sẵn sàng!</strong> Nhân viên sẽ đến đúng giờ đã hẹn.
        Nếu có thắc mắc, vui lòng liên hệ qua số điện thoại nhân viên ở trên.
      </p>
    </div>
  `;

  return {
    subject: '👤 Nhân viên đã được phân công — NoDirt',
    html: wrapEmailLayout('#3b82f6', body),
  };
};

const sendEmployeeAssignedEmail = async (email, customerName, details) => {
  const template = getEmployeeAssignedTemplate(customerName, details);
  return await sendEmail(email, template.subject, template.html);
};

module.exports = {
  sendEmail,
  sendResetPasswordEmail,
  getResetPasswordEmailTemplate,
  sendBookingConfirmationEmail,
  sendBookingReminderEmail,
  sendEmployeeAssignedEmail,
};

