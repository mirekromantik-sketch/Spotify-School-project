const db = require('./db');

(async () => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    console.log('Database connected successfully:', rows[0].result);
    process.exit(0);
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
})();
