require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/db');
const { initMailer } = require('./config/mailer');
const { initEscalationCron } = require('./cron/escalationCron');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const brandRoutes = require('./routes/brandRoutes');
const branchRoutes = require('./routes/branchRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const statsRoutes = require('./routes/statsRoutes');

const User = require('./models/User');
const seedDatabase = require('./utils/seedData');

const app = express();

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploads statically
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EscalateHQ API Gateway',
    version: '1.0.0',
  });
});

// Mount Core API Routes
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/stats', statsRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Auto-seed if database is completely empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] No records detected. Seeding sample dataset...');
      await seedDatabase();
    }

    // 3. Initialize mailer
    await initMailer();

    // 4. Start 48-hour SLA cron scheduler
    initEscalationCron();

    // 5. Start HTTP server
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 EscalateHQ Backend running on port ${PORT}`);
      console.log(`📡 API Endpoints: http://localhost:${PORT}/api`);
      console.log(`📂 Proof Uploads: http://localhost:${PORT}/uploads`);
      console.log(`===============================================`);
    });
  } catch (err) {
    console.error(`[Server Start Error] ${err.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
