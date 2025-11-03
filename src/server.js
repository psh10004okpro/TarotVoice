require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { sequelize, testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requireAuth, checkWebAuth } = require('./middleware/auth');
const sttRoutes = require('./routes/sttRoutes');
const ttsRoutes = require('./routes/ttsRoutes');
const audioManagerRoutes = require('./routes/audioManagerRoutes');
const backupRoutes = require('./routes/backupRoutes');
const { setupAutoBackup } = require('./controllers/backupController');
const { setupGoogleCredentials } = require('./utils/googleCredentials');

// Setup Google Cloud credentials for production
setupGoogleCredentials();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for the admin panel
}));
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 웹 UI 루트 경로 (인증 체크) - Static보다 먼저!
app.get('/', checkWebAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 로그인 페이지 (인증 전에 제공)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// 로그인 API
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  const accessPassword = process.env.ACCESS_PASSWORD;

  // 비밀번호가 설정되지 않은 경우
  if (!accessPassword) {
    return res.json({ success: true, message: 'No authentication required' });
  }

  // 비밀번호 확인
  if (password === accessPassword) {
    return res.json({ success: true, message: 'Login successful' });
  }

  // 로그인 실패
  return res.status(401).json({ success: false, message: 'Invalid password' });
});

// 로그아웃 API
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Static files for admin panel (CSS, JS 등)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes (인증 적용)
app.use('/api/stt', requireAuth, sttRoutes);
app.use('/api/tts', requireAuth, ttsRoutes);
app.use('/api/audio-manager', requireAuth, audioManagerRoutes);
app.use('/api/backup', requireAuth, backupRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'TarotVoice Audio Streaming API',
    version: '1.0.0',
    endpoints: {
      stt: {
        transcribe: 'POST /api/stt/transcribe',
        translate: 'POST /api/stt/translate',
      },
      tts: {
        generate: 'POST /api/tts/generate',
        stream: 'GET /api/tts/stream/:id',
        download: 'GET /api/tts/audio/:id',
        info: 'GET /api/tts/info/:id',
        list: 'GET /api/tts/list',
        voices: 'GET /api/tts/voices/:service',
      },
      audioManager: {
        upload: 'POST /api/audio-manager/upload',
        list: 'GET /api/audio-manager/list',
        info: 'GET /api/audio-manager/info/:id',
        stream: 'GET /api/audio-manager/stream/:id',
        download: 'GET /api/audio-manager/download/:id',
        update: 'PUT /api/audio-manager/update/:id',
        delete: 'DELETE /api/audio-manager/delete/:id',
        statistics: 'GET /api/audio-manager/statistics',
      },
      backup: {
        create: 'POST /api/backup/create',
        list: 'GET /api/backup/list',
        download: 'GET /api/backup/download/:filename',
        restore: 'POST /api/backup/restore/:filename',
        delete: 'DELETE /api/backup/delete/:filename',
      },
    },
    documentation: 'See README.md for detailed API documentation',
    adminPanel: 'http://localhost:' + PORT + '/',
  });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synchronized');

    // Setup automatic backups
    setupAutoBackup();

    // Start server
    app.listen(PORT, () => {
      console.log(`\nServer running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API info: http://localhost:${PORT}/api`);
      console.log(`Admin Panel: http://localhost:${PORT}/\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

module.exports = app;
