const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.printf(({ level, message, ...meta }) => {
      let logMessage = `[${level}]: ${message}`;
      if (Object.keys(meta).length > 0) {
        logMessage += '\n' + JSON.stringify(meta, null, 2);
      }
      return logMessage;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
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