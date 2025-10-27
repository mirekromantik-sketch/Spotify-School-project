const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',        // XAMPP default username
  password: '',        // XAMPP default password (usually empty)
  database: 'spotifydb'
});

module.exports = pool.promise();
