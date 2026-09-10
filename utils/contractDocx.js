const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const TEMPLATE_PATH = path.join(__dirname, '..', 'NoDirt_Contract_Template.docx');

const ensureContractsDirectory = () => {
  const targetDir = path.join(__dirname, '..', 'uploads', 'contracts');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
};

/**
 * Tạo file hợp đồng Word (.docx) từ template NoDirt_Contract_Template.docx
 * bằng cách thay thế các placeholder {{...}}.
 *
 * @param {Object} options
 * @param {string} options.fileName        - Tên file output, ví dụ "CTR-123456789.docx"
 * @param {string} options.contractCode    - Mã hợp đồng
 * @param {string} options.customerName    - Tên khách hàng
 * @param {string} options.phone           - Số điện thoại khách hàng
 * @param {string} options.email           - Email khách hàng
 * @param {string} options.address         - Địa chỉ thực hiện dịch vụ
 * @param {string} options.serviceType     - Tên dịch vụ
 * @param {string} options.frequency       - Tần suất (Hàng tuần / Hàng tháng)
 * @param {number} options.numberOfSessions - Số buổi dịch vụ
 * @param {string} options.startDate       - Ngày bắt đầu (dd/mm/yyyy)
 * @param {string} options.cleaningTime    - Giờ làm việc (HH:mm)
 * @param {string} options.price           - Giá đã báo cho khách mỗi buổi = basicPrice × sqm (đã format, ví dụ "1.500.000")
 * @returns {string} Đường dẫn tuyệt đối tới file đã tạo
 */
const generateContractDocx = (options) => {
  const {
    fileName,
    contractCode,
    customerName,
    phone,
    email,
    address,
    serviceType,
    frequency,
    numberOfSessions,
    startDate,
    cleaningTime,
    price,
  } = options;

  // Đọc template
  const templateBuffer = fs.readFileSync(TEMPLATE_PATH);
  const zip = new PizZip(templateBuffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });

  // Ngày ký hợp đồng (local)
  const now = new Date();
  const signDay   = String(now.getDate()).padStart(2, '0');
  const signMonth = String(now.getMonth() + 1).padStart(2, '0');
  const signYear  = String(now.getFullYear());
  const signedDate = `${signDay}/${signMonth}/${signYear}`;

  // Render — thay thế tất cả placeholder
  doc.render({
    contractCode,
    customerName,
    phone:            phone || '—',
    email:            email || '—',
    address:          address || '—',
    serviceType,
    frequency,
    numberOfSessions: String(numberOfSessions),
    startDate,
    cleaningTime:     cleaningTime ? cleaningTime.substring(0, 5) : '—',
    price,
    signedDate,
    signDay,
    signMonth,
    signYear,
  });

  // Ghi file ra đĩa
  const directory = ensureContractsDirectory();
  const filePath = path.join(directory, fileName);
  const outputBuffer = doc.getZip().generate({ type: 'nodebuffer' });
  fs.writeFileSync(filePath, outputBuffer);

  return filePath;
};

module.exports = { generateContractDocx };
