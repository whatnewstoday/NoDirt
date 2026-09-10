const bcrypt = require("bcrypt");

const hash = async (password) => {
  return await bcrypt.hash(password, 10);
};

const compare = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = { hash, compare };