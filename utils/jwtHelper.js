// utils/jwtHelper.js
const jwt = require('jsonwebtoken');

/**
 * Tạo JWT token cho user
 * @param {Object} payload - Dữ liệu cần mã hóa vào token
 * @param {string} expiresIn - Thời gian hết hạn, mặc định 24h
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = '24h') => {
  const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Tạo token cho customer sau khi login
 * @param {Object} customer - Thông tin customer từ database
 * @returns {string} JWT token
 */
const generateCustomerToken = (customer) => {
  const payload = {
    id: customer.id,
    userId: customer.id,
    email: customer.email,
    role: 'customer'
  };
  return generateToken(payload, '24h');
};

/**
 * Tạo token cho employee sau khi login
 * @param {Object} employee - Thông tin employee từ database
 * @returns {string} JWT token
 */
const generateEmployeeToken = (employee) => {
  const payload = {
    id: employee.id,
    userId: employee.id,
    email: employee.email,
    role: 'employee'
  };
  return generateToken(payload, '24h');
};

/**
 * Tạo token cho admin sau khi login
 * @param {Object} admin - Thông tin admin từ database
 * @returns {string} JWT token
 */
const generateAdminToken = (admin) => {
  const payload = {
    id: admin.id,
    userId: admin.id,         // Giữ lại để backwards compatible
    username: admin.username,
    role: 'admin'
  };
  return generateToken(payload, '24h');
};

/**
 * Tạo token cho manager sau khi login
 * @param {Object} manager - Thông tin manager từ database
 * @returns {string} JWT token
 */
const generateManagerToken = (manager) => {
  const payload = {
    id: manager.id,
    userId: manager.id,       // Giữ lại để backwards compatible
    username: manager.username,
    email: manager.email,
    role: 'manager'
  };
  return generateToken(payload, '24h');
};

/**
 * Verify JWT token
 * @param {string} token - JWT token cần verify
 * @returns {Object} Decoded payload nếu valid
 * @throws {Error} Nếu token không hợp lệ
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
  return jwt.verify(token, secret);
};

/**
 * Decode token mà không verify (không khuyến khích dùng cho security)
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  generateCustomerToken,
  generateEmployeeToken,
  generateAdminToken,
  generateManagerToken,
  verifyToken,
  decodeToken
};

