const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const db = require('./config/database');

// Load env vars
dotenv.config();

// Route files
const authRoutes = require('./routes/authRoutes');
const tenderRoutes = require('./routes/tenderRoutes');
const bidderRoutes = require('./routes/bidderRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const auditRoutes = require('./routes/auditRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const twilioRoutes = require('./routes/twilioRoutes');
const alertRoutes = require('./routes/alertRoutes');
const vendorRoutes = require('./routes/vendorRoutes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet());

// Dev logging middleware
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'BidVerify AI Backend is running 🚀' });
});

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/tenders', tenderRoutes);
app.use('/api/bidders', bidderRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/voice', twilioRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/vendor', vendorRoutes);

const cloudStorageService = require('./services/cloudStorageService');
app.get('/api/uploads/:filename', (req, res) => {
  try {
    const blob = cloudStorageService.getBlob(req.params.filename);
    if (!blob) {
      return res.status(404).send('File not found');
    }
    const buffer = Buffer.from(blob.base64_data, 'base64');
    res.setHeader('Content-Type', blob.mimetype);
    res.send(buffer);
  } catch (err) {
    res.status(500).send('Error retrieving file');
  }
});

// Catch-all 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Custom error handler (for API routes)
app.use(errorHandler);

// --- FULLSTACK INTEGRATION ---
// Serve frontend static files
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
// Local uploads static middleware removed for serverless deployment


// Handle missing static assets with 404 instead of falling through to index.html
app.use('/assets', (req, res) => {
  res.status(404).type('text/plain').send('Asset not found');
});

const indexPath = path.join(__dirname, '../../frontend/dist/index.html');

// Catch-all route to serve React's index.html for client-side routing
app.get('*', (req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      success: true,
      message: 'BidVerify AI API is operational. Frontend build artifact not found (run npm run build in frontend directory).',
      health: '/api/health'
    });
  }
});

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;
let currentServer = null;

function startServer(port = DEFAULT_PORT, maxRetries = 3) {
  const server = app.listen(port);
  currentServer = server;

  server.on('listening', () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
    console.log(`📡 API available at http://localhost:${port}/api`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (maxRetries > 0) {
        const nextPort = Number(port) + 1;
        console.warn(`⚠️ Port ${port} is in use (EADDRINUSE). Attempting fallback to port ${nextPort}...`);
        startServer(nextPort, maxRetries - 1);
      } else {
        console.error(`❌ Port ${port} is already in use and max retries exceeded. Please terminate the conflicting process or specify another PORT.`);
      }
    } else {
      console.error('❌ Server startup error:', err.message);
    }
  });

  return server;
}

// Graceful shutdown listeners to flush DB and cleanly close connections
let isShuttingDown = false;
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  try {
    if (typeof db.save === 'function') {
      db.save();
      console.log('💾 Database state flushed to disk.');
    }
  } catch (dbErr) {
    console.warn('⚠️ Error saving DB during shutdown:', dbErr.message);
  }

  if (currentServer) {
    currentServer.close(() => {
      console.log('🔌 HTTP server closed cleanly.');
      process.exit(0);
    });

    setTimeout(() => {
      console.warn('⚠️ Shutdown timed out, forcing exit.');
      process.exit(0);
    }, 3000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Initialize database, then start server (skip port listen on Vercel serverless)
if (!process.env.VERCEL) {
  db.init().then(() => {
    startServer(DEFAULT_PORT);
  }).catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });
} else {
  db.init().catch(err => {
    console.warn('⚠️ Vercel database initialization warning:', err.message);
  });
}

module.exports = app;

