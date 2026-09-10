const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const getKey = () => {
  const secret = process.env.ACCESS_SECRET_KEY;
  if (!secret) {
    throw new Error('ACCESS_SECRET_KEY is not set in environment. Please add a 32+ char secret to .env');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encrypt = (plainText) => {
  if (plainText == null || plainText === '') return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decrypt = (cipherText) => {
  if (!cipherText) return null;
  try {
    const key = getKey();
    const data = Buffer.from(cipherText, 'base64');
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Access data decryption failed:', error.message);
    return null;
  }
};

const maskPin = (value) => {
  if (!value) return null;
  const str = String(value);
  if (str.length <= 2) return '*'.repeat(str.length);
  return `${'*'.repeat(Math.max(str.length - 2, 2))}${str.slice(-2)}`;
};

module.exports = {
  encrypt,
  decrypt,
  maskPin,
};
