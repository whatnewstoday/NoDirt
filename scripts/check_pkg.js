const db = require('../config/db');
(async () => {
  try {
    require('../controllers/customerController');
    console.log('customerController OK');
  } catch (e) {
    console.error('customerController FAILED:', e.message);
  }
  process.exit();
})();
