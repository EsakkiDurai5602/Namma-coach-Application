require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.initialize();
    console.log('✅ MySQL database and tables are ready');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.error('   → Verify MySQL is running and .env settings are correct');
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Namma Coach API running on http://localhost:${PORT}`);
    console.log(`   Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Use a different PORT or stop the process using it.`);
      process.exit(1);
    }
    throw err;
  });
}

startServer();
