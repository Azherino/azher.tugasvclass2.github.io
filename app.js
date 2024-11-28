const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const app = express();

// Setup database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'testdb' // Gantilah dengan nama database yang sesuai
});

// Connect ke database
db.connect(err => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database');
});

// Middleware untuk meng-handle JSON request body
app.use(bodyParser.json());

// Secret key untuk JWT (gunakan key yang aman di produksi)
const SECRET_KEY = 'your_secret_key';

// Endpoint login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Query untuk memeriksa kredensial
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Jika user tidak ditemukan
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Jika login berhasil, buat token
    const user = results[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' } // Token berlaku selama 1 jam
    );

    // Kirimkan response login success dan access token
    res.json({
      message: 'Login successful',
      accessToken: token
    });
  });
});

// Middleware untuk memverifikasi token JWT
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(403).json({ message: 'Access denied, token required' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.id; // Menyimpan ID pengguna dalam request
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid token' });
  }
};

// Endpoint yang dilindungi oleh token (contoh penggunaan)
app.get('/protected', verifyToken, (req, res) => {
  // Dapatkan ID pengguna dari token
  const userId = req.userId;

  // Respon sukses yang menunjukkan ID pengguna yang terverifikasi
  res.json({
    message: 'Protected data accessed',
    userId: userId
  });
});

// Mulai server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
