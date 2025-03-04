const winston = require('winston');
const { format } = winston;
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', '..', 'logs');
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
} catch (error) {
  console.error('Error creating logs directory:', error);
  // Continue without file logging if directory creation fails
}

// Helper function to handle circular references
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
};

// Custom format for log messages
const customFormat = format.printf(({ level, message, timestamp, ...meta }) => {
  let logMessage = `${level}: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    try {
      logMessage += '\n' + JSON.stringify(meta, getCircularReplacer(), 2);
    } catch (error) {
      logMessage += '\n[Error serializing metadata]';
    }
  }
  
  return logMessage;
});

// Configure winston logger with transports
const transports = [
  new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      customFormat
    )
  })
];

// Only add file transport if logs directory exists
if (fs.existsSync(logsDir)) {
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logsDir, 'app.log'),
      maxsize: 10000000, // 10MB
      maxFiles: 5,
    })
  );
}

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    customFormat
  ),
  transports: transports
});

// Override console.log
console.log = (...args) => logger.info(args.join(' '));

module.exports = logger;