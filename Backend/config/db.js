const mongoose = require('mongoose');
const winston = require('winston');
const envConfig = require('./env');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/db.log' }),
  ],
});

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      envConfig.NODE_ENV === 'production'
        ? envConfig.MONGODB_URI_PROD
        : envConfig.MONGODB_URI,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    );

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to database');
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from database');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed through app termination');
      process.exit(0);
    });
    
    // Set mongoose options
    mongoose.set('strictQuery', true);
    mongoose.set('debug', envConfig.NODE_ENV === 'development');
    
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Database models auto-import
const loadModels = () => {
  require('../models/User');
  require('../models/Job');
  require('../models/Company');
  require('../models/Application');
  require('../models/Payment');
  require('../models/Course');
  require('../models/Event');
  require('../models/Certificate');
  require('../models/Partner');
  require('../models/Donation');
  require('../models/Ad');
  require('../models/Notification');
  require('../models/Conversation');
  require('../models/Message');
  require('../models/Review');
  logger.info('Database models loaded');
};

// Database health check
const checkDBHealth = async () => {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const latency = Date.now() - startTime;
    
    const status = {
      status: 'healthy',
      latency: `${latency}ms`,
      connections: mongoose.connection.readyState,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
    };
    
    logger.info('Database health check passed', status);
    return status;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
};

// Database utilities
const dbUtils = {
  // Transaction wrapper
  transaction: async (operations) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const result = await operations(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  },
  
  // Bulk operations
  bulkInsert: async (model, data) => {
    return await model.insertMany(data, { ordered: false });
  },
  
  bulkUpdate: async (model, filter, update) => {
    return await model.updateMany(filter, update);
  },
  
  bulkDelete: async (model, filter) => {
    return await model.deleteMany(filter);
  },
  
  // Aggregation helpers
  aggregateWithPagination: async (model, pipeline, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    
    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limit },
    ];
    
    const [countResult, data] = await Promise.all([
      model.aggregate(countPipeline),
      model.aggregate(dataPipeline),
    ]);
    
    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    };
  },
};

module.exports = {
  connectDB,
  loadModels,
  checkDBHealth,
  dbUtils,
  mongoose,
};
