const winston = require('winston');
const { format } = winston;
const path = require('path');

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

// Configure winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        customFormat
      )
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '..', '..', 'logs', 'app.log'),
      maxsize: 10000000, // 10MB
      maxFiles: 5,
    })
  ]
});

// Override console.log
console.log = (...args) => logger.info(args.join(' '));

module.exports = logger;