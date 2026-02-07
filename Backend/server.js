const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');
const socketio = require('socket.io');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const winston = require('winston');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'config', '.env') });

// Import configurations
const { connectDB } = require('./config/db');
const envConfig = require('./config/env');
const paymentConfig = require('./config/payment.config');
const aiConfig = require('./config/ai.config');
const socialConfig = require('./config/social.config');
const features = require('./config/features');
const adsConfig = require('./config/ads.config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const jobRoutes = require('./routes/job.routes');
const companyRoutes = require('./routes/company.routes');
const applicationRoutes = require('./routes/application.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const courseRoutes = require('./routes/course.routes');
const eventRoutes = require('./routes/event.routes');
const certificateRoutes = require('./routes/certificate.routes');
const partnerRoutes = require('./routes/partner.routes');
const donationRoutes = require('./routes/donation.routes');
const adRoutes = require('./routes/ad.routes');
const notificationRoutes = require('./routes/notification.routes');
const analyticsRoutes = require('./routes/analytics.routes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticate, authorize } = require('./middleware/auth');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: envConfig.CLIENT_URL,
    credentials: true,
  },
});

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (envConfig.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: envConfig.CLIENT_URL,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Compression
app.use(compression());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/certificates', express.static(path.join(__dirname, 'certificates')));

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zewed Jobs API',
      version: '1.0.0',
      description: 'API documentation for Zewed Jobs Platform',
      contact: {
        name: 'API Support',
        email: 'support@zewedjobs.com',
      },
    },
    servers: [
      {
        url: `${envConfig.SERVER_URL}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js', './models/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Zewed Jobs API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: envConfig.NODE_ENV,
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', authenticate, authorize(['admin', 'super_admin']), adminRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/partners', partnerRoutes);
app.use('/api/v1/donations', donationRoutes);
app.use('/api/v1/ads', adRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);
app.use('/api/v1/analytics', authenticate, authorize(['admin', 'analyst']), analyticsRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info('New client connected');
  
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`User ${userId} joined socket room`);
  });
  
  socket.on('application_status_update', (data) => {
    io.to(`user_${data.userId}`).emit('status_update', data);
  });
  
  socket.on('new_message', (data) => {
    io.to(`user_${data.receiverId}`).emit('message_received', data);
  });
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Attach io to app for use in controllers
app.set('io', io);

// 404 handler
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// Global error handler
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = envConfig.PORT || 5000;
    
    server.listen(PORT, () => {
      logger.info(`Server running in ${envConfig.NODE_ENV} mode on port ${PORT}`);
      logger.info(`API Documentation: ${envConfig.SERVER_URL}/api-docs`);
      logger.info(`Health Check: ${envConfig.SERVER_URL}/health`);
      
      // Log feature flags
      logger.info('Enabled Features:', features.getEnabledFeatures());
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
    
    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        logger.info('💥 Process terminated!');
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing
